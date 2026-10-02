# Klee Clover Adventure

A Genshin Impact fan theme for DeepSeek Harness, with a Mondstadt sunset, two distinct Klee outfits, warm glass surfaces, and durable appearance settings.

[中文文档](README.md) · [Downloads](https://github.com/QLruil419/dsh-klee-clover-theme/releases/latest) · [Asset notices](ASSET_NOTICE.md)

![Klee Clover light appearance](docs/preview-light.jpg)

## Features

- An actual Mondstadt sunset image hosted on miHoYo's official CDN. The original is intentionally soft-focused. Dark mode dims the same scene; it is not a separate night screenshot.
- A single classic-outfit Klee standing calmly on the wallpaper, with no jumping or floating props. This is AI-generated unofficial fan art, repainted with warm sunset backlighting, softer contours, and lower contrast to fit the hazy scene; the sidebar retains the original Blossoming Starlight costume artwork.
- A dedicated **可莉 · 四叶草冒险** settings tab alongside General and Models.
- Wallpaper, sidebar, and panel opacity; blur and saturation; optional CSS liquid-glass highlights.
- Independent character size, opacity, horizontal position, and sidebar bottom clearance. Adjustable Jumpy Dumpty corner mascot.
- Automatic disk saves and a manual save button. Settings survive restarts and changed localhost ports.
- Local bundled assets, clover decorations, and reduced-motion support.

## Install

Use Node.js 20+ for this plugin; also follow your Harness release's own runtime requirement. Disable other global skins, including Doro Paradise and dsh-dream-skin, before enabling this one.

Download and extract the release ZIP to a permanent directory. The archive contains a top-level `dsh-klee-clover-theme` folder. In PowerShell:

```powershell
Set-Location 'D:\Plugins\dsh-klee-clover-theme'
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Profile web
```

For the desktop app use `-Profile desktop`. If the bundled CLI is not on PATH, pass `-DshCommand` with its absolute path. Ensure the CLI and app use the same `DSH_HOME`; installing into a different home/profile will not affect your active app. The execution-policy flag only applies to the script process.

Manual installation, also suitable for macOS/Linux:

```sh
git clone https://github.com/QLruil419/dsh-klee-clover-theme.git
cd dsh-klee-clover-theme
npm install --omit=dev
dsh plugin --profile web add -w .
```

Restart Harness, refresh its browser UI, and open Settings → **可莉 · 四叶草冒险**. Keep the directory because the plugin uses a local link. Prefer your desktop application's bundled CLI instead of mixing launcher/package-manager versions.

## Persistence and controls

Settings are stored in `$DSH_HOME/klee-clover-theme.json`, or `~/.dsh/klee-clover-theme.json` when DSH_HOME is unset. Profiles sharing that home share the theme preferences. Doro settings use a separate file.

Changes autosave after approximately 250 ms. Writes are serialized and replaced atomically. Browser storage is a fast/offline fallback. The **保存设置** button requests an immediate save; **已保存** means the host acknowledged it. **仅浏览器已保存** means the host write failed and only browser storage is available. Retry after checking host plugin availability and directory permissions.

Set character or mascot opacity to zero to hide it. Increase sidebar bottom clearance to avoid lower plugin buttons. `vh` sizes are relative to viewport height; sidebar percentage includes the original artwork's transparent margins. Liquid glass uses CSS blur and highlights, not physically simulated refraction.

## Update / remove

Close Harness, overwrite the same plugin directory with the new ZIP, run `npm install --omit=dev`, and restart. Git users can run `git pull --ff-only` first. Updates preserve the settings file stored outside the plugin directory.

```sh
dsh plugin --profile web remove -w dsh-klee-clover-theme
```

Use `desktop` for the desktop profile. Uninstallation retains the settings JSON.

## Development

```sh
npm ci
npm run check
npm test
npm run preview
```

The isolated preview runs at `http://127.0.0.1:4173` and saves only to `.preview-state/`. Its shell is a development fixture, not an AI chat client. Tests cover save/reload across new host ports, validation, trust fences, oversized bodies, and asset delivery.

Verified in an isolated Web profile on **DeepSeek Harness 0.2.0-rc.2**, including real client registration, settings navigation and persistence. Other global skins can conflict with its CSS. Future Harness APIs may require adaptation. Remote installations require trusted hosts; do not disable authentication. Preferences are host-wide, not per-user.

## Credits and license

Derived from [Doro Paradise v1.4.0](https://github.com/QLruil419/dsh-doro-paradise-theme/tree/v1.4.0), retaining its MIT notice. Code is MIT. Genshin Impact character and scene images retain their original rights and are **not** licensed under MIT. This is an unofficial fan project, not affiliated with HoYoverse or DeepSeek. See [ASSET_NOTICE.md](ASSET_NOTICE.md) for exact sources and file hashes.
