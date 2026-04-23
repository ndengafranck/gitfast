const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('gitfast', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Diagnostics
  gitCheck: () => ipcRenderer.invoke('git-check'),

  // Git operations
  gitStatus: (a) => ipcRenderer.invoke('git-status', a),
  gitInit: (a) => ipcRenderer.invoke('git-init', a),
  gitClone: (a) => ipcRenderer.invoke('git-clone', a),
  gitAddRemote: (a) => ipcRenderer.invoke('git-add-remote', a),
  gitAdd: (a) => ipcRenderer.invoke('git-add', a),
  gitCommit: (a) => ipcRenderer.invoke('git-commit', a),
  gitPush: (a) => ipcRenderer.invoke('git-push', a),
  gitPull: (a) => ipcRenderer.invoke('git-pull', a),
  gitBranchCreate: (a) => ipcRenderer.invoke('git-branch-create', a),
  gitBranchSwitch: (a) => ipcRenderer.invoke('git-branch-switch', a),
  gitBranchDelete: (a) => ipcRenderer.invoke('git-branch-delete', a),
  gitBranchMerge: (a) => ipcRenderer.invoke('git-branch-merge', a),

  // GitHub API
  ghListPRs: (a) => ipcRenderer.invoke('gh-list-prs', a),
  ghCreatePR: (a) => ipcRenderer.invoke('gh-create-pr', a),
  ghMergePR: (a) => ipcRenderer.invoke('gh-merge-pr', a),
  ghGetUser: (a) => ipcRenderer.invoke('gh-get-user', a),

  // GitHub Actions
  ghListWorkflowRuns: (a) => ipcRenderer.invoke('gh-list-workflow-runs', a),
  ghListWorkflows: (a) => ipcRenderer.invoke('gh-list-workflows', a),
  ghGetRunJobs: (a) => ipcRenderer.invoke('gh-get-run-jobs', a),
  ghGetJobLogs: (a) => ipcRenderer.invoke('gh-get-job-logs', a),
  ghRerunWorkflow: (a) => ipcRenderer.invoke('gh-rerun-workflow', a),
  ghCancelRun: (a) => ipcRenderer.invoke('gh-cancel-run', a),
  ghTriggerWorkflow: (a) => ipcRenderer.invoke('gh-trigger-workflow', a),

  // GitHub Issues
  ghListIssues: (a) => ipcRenderer.invoke('gh-list-issues', a),
  ghCreateIssue: (a) => ipcRenderer.invoke('gh-create-issue', a),
  ghCloseIssue: (a) => ipcRenderer.invoke('gh-close-issue', a),
  ghAddComment: (a) => ipcRenderer.invoke('gh-add-comment', a),

  // GitHub Releases
  ghListReleases: (a) => ipcRenderer.invoke('gh-list-releases', a),
  ghCreateRelease: (a) => ipcRenderer.invoke('gh-create-release', a),
  ghDeleteRelease: (a) => ipcRenderer.invoke('gh-delete-release', a),

  // .gitignore management
  gitignoreRead: (a) => ipcRenderer.invoke('gitignore-read', a),
  gitignoreWrite: (a) => ipcRenderer.invoke('gitignore-write', a),
  gitignoreDetectProject: (a) => ipcRenderer.invoke('gitignore-detect-project', a),

  // Auto-updater bridge
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_event, version) => cb(version)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (_event, version) => cb(version)),
  installUpdate: () => ipcRenderer.send('install-update'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  cancelUpdate: () => ipcRenderer.send('cancel-update'),
  removeUpdateListeners: () => {
    ipcRenderer.removeAllListeners('update-available');
    ipcRenderer.removeAllListeners('update-downloaded');
  },
});
