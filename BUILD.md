# GitFast — Build Guide

## What's New in This Version

### New panels added:
- **GitHub Actions** — View workflow runs, expand job logs, re-run/cancel workflows, trigger dispatches
- **Issues** — List/filter issues, create new issues with labels, close issues, add comments
- **Releases** — List releases, create new releases (draft/pre-release support), delete releases

---

## Development (running locally)

```bash
npm install
npm run dev
```

This runs `vite build --watch` + `node electron/launch-dev.js` concurrently.

---

## Building the Windows .exe Installer

### Step 1 — Install dependencies

```bash
npm install
```

### Step 2 — Run the dist command

```bash
npm run dist
```

This will:
1. Build the React app via Vite → `dist/`
2. Run electron-builder to package everything → `release/`
3. Output: `release/GitFast-Setup-1.1.0.exe`

### Step 3 — Install on any PC

Double-click `GitFast-Setup-1.1.0.exe` and follow the wizard.
- Choose install directory
- Desktop shortcut is created automatically
- Launch from Start Menu or desktop

---

## Optional: Add a custom icon

Replace `assets/icon.ico` with your own 256×256 `.ico` file before building.

Tools to create `.ico` from a PNG:
- **Online**: https://convertico.com
- **ImageMagick**: `magick icon.png -resize 256x256 icon.ico`

---

## Build for all platforms

```bash
npm run dist:all   # Windows (.exe) + macOS (.dmg) + Linux (.AppImage)
npm run dist:mac   # macOS only
npm run dist:linux # Linux only
```

> Note: macOS builds require running on a Mac or having a macOS runner.
> Linux builds can be built from any OS.

---

## Troubleshooting builds

### "Cannot find module" error
```bash
npm install
```

### "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### Windows SmartScreen warning on first run
This is expected for unsigned apps. Click "More info" → "Run anyway".
To fully eliminate: get a code-signing certificate from DigiCert or Sectigo.

### Build fails with EBUSY / file lock
Make sure `npm run dev` is NOT running while building. Stop it first (Ctrl+C).

### `dist/` folder missing
Run `npm run build` first, or use `npm run dist` which does both steps.

---

## Project structure

```
gitfast/
├── electron/
│   ├── main.js        ← All git + GitHub API logic (IPC handlers)
│   ├── preload.js     ← Exposes window.gitfast bridge to React
│   └── launch-dev.js  ← Dev launcher with hot-reload
├── src/
│   ├── App.jsx        ← Root layout, panel routing
│   ├── components/
│   │   ├── ActionsPanel.jsx   ← NEW: GitHub Actions viewer
│   │   ├── IssuesPanel.jsx    ← NEW: Issues management
│   │   ├── ReleasesPanel.jsx  ← NEW: Releases management
│   │   ├── PRsPanel.jsx
│   │   ├── BranchesPanel.jsx
│   │   ├── CommitPanel.jsx
│   │   ├── PushPullPanel.jsx
│   │   ├── StatusPanel.jsx
│   │   ├── InitClonePanel.jsx
│   │   ├── SettingsPanel.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Titlebar.jsx
│   │   ├── QuickBar.jsx
│   │   ├── Toast.jsx
│   │   └── UI.jsx
│   ├── hooks/
│   │   ├── useGitStatus.js
│   │   ├── useSettings.js
│   │   └── useToast.js
│   └── styles/
│       └── global.css
├── assets/
│   └── icon.ico       ← App icon (replace with your own)
├── package.json
└── vite.config.js
```

---

## PAT (Personal Access Token) permissions needed

For GitHub Actions, Issues, and Releases features, your PAT needs these scopes:
- `repo` — Full repo access (push, pull, PRs)
- `workflow` — Read and write GitHub Actions workflows
- `read:org` — Optional: org-level visibility

Create at: https://github.com/settings/tokens/new
