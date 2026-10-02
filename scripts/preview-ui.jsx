import React from 'react'
import { createRoot } from 'react-dom/client'

let PluginSettings
const disposers = []
window.__ModuleLoader__ = { load({ id, factory }) {
  if (id !== 'dsh-klee-clover-theme') throw new Error('Incorrect plugin registration')
  const plugin = factory(name => { if (name === 'react') return React; throw new Error(`Unexpected import: ${name}`) })
  plugin.apply({
    effect(fn) { const dispose = fn(); if (typeof dispose === 'function') disposers.push(dispose) },
    slots: { inject: (_name, fn) => fn(), register: (_slot, component) => { PluginSettings = component; return () => {} } },
  })
} }
const script = document.createElement('script')
script.src = '/client.js'
script.onload = () => createRoot(document.getElementById('root')).render(<Shell />)
document.head.append(script)

function Shell() {
  const [dark, setDark] = React.useState(false)
  const [settings, setSettings] = React.useState(false)
  const [chat, setChat] = React.useState(false)
  React.useEffect(() => { document.body.toggleAttribute('data-ds-dark-theme', dark) }, [dark])
  return <>
    <aside data-slot="sidebar"><div className="sidebarExpanded">
      <div className="brand"><span>Klee Clover</span></div>
      <button className="newSession" onClick={() => setChat(false)}>＋ 新的冒险</button>
      <div className="workspace-title">工作区 <span>＋</span></div>
      <div className="folder">▱ clover-workshop</div>
      <button className="sessionItem active" onClick={() => setChat(true)}>四叶草的冒险笔记</button>
      <button className="sessionItem" onClick={() => setChat(true)}>今天也要元气满满</button>
      <div className="sidebar-footer"><span>✧ 本地主题预览</span><button onClick={() => setSettings(true)}>⚙ 设置</button></div>
    </div></aside>
    <main><header><span>KLEE / CLOVER ADVENTURE</span><button onClick={() => setDark(!dark)}>{dark ? '☀ 浅色' : '☾ 深色'}</button></header>
      {chat ? <div data-conversation-scroll><div className="column"><small>四叶草的冒险笔记</small><h2>把灵感装进行囊。</h2><p>先收集想法，再把它们变成可以运行的作品。</p><div className="userRow"><div className="bubble">今天一起做点有趣的东西吧！</div></div><div className="bubble"><p>准备好了。我们从一个小小的想法开始。</p><pre><code>const adventure = ['curiosity', 'creativity', 'clover']</code></pre></div><div className="callRow">✓ 工作区已准备就绪</div></div></div> : <div className="welcome"><div className="headline"><span className="headlineText">Klee Clover</span></div><p>把每一个灵感，都变成闪闪发光的冒险。</p><div className="composer-wrap"><div className="composer-meta">▱ clover-workshop　 ·　标准模式</div><div data-composer-card><textarea aria-label="消息" placeholder="今天，要和可莉一起做些什么？"/><div className="composer-tools"><span>＋　⌁　工作区内修改</span><button onClick={() => setChat(true)}>↑</button></div></div></div><small className="preview-note">交互样式预览 · 非真实对话</small></div>}
    </main>
    {settings && <div className="modal-backdrop"><section role="dialog" aria-label="设置"><div className="dialog-header"><strong>设置</strong><button aria-label="关闭设置" onClick={() => setSettings(false)}>×</button></div><div className="dialog-layout"><nav><button>通用设置</button><button>模型</button><button className="selected">可莉 · 四叶草冒险</button><button>内置插件</button></nav><div className="settings-content"><PluginSettings /></div></div></section></div>}
  </>
}
window.disposeKleePreview = () => disposers.reverse().forEach(dispose => dispose())
