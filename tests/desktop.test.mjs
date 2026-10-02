import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerThemeRoutes } from '../theme-route.js'

// Desktop's authenticated forwardWebRequest strips host/origin/cookie/sec-fetch-site,
// then adds its owned Host cookie. The host auth gate is owned by Harness, not themes.
// Do not whitelist dsh-app origins in the theme's HTTP boundary.
test('desktop-forwarded requests save and restore; raw foreign origins remain rejected', async () => {
  const originalHome = process.env.DSH_HOME
  const home = mkdtempSync(join(tmpdir(), 'klee-desktop-'))
  process.env.DSH_HOME = home
  const routes = []
  registerThemeRoutes({ inject(_services, fn) { fn({ webRuntime: { trustedHosts: [] }, effect: fn => fn(), webServer: { register: route => routes.push(route) } }) } })
  const server = createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname
    const route = routes.find(r => r.kind === 'exact' ? r.path === pathname : pathname.startsWith(`${r.path}/`))
    if (route) void route.handler(req, res)
    else res.writeHead(404).end()
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const base = `http://127.0.0.1:${server.address().port}`
  const post = (value, headers = {}) => fetch(`${base}/klee-clover-theme/settings`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(value) })
  try {
    const preferences = { sidebarOpacity: 36, characterSize: 72, characterPosition: 50, characterLayoutVersion: 1, liquidGlass: false }
    assert.equal((await post({ method: 'set', appearance: preferences })).status, 200)
    assert.deepEqual((await (await post({ method: 'get' })).json()).value.appearance, preferences)
    assert.deepEqual(JSON.parse(readFileSync(join(home, 'klee-clover-theme.json'), 'utf8')).appearance, preferences)
    for (const origin of ['dsh-app://app', 'dsh-app://shell', 'https://evil.example', 'null']) {
      assert.equal((await post({ method: 'set', appearance: {} }, { origin })).status, 403, origin)
    }
    assert.equal((await post({ method: 'set', appearance: {} }, { 'sec-fetch-site': 'cross-site' })).status, 403)
    const manifest = await (await fetch(`${base}/klee-clover-theme/manifest`)).json()
    for (const path of Object.values(manifest)) {
      assert.ok(path.startsWith('/klee-clover-theme/asset/'))
      assert.equal(new URL(path, 'dsh-app://app/').host, 'app')
      const asset = await fetch(`${base}${path}`)
      assert.equal(asset.status, 200)
      assert.ok((await asset.arrayBuffer()).byteLength > 0)
    }
  } finally {
    await new Promise(done => server.close(done))
    if (originalHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = originalHome
    rmSync(home, { recursive: true, force: true })
  }
})

test('shared web module metadata and Desktop caption safeguards are packaged', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)))
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(pkg.files.includes('scripts/dsh-command.ps1'))
  const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  for (const marker of ['html[data-windows-titlebar]', 'html[data-platform="darwin"]', 'html[data-fullscreen]', '--dsh-windows-sidebar-width', 'max-height: calc(100vh - var(--klee-chrome-top))']) assert.ok(client.includes(marker), marker)
  const installer = readFileSync(new URL('../install.ps1', import.meta.url), 'utf8')
  assert.ok(installer.includes('add "file:$pluginDir"'))
  assert.ok(installer.indexOf("if ($Profile -eq 'desktop')") < installer.indexOf('& npm install'))
})
