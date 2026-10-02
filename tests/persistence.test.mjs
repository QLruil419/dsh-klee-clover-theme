import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { registerThemeRoutes } from '../theme-route.js'

function startHost() {
  const routes = []
  registerThemeRoutes({ inject(_services, callback) {
    callback({ webRuntime: { trustedHosts: [] }, effect: fn => fn(), webServer: { register: route => routes.push(route) } })
  } })
  const server = createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname
    const route = routes.find(r => r.kind === 'exact' ? r.path === pathname : pathname.startsWith(`${r.path}/`))
    if (route) return void route.handler(request, response)
    response.writeHead(404).end()
  })
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise(done => server.close(done)),
  })))
}

test('appearance survives a host restart on a different port; routes reject unsafe input', async () => {
  const oldHome = process.env.DSH_HOME
  const temp = mkdtempSync(join(tmpdir(), 'klee-theme-test-'))
  process.env.DSH_HOME = temp
  let host = await startHost()
  const post = (value, headers = {}) => fetch(`${host.url}/klee-clover-theme/settings`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(value),
  })
  try {
    assert.equal((await (await post({ method: 'get' })).json()).value.appearance, null)
    const expected = { sidebarArtBottom: 246, characterSize: 74, characterPosition: 65, characterLayoutVersion: 1, mascotSize: 192, liquidGlass: false }
    assert.equal((await post({ method: 'set', appearance: expected })).status, 200)
    assert.deepEqual(JSON.parse(readFileSync(join(temp, 'klee-clover-theme.json'), 'utf8')).appearance, expected)
    const firstPort = host.url
    await host.close()
    host = await startHost()
    assert.notEqual(host.url, firstPort)
    assert.deepEqual((await (await post({ method: 'get' })).json()).value.appearance, expected)
    assert.equal((await post({ method: 'set', appearance: {} }, { origin: 'https://untrusted.example' })).status, 403)
    assert.equal((await post({ method: 'set', appearance: [] })).status, 400)
    assert.equal((await post({ method: 'set', appearance: { mascotSize: 9999, characterSize: null, injected: 'no' } })).status, 200)
    assert.deepEqual((await (await post({ method: 'get' })).json()).value.appearance, { mascotSize: 480 })
    assert.equal((await fetch(`${host.url}/klee-clover-theme/settings`)).status, 405)
    assert.equal((await post({ method: 'get', junk: 'x'.repeat(17000) })).status, 400)
    assert.equal((await fetch(`${host.url}/klee-clover-theme/asset/__proto__`)).status, 404)
    const manifest = await (await fetch(`${host.url}/klee-clover-theme/manifest`)).json()
    for (const [key, path] of Object.entries(manifest)) {
      const asset = await fetch(`${host.url}${path}`)
      assert.equal(asset.status, 200, key)
      assert.ok((await asset.arrayBuffer()).byteLength > 100, key)
    }
  } finally {
    await host.close()
    if (oldHome === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = oldHome
    rmSync(temp, { recursive: true, force: true })
  }
})
