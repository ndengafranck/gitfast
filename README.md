# ⚡ GitFast

> GitHub actions at the speed of a click. Built with Electron + React + Vite.

GitFast is a desktop app that lets developers perform all common Git/GitHub operations with zero command-line typing — just point, click, done.

Get the .exe here: https://github.com/ndengafranck/gitfast/releases/download/v1.3.0/GitFast-Setup-1.3.0.exe
---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Run in development mode
```bash
npm run dev
```
This starts Vite on `localhost:5173` and launches Electron pointing to it.

### 3. Build for production
```bash
npm run build
```
Output will be in the `release/` folder.

---

## ⚙️ First-Time Setup

1. Open GitFast and click **⚙ Settings** in the sidebar
2. Set **Default Repo Folder** — the local path to your Git project
3. Set **Default Remote URL** — e.g. `https://github.com/username/repo.git`
4. Paste your **GitHub PAT** — see below
5. Click **Save Settings**, then **Test Connection**

---

## 🔑 Creating a GitHub PAT

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it the **`repo`** scope
4. Copy & paste into GitFast Settings

---

## ✨ Features

| Panel | Actions |
|---|---|
| **Status** | Live file changes, staged count, branch info, commit log, remotes |
| **Init / Clone** | `git init` + add remote, or `git clone` with PAT auth |
| **Stage & Commit** | `git add` (all or specific), `git commit` |
| **Push** | `git push` with PAT injection |
| **Pull** | `git pull` with PAT injection |
| **Branches** | Create, switch, delete, merge branches |
| **Pull Requests** | List open PRs, create new PRs, merge via GitHub API |
| **Quick Bar** | One-click Add All, Commit nav, Pull, Push, Refresh |

---

## 🗂 Project Structure

```
gitfast/
├── electron/
│   ├── main.js        # Electron main process (Git + GitHub API logic)
│   └── preload.js     # Secure IPC bridge (contextBridge)
├── src/
│   ├── components/
│   │   ├── App.jsx           # Root component
│   │   ├── Titlebar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── QuickBar.jsx
│   │   ├── Toast.jsx
│   │   ├── UI.jsx            # Shared primitives (Card, Btn, Input, etc.)
│   │   ├── StatusPanel.jsx
│   │   ├── InitClonePanel.jsx
│   │   ├── CommitPanel.jsx
│   │   ├── PushPullPanel.jsx
│   │   ├── BranchesPanel.jsx
│   │   ├── PRsPanel.jsx
│   │   └── SettingsPanel.jsx
│   ├── hooks/
│   │   ├── useSettings.js
│   │   ├── useToast.js
│   │   └── useGitStatus.js
│   ├── styles/
│   │   └── global.css
│   └── main.jsx       # React entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## 🧩 Tech Stack

| Layer | Tech |
|---|---|
| Shell | Electron 28 |
| UI Framework | React 18 + Vite 5 |
| Git Operations | simple-git |
| GitHub API | axios |
| Settings Storage | electron-store |
| Dev Workflow | concurrently + wait-on |
