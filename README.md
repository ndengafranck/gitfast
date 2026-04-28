⚡ GitFast – GitHub Desktop Client (No Command Line)

«A fast and simple Git GUI built with Electron, React, and Vite.
Perform Git and GitHub actions with a click — no terminal needed.»

---

🚀 What is GitFast?

GitFast is a lightweight desktop application that allows developers to manage Git repositories and perform GitHub operations without using the command line.

It is designed for:

- Beginners who find Git CLI difficult
- Developers who want faster workflows
- Anyone looking for a simple GitHub desktop client

---

🔥 Features

- ✅ Clone repositories
- ✅ Commit changes
- ✅ Push & Pull updates
- ✅ Branch management
- ✅ GitHub integration
- ✅ Clean and modern UI (Electron + React)

---

💻 Download (Windows)

👉 Download GitFast Setup:
https://github.com/ndengafranck/gitfast/releases/tag/v1.3.0

---

🛠️ Built With

- Electron
- React
- Vite
- Node.js

---

🚀 Quick Start (Development)

Install dependencies

npm install

Run the app

npm run dev

Build for production

npm run build

---

📦 Keywords (for search engines)

Git GUI, GitHub desktop client, Git without command line, Electron Git app, Git tool for beginners, GitHub UI tool

---

📌 Why GitFast?

Unlike traditional Git tools, GitFast focuses on:

- Speed ⚡
- Simplicity 🧠
- Accessibility for beginners 🎯

---

⭐ Support

If you like this project:

- Star the repository ⭐
- Share it on social media
- Give feedback

---

📄 License

NO License
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
"dev Branch" 
