import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { registerThemeRoutes } from '../theme-route.js'

// Isolated development shell, never reads or writes a user's real DSH settings.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.env.DSH_HOME = resolve(root, '.preview-state')
const bundle = await build({ entryPoints: [resolve(root, 'scripts/preview-ui.jsx')], bundle: true, write: false, format: 'iife', define: { 'process.env.NODE_ENV': '"development"' } })
const routes = []
registerThemeRoutes({ inject(_keys, cb) { cb({ webRuntime: { trustedHosts: [] }, effect: fn => fn(), webServer: { register: route => routes.push(route) } }) } })
const server = createServer((req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname
  const route = routes.find(r => r.kind === 'exact' ? path === r.path : path.startsWith(`${r.path}/`))
  if (route) return void route.handler(req, res)
  const entries = { '/': ['text/html; charset=utf-8', readFileSync(resolve(root, 'scripts/preview.html'))], '/preview.js': ['application/javascript', bundle.outputFiles[0].contents], '/client.js': ['application/javascript', readFileSync(resolve(root, 'client.js'))] }
  const entry = entries[path]
  if (!entry) return res.writeHead(404).end()
  res.writeHead(200, { 'content-type': entry[0], 'cache-control': 'no-store' }).end(entry[1])
})
const port = Number(process.env.PORT || 4173)
server.listen(port, '127.0.0.1', () => console.log(`Klee preview: http://127.0.0.1:${port}`))
