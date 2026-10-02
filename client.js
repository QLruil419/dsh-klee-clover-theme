window.__ModuleLoader__.load({
  id: 'dsh-klee-clover-theme',
  factory: (require) => {
    const module = { exports: {} }
    const SCOPE = 'data-klee-clover'
    const MANIFEST = '/klee-clover-theme/manifest'
    const SETTINGS_API = '/klee-clover-theme/settings'
    const STORAGE_KEY = 'klee-clover:appearance:v1'
    const APPEARANCE_EVENT = 'klee-clover:appearance'
    const DEFAULT_APPEARANCE = Object.freeze({
      wallpaperOpacity: 62,
      wallpaperBlur: 0,
      sidebarOpacity: 45,
      sidebarArtBottom: 190,
      sidebarArtSize: 210,
      panelOpacity: 82,
      glassBlur: 16,
      saturation: 112,
      characterOpacity: 62,
      characterSize: 96,
      characterPosition: 76,
      mascotSize: 156,
      mascotOpacity: 92,
      liquidGlass: true,
      clovers: true,
    })

    let appearanceRevision = 0
    let hostLoadPromise = null
    let hostSaveTimer = null
    let saveQueue = Promise.resolve()
    let currentAppearance = null

    const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value)))

    function normalizeAppearance(input = {}) {
      const value = input && typeof input === 'object' && !Array.isArray(input) ? { ...input } : {}
      for (const [key, fallback] of Object.entries(DEFAULT_APPEARANCE)) {
        if (typeof fallback === 'number' && (typeof value[key] !== 'number' || !Number.isFinite(value[key]))) value[key] = fallback
        if (typeof fallback === 'boolean' && typeof value[key] !== 'boolean') value[key] = fallback
      }
      return {
        wallpaperOpacity: clamp(value.wallpaperOpacity ?? DEFAULT_APPEARANCE.wallpaperOpacity, 0, 100),
        wallpaperBlur: clamp(value.wallpaperBlur ?? DEFAULT_APPEARANCE.wallpaperBlur, 0, 32),
        sidebarOpacity: clamp(value.sidebarOpacity ?? DEFAULT_APPEARANCE.sidebarOpacity, 18, 100),
        sidebarArtBottom: clamp(value.sidebarArtBottom ?? DEFAULT_APPEARANCE.sidebarArtBottom, 48, 320),
        sidebarArtSize: clamp(value.sidebarArtSize, 100, 280),
        panelOpacity: clamp(value.panelOpacity ?? DEFAULT_APPEARANCE.panelOpacity, 28, 100),
        glassBlur: clamp(value.glassBlur ?? DEFAULT_APPEARANCE.glassBlur, 0, 40),
        saturation: clamp(value.saturation ?? DEFAULT_APPEARANCE.saturation, 80, 150),
        characterOpacity: clamp(value.characterOpacity ?? DEFAULT_APPEARANCE.characterOpacity, 0, 100),
        characterSize: clamp(value.characterSize ?? DEFAULT_APPEARANCE.characterSize, 42, 110),
        characterPosition: clamp(value.characterPosition, 35, 85),
        mascotSize: clamp(value.mascotSize ?? DEFAULT_APPEARANCE.mascotSize, 96, 480),
        mascotOpacity: clamp(value.mascotOpacity, 0, 100),
        liquidGlass: value.liquidGlass ?? DEFAULT_APPEARANCE.liquidGlass,
        clovers: value.clovers ?? DEFAULT_APPEARANCE.clovers,
      }
    }

    function readAppearance() {
      if (currentAppearance !== null) return { ...currentAppearance }
      try {
        return normalizeAppearance(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'))
      } catch {
        return { ...DEFAULT_APPEARANCE }
      }
    }

    function writeAppearanceLocally(value) {
      const appearance = normalizeAppearance(value)
      currentAppearance = appearance
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
      } catch {
        // Disk-backed persistence remains available when browser storage is blocked.
      }
      return appearance
    }

    function persistAppearanceToHost(value) {
      const snapshot = normalizeAppearance(value)
      // Serialize writes so a slow request cannot replace a newer slider value.
      const pending = saveQueue.catch(() => {}).then(() => sendAppearanceToHost(snapshot))
      saveQueue = pending
      return pending
    }

    async function sendAppearanceToHost(value) {
      const response = await fetch(SETTINGS_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method: 'set', appearance: normalizeAppearance(value) }),
        keepalive: true,
      })
      if (!response.ok) throw new Error(`settings save: ${response.status}`)
      const result = await response.json()
      if (result?.ok !== true) throw new Error('settings save rejected')
      return true
    }

    function scheduleHostSave(value) {
      if (hostSaveTimer !== null) clearTimeout(hostSaveTimer)
      const appearance = normalizeAppearance(value)
      hostSaveTimer = setTimeout(() => {
        hostSaveTimer = null
        persistAppearanceToHost(appearance)
          .catch(error => console.warn('[Klee Clover] disk save unavailable; browser cache retained:', error))
      }, 250)
    }

    function writeAppearance(value) {
      const appearance = writeAppearanceLocally(value)
      appearanceRevision += 1
      scheduleHostSave(appearance)
      return appearance
    }

    async function saveAppearanceNow(value) {
      const appearance = writeAppearanceLocally(value)
      appearanceRevision += 1
      if (hostSaveTimer !== null) {
        clearTimeout(hostSaveTimer)
        hostSaveTimer = null
      }
      return persistAppearanceToHost(appearance)
    }

    function announceAppearance(value) {
      const appearance = normalizeAppearance(value)
      applyAppearance(appearance)
      window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT, { detail: appearance }))
    }

    function loadAppearanceFromHost() {
      if (hostLoadPromise !== null) return hostLoadPromise
      const revisionAtStart = appearanceRevision
      hostLoadPromise = (async () => {
        try {
          const response = await fetch(SETTINGS_API, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ method: 'get' }),
          })
          if (!response.ok) throw new Error(`settings load: ${response.status}`)
          const result = await response.json()
          const stored = result?.ok === true ? result.value?.appearance : null
          if (stored !== null && typeof stored === 'object' && !Array.isArray(stored)) {
            if (appearanceRevision !== revisionAtStart) return readAppearance()
            const appearance = writeAppearanceLocally(stored)
            announceAppearance(appearance)
            return appearance
          }
          const appearance = readAppearance()
          if (appearanceRevision === revisionAtStart) await persistAppearanceToHost(appearance)
          return appearance
        } catch (error) {
          console.warn('[Klee Clover] disk settings unavailable; using browser cache:', error)
          return readAppearance()
        }
      })()
      return hostLoadPromise
    }

    function applyAppearance(value) {
      const appearance = normalizeAppearance(value)
      const body = document.body
      body.style.setProperty('--klee-wallpaper-opacity', (appearance.wallpaperOpacity / 100).toFixed(2))
      body.style.setProperty('--klee-wallpaper-blur', `${appearance.wallpaperBlur}px`)
      body.style.setProperty('--klee-sidebar-top', `${clamp(appearance.sidebarOpacity + 22, 18, 100)}%`)
      body.style.setProperty('--klee-sidebar-mid', `${clamp(appearance.sidebarOpacity + 12, 18, 100)}%`)
      body.style.setProperty('--klee-sidebar-low', `${clamp(appearance.sidebarOpacity - 12, 8, 100)}%`)
      body.style.setProperty('--klee-sidebar-bottom', `${clamp(appearance.sidebarOpacity - 32, 0, 100)}%`)
      body.style.setProperty('--klee-sidebar-art-bottom', `${appearance.sidebarArtBottom}px`)
      body.style.setProperty('--klee-sidebar-art-size', `${appearance.sidebarArtSize}%`)
      body.style.setProperty('--klee-panel-fill', `${appearance.panelOpacity}%`)
      body.style.setProperty('--klee-glass-blur', `${appearance.glassBlur}px`)
      body.style.setProperty('--klee-glass-saturation', (appearance.saturation / 100).toFixed(2))
      body.style.setProperty('--klee-character-opacity', (appearance.characterOpacity / 100).toFixed(2))
      body.style.setProperty('--klee-character-size', `${appearance.characterSize}vh`)
      body.style.setProperty('--klee-character-position', `${appearance.characterPosition}%`)
      body.style.setProperty('--klee-mascot-size', `${appearance.mascotSize}px`)
      body.style.setProperty('--klee-mascot-opacity', (appearance.mascotOpacity / 100).toFixed(2))
      body.setAttribute('data-klee-glass', appearance.liquidGlass ? 'liquid' : 'frosted')
      body.setAttribute('data-klee-motion', appearance.clovers ? 'on' : 'off')
    }

    function stylesheet(asset) {
      return `
/* Klee Clover: cream daylight, warm dusk, and a little Spark Knight. */
body[${SCOPE}] {
  --klee-accent: #eaa26f;
  --klee-accent-strong: #ffd2a6;
  --klee-highlight: #bd4434;
  --klee-mint: #97b788;
  --klee-ground: #1c1817;
  --klee-label: #eddfcb;
  --klee-wallpaper-opacity: .62;
  --klee-wallpaper-blur: 0px;
  --klee-sidebar-top: 84%;
  --klee-sidebar-mid: 74%;
  --klee-sidebar-low: 50%;
  --klee-sidebar-bottom: 30%;
  --klee-sidebar-art-bottom: 190px;
  --klee-sidebar-art-size: 210%;
  --klee-panel-fill: 82%;
  --klee-glass-blur: 16px;
  --klee-glass-saturation: 1.12;
  --klee-character-opacity: .62;
  --klee-character-size: 96vh;
  --klee-character-position: 76%;
  --klee-mascot-size: 156px;
  --klee-mascot-opacity: .92;
  --klee-panel: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  --dsw-alias-bg-base: transparent;
  --dsw-specific-sidebar-fill: transparent;
  --dsw-alias-button-elevated-fill: var(--klee-panel);
  --dsw-alias-button-floating-hover: color-mix(in srgb, var(--klee-accent) 16%, var(--klee-ground));
  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  --dsw-alias-bg-layer-2: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), rgba(255,255,255,.05));
  --dsw-alias-bg-layer-3: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), rgba(255,255,255,.09));
  --dsw-alias-label-primary: #fff6e8;
  --dsw-alias-label-secondary: var(--klee-label);
  --dsw-alias-label-tertiary: #d2bda4;
  --dsw-alias-label-caption: #bfae98;
  --dsw-alias-brand-primary: var(--klee-accent-strong);
  --dsw-alias-button-primary-fill: var(--klee-highlight);
  --dsw-alias-state-business-primary: var(--klee-accent-strong);
  --dsw-alias-state-success-primary: var(--klee-mint);
  --dsw-alias-border-l: color-mix(in srgb, var(--klee-accent) 35%, transparent);
  --dsw-alias-border-l2: color-mix(in srgb, var(--klee-accent) 22%, transparent);
  --dsw-alias-interactive-bg-hover: color-mix(in srgb, var(--klee-accent) 13%, transparent);
  --dsw-alias-markdown-code-block: rgba(26, 22, 19, 0.92);
  --dsw-alias-markdown-code-block-banner: rgba(44, 34, 28, 0.94);
  --dsw-alias-markdown-inline-code: rgba(223, 129, 73, 0.14);
  --dsw-alias-scrollbar-bg-l1: color-mix(in srgb, var(--klee-accent) 32%, transparent);
  --dsw-alias-scrollbar-hover-l1: color-mix(in srgb, var(--klee-accent) 58%, transparent);
  background-color: var(--klee-ground) !important;
  background-image: none !important;
  isolation: isolate;
}

body[${SCOPE}]:not([data-ds-dark-theme]) {
  --klee-accent: #a4442f;
  --klee-accent-strong: #8f3624;
  --klee-highlight: #bd4434;
  --klee-ground: #fff9ee;
  --klee-label: #69513e;
  --klee-panel: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  --dsw-alias-bg-layer-1: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  --dsw-alias-bg-layer-2: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), rgba(159,71,44,.06));
  --dsw-alias-bg-layer-3: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), rgba(159,71,44,.10));
  --dsw-alias-label-primary: #372a21;
  --dsw-alias-label-secondary: #69513e;
  --dsw-alias-label-tertiary: #795f4a;
  --dsw-alias-label-caption: #826b55;
  --dsw-alias-brand-primary: #a33f2d;
  --dsw-alias-state-success-primary: #557948;
  --dsw-alias-markdown-code-block: rgba(255, 250, 240, 0.94);
  --dsw-alias-markdown-code-block-banner: rgba(241, 226, 208, 0.94);
  --dsw-alias-markdown-inline-code: rgba(159, 71, 44, 0.12);
}

body[${SCOPE}] .klee-wallpaper {
  position: fixed;
  inset: -48px;
  z-index: -2;
  pointer-events: none;
  background: center / cover no-repeat url("${asset.backgroundDark}");
  opacity: var(--klee-wallpaper-opacity);
  filter: blur(var(--klee-wallpaper-blur)) saturate(var(--klee-glass-saturation));
  transform: translateZ(0) scale(1.025);
  transform-origin: center;
  transition: opacity .18s ease, filter .18s ease;
}
body[${SCOPE}]:not([data-ds-dark-theme]) .klee-wallpaper {
  background-image: url("${asset.backgroundLight}");
}

body[${SCOPE}] .klee-wallpaper-character,
body[${SCOPE}] .klee-wallpaper-mascot {
  position: fixed;
  pointer-events: none;
  background-repeat: no-repeat;
  background-position: center bottom;
  background-size: contain;
  transform: translateZ(0);
  transition: opacity .18s ease, width .18s ease, height .18s ease;
}
body[${SCOPE}] .klee-wallpaper-character {
  left: var(--klee-character-position);
  bottom: 0;
  z-index: -2;
  width: calc(var(--klee-character-size) * .72);
  height: var(--klee-character-size);
  opacity: var(--klee-character-opacity);
  background-image: url("${asset.character}");
  filter: drop-shadow(0 18px 36px rgba(32, 14, 40, .24));
  transform: translateX(-50%) translateZ(0);
}
body[${SCOPE}] .klee-wallpaper-mascot {
  right: clamp(10px, 2vw, 36px);
  bottom: clamp(8px, 2vh, 24px);
  z-index: -1;
  width: var(--klee-mascot-size);
  height: var(--klee-mascot-size);
  opacity: var(--klee-mascot-opacity);
  background-image: url("${asset.mascot}");
  filter: drop-shadow(0 12px 26px rgba(46, 20, 55, .28));
}
@media (max-width: 900px) {
  body[${SCOPE}] .klee-wallpaper-character {
    left: min(var(--klee-character-position), 58%);
    max-height: 65vh;
    max-width: 46.8vh;
  }
  body[${SCOPE}] .klee-wallpaper-mascot { right: 6px; max-width: 28vw; max-height: 28vw; }
}

body[${SCOPE}] ::selection { background: color-mix(in srgb, var(--klee-highlight) 48%, transparent); }
body[${SCOPE}] :focus-visible { outline: 2px solid var(--klee-accent-strong); outline-offset: 2px; }
body[${SCOPE}] textarea { caret-color: var(--klee-accent-strong); }

body[${SCOPE}] [data-slot="sidebar"] > div:first-child {
  background-image:
    linear-gradient(180deg,
      color-mix(in srgb, var(--klee-ground) var(--klee-sidebar-top), transparent) 0%,
      color-mix(in srgb, var(--klee-ground) var(--klee-sidebar-mid), transparent) 52%,
      color-mix(in srgb, var(--klee-ground) var(--klee-sidebar-low), transparent) 76%,
      color-mix(in srgb, var(--klee-ground) var(--klee-sidebar-bottom), transparent) 100%),
    url("${asset.overlay}");
  background-size: auto, var(--klee-sidebar-art-size) auto;
  background-position: center, 50% calc(100% - var(--klee-sidebar-art-bottom));
  background-repeat: no-repeat;
}
body[${SCOPE}] [data-slot="sidebar"] > div[class*="collapsed"] { background-image: none; }
body[${SCOPE}] [data-slot="sidebar"] [class*="sessionItem"][class*="active"],
body[${SCOPE}] [data-slot="sidebar"] [aria-current="true"] {
  box-shadow: inset 3px 0 0 var(--klee-accent-strong);
}

body[${SCOPE}] [data-slot="sidebar"] :is(button,div)[class*="brand"] > * { visibility: hidden; }
body[${SCOPE}] [data-slot="sidebar"] :is(button,div)[class*="brand"] {
  background: left center / contain no-repeat url("${asset.wordmark}");
  min-width: 150px;
  height: 44px;
}
body[${SCOPE}] [data-slot="sidebar"] [class*="collapsed"] :is(button,div)[class*="brand"] {
  min-width: 0;
  background-image: url("${asset.icon}");
}
body[${SCOPE}] button[class*="newSession"] svg { visibility: hidden; }
body[${SCOPE}] [data-slot="sidebar.brand.mark"] {
  display: inline-block !important;
  width: 24px;
  height: 24px;
  background: center / contain no-repeat url("${asset.icon}");
}
body[${SCOPE}] [data-slot="sidebar.brand.mark"] svg { visibility: hidden; }
body[${SCOPE}] button[class*="newSession"] {
  background-image: url("${asset.icon}");
  background-size: 28px 28px;
  background-position: 10px center;
  background-repeat: no-repeat;
}

body[${SCOPE}] [class*="headline"] > span:has(> svg[viewBox="0 0 23.16 17.04"]),
body[${SCOPE}] [class*="headline"] > [class*="fishHitbox"] { display: none; }
body[${SCOPE}] [class*="headlineText"],
body[${SCOPE}] [class*="headline"] > [class*="titleGroup"] {
  visibility: hidden;
  position: relative;
  display: inline-block;
  width: 360px;
  max-width: 70vw;
  height: 120px;
}
body[${SCOPE}] [class*="headlineText"]::after,
body[${SCOPE}] [class*="headline"] > [class*="titleGroup"]::after {
  content: '';
  position: absolute;
  inset: 0;
  visibility: visible;
  background: center / contain no-repeat url("${asset.heroLogo}");
}

body[${SCOPE}] [data-composer-card] {
  position: relative;
  border: 1px solid color-mix(in srgb, var(--klee-accent) 42%, transparent);
  background: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  box-shadow: 0 8px 30px rgba(23, 11, 29, .24), 0 0 24px color-mix(in srgb, var(--klee-accent) 10%, transparent);
  -webkit-backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
  backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
}
body[${SCOPE}] [data-composer-card]:focus-within {
  border-color: var(--klee-accent-strong);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--klee-accent) 24%, transparent), 0 10px 36px rgba(23, 11, 29, .3);
}
body[${SCOPE}] [data-composer-card]::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 50%;
  width: 34px;
  height: 34px;
  transform: translateX(-50%);
  pointer-events: none;
  background: center / contain no-repeat url("${asset.icon}");
  filter: drop-shadow(0 2px 6px rgba(60, 31, 72, .25));
}
body[${SCOPE}] [data-composer-card]::after {
  content: '';
  position: absolute;
  inset: -8px;
  pointer-events: none;
  border: 20px solid transparent;
  border-image: url("${asset.frame}") 40 / 20px / 0 stretch;
  opacity: .86;
  -webkit-mask-image:
    radial-gradient(circle 44px at left top, #000 54%, transparent 100%),
    radial-gradient(circle 44px at right top, #000 54%, transparent 100%),
    radial-gradient(circle 44px at left bottom, #000 54%, transparent 100%),
    radial-gradient(circle 44px at right bottom, #000 54%, transparent 100%);
  mask-image:
    radial-gradient(circle 44px at left top, #000 54%, transparent 100%),
    radial-gradient(circle 44px at right top, #000 54%, transparent 100%),
    radial-gradient(circle 44px at left bottom, #000 54%, transparent 100%),
    radial-gradient(circle 44px at right bottom, #000 54%, transparent 100%);
}

body[${SCOPE}] [class*="bubble"] {
  border: 1px solid color-mix(in srgb, var(--klee-accent) 22%, transparent);
  -webkit-backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
  backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
}
body[${SCOPE}] [class*="userRow"] [class*="bubble"] {
  border-color: color-mix(in srgb, var(--klee-highlight) 52%, transparent);
  background: color-mix(in srgb, var(--klee-highlight) 48%, var(--klee-ground));
}
body[${SCOPE}]:not([data-ds-dark-theme]) [class*="userRow"] [class*="bubble"] {
  background: color-mix(in srgb, #f4dac2 88%, transparent);
}

body[${SCOPE}] [data-conversation-scroll] [class*="column"] {
  background: linear-gradient(90deg, transparent, var(--klee-panel) 10%, var(--klee-panel) 90%, transparent);
  padding-inline: 18px;
  -webkit-backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
  backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
}
body[${SCOPE}] [data-conversation-scroll] pre,
body[${SCOPE}] [data-conversation-scroll] code { text-shadow: none; }
body[${SCOPE}] [class*="callRow"] {
  background: color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent);
  border-radius: 9px;
  padding-inline: 8px;
  -webkit-backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
  backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
}
body[${SCOPE}] [class*="codeBody"],
body[${SCOPE}] [class*="code"] { border-left-color: var(--klee-accent); }
body[${SCOPE}] [role="dialog"],
body[${SCOPE}] [data-shell-overlay] > * {
  border: 1px solid color-mix(in srgb, var(--klee-accent) 34%, transparent);
  box-shadow: 0 18px 64px rgba(17, 8, 24, .48);
  -webkit-backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
  backdrop-filter: blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation));
}

/* Liquid mode adds a bright refractive rim and soft internal caustic sheen.
   It remains an enhancement over the same readable frosted surfaces. */
body[${SCOPE}][data-klee-glass="liquid"] [data-composer-card],
body[${SCOPE}][data-klee-glass="liquid"] [class*="bubble"],
body[${SCOPE}][data-klee-glass="liquid"] [class*="callRow"],
body[${SCOPE}][data-klee-glass="liquid"] [role="dialog"],
body[${SCOPE}][data-klee-glass="liquid"] [data-shell-overlay] > * {
  border-color: color-mix(in srgb, white 34%, var(--klee-accent));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.42),
    inset 1px 0 0 rgba(255,255,255,.16),
    inset 0 -1px 0 color-mix(in srgb, var(--klee-accent) 25%, transparent),
    0 12px 36px rgba(22,10,30,.20),
    0 0 26px color-mix(in srgb, var(--klee-accent) 9%, transparent);
}
body[${SCOPE}][data-klee-glass="liquid"] [data-composer-card]:hover,
body[${SCOPE}][data-klee-glass="liquid"] [class*="bubble"]:hover {
  border-color: color-mix(in srgb, white 48%, var(--klee-accent));
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.55),
    inset 0 -1px 0 color-mix(in srgb, var(--klee-accent) 30%, transparent),
    0 14px 42px rgba(22,10,30,.24);
}

body[${SCOPE}] h1,
body[${SCOPE}] h2,
body[${SCOPE}] [class*="headline"] {
  font-family: 'STKaiti', 'KaiTi', 'Kaiti SC', 'Noto Serif SC', Georgia, serif;
  letter-spacing: .025em;
}

body[${SCOPE}] .klee-clovers {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
body[${SCOPE}] .klee-clovers > i {
  position: absolute;
  top: -20px;
  width: 13px;
  height: 13px;
  background: center / contain no-repeat url("${asset.icon}");
  opacity: 0;
  animation: klee-clover-drift linear infinite;
}
@keyframes klee-clover-drift {
  0% { transform: translate3d(0,-4vh,0) rotate(0deg); opacity: 0; }
  10% { opacity: .46; }
  100% { transform: translate3d(70px,104vh,0) rotate(560deg); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  body[${SCOPE}] .klee-clovers { display: none; }
}
body[${SCOPE}][data-klee-motion="off"] .klee-clovers { display: none; }
body[${SCOPE}] .klee-settings-row {
  display: grid; grid-template-columns: minmax(140px, 1fr) minmax(160px, 1.2fr);
  gap: 16px; align-items: center; padding: 11px 0;
  border-bottom: 1px solid var(--dsw-alias-border-l2);
}
body[${SCOPE}] .klee-settings-header { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; margin-bottom: 16px; }
@media (max-width: 620px) {
  body[${SCOPE}] .klee-settings-row { grid-template-columns: 1fr; gap: 8px; }
}
`
    }

    function createAppearanceSettings(React) {
      const labelStyle = { fontSize: 14, fontWeight: 500, color: 'var(--dsw-alias-label-primary)' }
      const hintStyle = { fontSize: 12, lineHeight: 1.45, color: 'var(--dsw-alias-label-secondary)', marginTop: 2 }

      function RangeRow({ label, hint, value, min, max, step, unit, onChange }) {
        return React.createElement('div', { className: 'klee-settings-row' },
          React.createElement('div', null,
            React.createElement('div', { style: labelStyle }, label),
            React.createElement('div', { style: hintStyle }, hint)),
          React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
            React.createElement('input', {
              type: 'range', min, max, step, value,
              'aria-label': label,
              onChange: event => onChange(Number(event.target.value)),
              style: { width: '100%', accentColor: 'var(--klee-accent, #bd4434)', cursor: 'pointer' },
            }),
            React.createElement('span', {
              style: { width: 54, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--dsw-alias-label-secondary)', fontSize: 13 },
            }, `${value}${unit}`)))
      }

      function ToggleRow({ label, hint, checked, onChange }) {
        return React.createElement('div', { className: 'klee-settings-row' },
          React.createElement('div', null,
            React.createElement('div', { style: labelStyle }, label),
            React.createElement('div', { style: hintStyle }, hint)),
          React.createElement('button', {
            type: 'button',
            role: 'switch',
            'aria-label': label,
            'aria-checked': checked,
            onClick: () => onChange(!checked),
            style: {
              justifySelf: 'end', width: 50, height: 28, padding: 3, borderRadius: 999, cursor: 'pointer',
              border: '1px solid var(--dsw-alias-border-l)',
              background: checked ? 'var(--klee-highlight, #bd4434)' : 'var(--dsw-alias-bg-layer-3)',
              transition: 'background .16s ease',
            },
          }, React.createElement('span', {
            style: {
              display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff',
              transform: checked ? 'translateX(22px)' : 'translateX(0)', transition: 'transform .16s ease',
              boxShadow: '0 2px 7px rgba(0,0,0,.22)',
            },
          })))
      }

      return function KleeAppearanceSettings() {
        const [appearance, setAppearance] = React.useState(readAppearance)
        const [saveState, setSaveState] = React.useState('idle')
        React.useEffect(() => {
          applyAppearance(appearance)
          const syncFromHost = event => setAppearance(normalizeAppearance(event.detail))
          window.addEventListener(APPEARANCE_EVENT, syncFromHost)
          void loadAppearanceFromHost()
          return () => window.removeEventListener(APPEARANCE_EVENT, syncFromHost)
        }, [])

        const change = (key, nextValue) => {
          setSaveState('idle')
          setAppearance(previous => {
            const next = normalizeAppearance({ ...previous, [key]: nextValue })
            writeAppearance(next)
            applyAppearance(next)
            return next
          })
        }
        const save = async () => {
          setSaveState('saving')
          try {
            await saveAppearanceNow(appearance)
            setSaveState('saved')
          } catch (error) {
            console.warn('[Klee Clover] manual disk save failed:', error)
            setSaveState('fallback')
          }
        }
        const reset = () => {
          const next = { ...DEFAULT_APPEARANCE }
          writeAppearance(next)
          applyAppearance(next)
          setAppearance(next)
          setSaveState('idle')
        }

        return React.createElement('section', {
          style: { padding: '2px 0 24px' },
        },
          React.createElement('div', { className: 'klee-settings-header' },
            React.createElement('div', null,
              React.createElement('div', { style: { ...labelStyle, fontSize: 19, fontWeight: 600 } }, '可莉 · 四叶草冒险'),
              React.createElement('div', { style: { ...hintStyle, marginTop: 5 } }, '设置会自动保存到 DSH 本机配置，重启或更换端口后仍会恢复。')),
            React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
              React.createElement('button', {
                type: 'button', onClick: save, disabled: saveState === 'saving',
                style: { border: '1px solid var(--klee-accent)', background: 'color-mix(in srgb, var(--klee-accent) 22%, var(--dsw-alias-bg-layer-2))', color: 'var(--dsw-alias-label-primary)', borderRadius: 999, padding: '6px 11px', cursor: saveState === 'saving' ? 'wait' : 'pointer' },
              }, saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '已保存' : saveState === 'fallback' ? '仅浏览器已保存' : '保存设置'),
              React.createElement('button', {
                type: 'button', onClick: reset,
                style: { border: '1px solid var(--dsw-alias-border-l)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', borderRadius: 999, padding: '6px 11px', cursor: 'pointer' },
              }, '恢复默认'))),
          React.createElement('div', {
            style: {
              height: 58, borderRadius: 14, margin: '12px 0 5px', padding: '0 16px', display: 'flex', alignItems: 'center',
              color: 'var(--dsw-alias-label-primary)', border: '1px solid color-mix(in srgb, white 36%, var(--klee-accent))',
              background: 'color-mix(in srgb, var(--klee-ground) var(--klee-panel-fill), transparent)',
              backdropFilter: 'blur(var(--klee-glass-blur)) saturate(var(--klee-glass-saturation))',
              boxShadow: appearance.liquidGlass ? 'inset 0 1px 0 rgba(255,255,255,.5), 0 10px 28px rgba(25,10,31,.16)' : '0 8px 22px rgba(25,10,31,.12)',
            },
          }, appearance.liquidGlass ? 'Liquid Glass · 可莉的四叶草工房' : 'Frosted Glass · 柔和毛玻璃'),
          React.createElement(RangeRow, { label: '壁纸强度', hint: '控制背景图可见程度。', value: appearance.wallpaperOpacity, min: 0, max: 100, step: 1, unit: '%', onChange: value => change('wallpaperOpacity', value) }),
          React.createElement(RangeRow, { label: '壁纸模糊', hint: '只模糊背景，不影响文字和控件。', value: appearance.wallpaperBlur, min: 0, max: 32, step: 1, unit: 'px', onChange: value => change('wallpaperBlur', value) }),
          React.createElement(RangeRow, { label: '侧边栏不透明度', hint: '数值越低，侧边栏中的可莉越清晰。', value: appearance.sidebarOpacity, min: 18, max: 100, step: 1, unit: '%', onChange: value => change('sidebarOpacity', value) }),
          React.createElement(RangeRow, { label: '侧栏立绘高度', hint: '数值越大，侧栏可莉越靠上，避开底部插件按钮和分割线。', value: appearance.sidebarArtBottom, min: 48, max: 320, step: 2, unit: 'px', onChange: value => change('sidebarArtBottom', value) }),
          React.createElement(RangeRow, { label: '侧栏可莉大小', hint: '调整琪花星烛立绘与童话书的大小。', value: appearance.sidebarArtSize, min: 100, max: 280, step: 1, unit: '%', onChange: value => change('sidebarArtSize', value) }),
          React.createElement(RangeRow, { label: '面板不透明度', hint: '数值越低，玻璃越通透。', value: appearance.panelOpacity, min: 28, max: 100, step: 1, unit: '%', onChange: value => change('panelOpacity', value) }),
          React.createElement(RangeRow, { label: '毛玻璃模糊', hint: '控制浮层后的折射模糊。', value: appearance.glassBlur, min: 0, max: 40, step: 1, unit: 'px', onChange: value => change('glassBlur', value) }),
          React.createElement(RangeRow, { label: '玻璃饱和度', hint: '提高壁纸透过玻璃后的色彩浓度。', value: appearance.saturation, min: 80, max: 150, step: 1, unit: '%', onChange: value => change('saturation', value) }),
          React.createElement(RangeRow, { label: '中央可莉强度', hint: '控制壁纸中央可莉本体的可见程度。', value: appearance.characterOpacity, min: 0, max: 100, step: 1, unit: '%', onChange: value => change('characterOpacity', value) }),
          React.createElement(RangeRow, { label: '中央可莉大小', hint: '按窗口高度缩放可莉本体。', value: appearance.characterSize, min: 42, max: 110, step: 1, unit: 'vh', onChange: value => change('characterSize', value) }),
          React.createElement(RangeRow, { label: '可莉水平位置', hint: '左右移动壁纸角色，避开正文区域。', value: appearance.characterPosition, min: 35, max: 85, step: 1, unit: '%', onChange: value => change('characterPosition', value) }),
          React.createElement(RangeRow, { label: '蹦蹦炸弹大小', hint: '单独调整右下角装饰，不影响壁纸。', value: appearance.mascotSize, min: 96, max: 480, step: 4, unit: 'px', onChange: value => change('mascotSize', value) }),
          React.createElement(RangeRow, { label: '蹦蹦炸弹强度', hint: '设为 0 即可隐藏右下角装饰。', value: appearance.mascotOpacity, min: 0, max: 100, step: 1, unit: '%', onChange: value => change('mascotOpacity', value) }),
          React.createElement(ToggleRow, { label: '液态玻璃高光', hint: '加入镜面边缘、内高光和悬停折射感。', checked: appearance.liquidGlass, onChange: value => change('liquidGlass', value) }),
          React.createElement(ToggleRow, { label: '漂浮四叶草', hint: '关闭后保留静态主题，减少动画。', checked: appearance.clovers, onChange: value => change('clovers', value) }))
      }
    }

    function apply(ctx) {
      const React = require('react')
      const KleeAppearanceSettings = createAppearanceSettings(React)
      ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'klee-clover',
        order: 35,
        label: () => '可莉 · 四叶草冒险',
      }, KleeAppearanceSettings)), 'klee-clover: settings section')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.setAttribute('data-plugin', 'klee-clover-theme')
        const wallpaper = document.createElement('div')
        wallpaper.className = 'klee-wallpaper'
        wallpaper.setAttribute('aria-hidden', 'true')
        const wallpaperCharacter = document.createElement('div')
        wallpaperCharacter.className = 'klee-wallpaper-character'
        wallpaperCharacter.setAttribute('aria-hidden', 'true')
        const wallpaperMascot = document.createElement('div')
        wallpaperMascot.className = 'klee-wallpaper-mascot'
        wallpaperMascot.setAttribute('aria-hidden', 'true')
        const clovers = document.createElement('div')
        clovers.className = 'klee-clovers'
        clovers.setAttribute('aria-hidden', 'true')
        for (let i = 0; i < 18; i++) {
          const clover = document.createElement('i')
          clover.style.left = `${(i * 5.83 + (i % 4) * 2.1).toFixed(2)}%`
          clover.style.animationDuration = `${15 + (i % 7) * 3}s`
          clover.style.animationDelay = `${-(i % 9) * 3.1}s`
          clovers.append(clover)
        }

        const iconLink = document.querySelector('link[rel~="icon"]')
        const originalIcon = iconLink?.getAttribute('href') ?? null
        let cancelled = false

        fetch(MANIFEST)
          .then(response => {
            if (!response.ok) throw new Error(`theme manifest: ${response.status}`)
            return response.json()
          })
          .then(asset => {
            if (cancelled) return
            style.textContent = stylesheet(asset)
            document.head.append(style)
            document.body.setAttribute(SCOPE, '')
            applyAppearance(readAppearance())
            void loadAppearanceFromHost()
            document.body.prepend(wallpaper, wallpaperCharacter, wallpaperMascot)
            document.body.append(clovers)
            if (iconLink !== null) iconLink.setAttribute('href', asset.favicon)
          })
          .catch(error => console.warn('[Klee Clover] theme not applied:', error))

        return () => {
          cancelled = true
          if (hostSaveTimer !== null) {
            clearTimeout(hostSaveTimer)
            hostSaveTimer = null
            void persistAppearanceToHost(readAppearance())
              .catch(() => {})
          }
          style.remove()
          wallpaper.remove()
          wallpaperCharacter.remove()
          wallpaperMascot.remove()
          clovers.remove()
          document.body.removeAttribute(SCOPE)
          document.body.removeAttribute('data-klee-glass')
          document.body.removeAttribute('data-klee-motion')
          for (const property of [
            '--klee-wallpaper-opacity', '--klee-wallpaper-blur',
            '--klee-sidebar-top', '--klee-sidebar-mid', '--klee-sidebar-low', '--klee-sidebar-bottom', '--klee-sidebar-art-bottom',
            '--klee-sidebar-art-size', '--klee-character-position', '--klee-mascot-opacity',
            '--klee-panel-fill', '--klee-glass-blur', '--klee-glass-saturation',
            '--klee-character-opacity', '--klee-character-size', '--klee-mascot-size',
          ]) {
            document.body.style.removeProperty(property)
          }
          if (iconLink !== null && originalIcon !== null) iconLink.setAttribute('href', originalIcon)
        }
      }, 'klee-clover: skin')
    }

    module.exports.apply = apply
    module.exports.inject = ['slots']
    return module.exports
  },
})
