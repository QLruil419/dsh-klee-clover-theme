import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

function mountSettings(saved) {
  let plugin
  let component
  let effectCount = 0
  let hookIndex = 0
  const hooks = []
  const writes = []
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useEffect() {},
    useState(initial) {
      const index = hookIndex++
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial
      return [hooks[index], value => { hooks[index] = typeof value === 'function' ? value(hooks[index]) : value }]
    },
  }
  const sandbox = {
    window: { __ModuleLoader__: { load(entry) { plugin = entry.factory(() => React) } } },
    localStorage: { getItem: () => JSON.stringify(saved), setItem() {} },
    document: { body: { style: { setProperty() {} }, setAttribute() {} } },
    setTimeout: () => 1, clearTimeout() {}, console,
    fetch: async (_url, options) => { writes.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ ok: true }) } },
  }
  runInNewContext(readFileSync(new URL('../client.js', import.meta.url), 'utf8'), sandbox)
  plugin.apply({
    effect(fn) { if (effectCount++ === 0) fn() },
    slots: { inject(_name, fn) { fn() }, register(_slot, view) { component = view } },
  })
  const render = () => { hookIndex = 0; return component() }
  return { render, hooks, writes }
}

function findNode(node, predicate) {
  if (!node || typeof node !== 'object') return undefined
  if (predicate(node)) return node
  for (const child of node.children ?? []) {
    const found = findNode(child, predicate)
    if (found) return found
  }
}

test('old right-aligned preferences center once while retaining other controls; new positions persist', async () => {
  const settings = mountSettings({ characterPosition: 76, characterSize: 83, panelOpacity: 73, liquidGlass: false })
  let view = settings.render()
  assert.equal(settings.hooks[0].characterPosition, 50)
  assert.equal(settings.hooks[0].characterLayoutVersion, 1)
  assert.equal(settings.hooks[0].characterSize, 83)
  assert.equal(settings.hooks[0].panelOpacity, 73)
  assert.equal(settings.hooks[0].liquidGlass, false)
  const position = findNode(view, node => node.props.label === '可莉水平位置')
  position.props.onChange(65)
  view = settings.render()
  await findNode(view, node => node.type === 'button' && node.children.includes('保存设置')).props.onClick()
  assert.equal(settings.writes.at(-1).appearance.characterPosition, 65)
  assert.equal(settings.writes.at(-1).appearance.characterLayoutVersion, 1)
  assert.equal(settings.writes.at(-1).appearance.panelOpacity, 73)
  const reopened = mountSettings(settings.writes.at(-1).appearance)
  reopened.render()
  assert.equal(reopened.hooks[0].characterPosition, 65)
})
