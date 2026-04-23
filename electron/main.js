const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs   = require('fs');
const { spawnSync } = require('child_process');
const Store = require('electron-store');
const axios = require('axios');

const store = new Store();
const DIST_INDEX = path.join(__dirname, '../dist/index.html');
const isDev = process.env.ELECTRON_DEV === '1';

// ── Find git binary ───────────────────────────────────────────────────────────
function findGit() {
  if (process.platform !== 'win32') return 'git';
  const candidates = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
    'C:\\Program Files (x86)\\Git\\bin\\git.exe',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'git';
}
const GIT = findGit();

// ── Core helper: run any git command in a folder ──────────────────────────────
// Uses spawnSync with cwd — the ONLY safe way on Windows paths with spaces.
// Never passes the folder path as a command-line argument.
function runGit(folder, args, extraEnv = {}) {
  const result = spawnSync(GIT, args, {
    cwd: folder,
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
    env: { ...process.env, ...extraEnv },
  });

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();

  if (result.error) {
    // Binary not found or couldn't spawn
    throw new Error(`Could not run git: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(stderr || stdout || `git exited with code ${result.status}`);
  }
  return stdout;
}

// Safe version that never throws — returns null on failure
function tryGit(folder, args) {
  try { return runGit(folder, args); } catch { return null; }
}

// ── PAT injection ─────────────────────────────────────────────────────────────
function injectPAT(url, pat) {
  try {
    const u = new URL(url);
    u.username = 'token';
    u.password = pat;
    return u.toString();
  } catch { return url; }
}

// ── Ensure folder exists & is writable ───────────────────────────────────────
function ensureDir(folder) {
  try {
    if (!folder) return { ok: false, error: 'No folder path provided.' };
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    fs.accessSync(folder, fs.constants.R_OK | fs.constants.W_OK);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Cannot access "${folder}": ${e.message}` };
  }
}

// ── Ensure git user config exists (needed for commits) ───────────────────────
function ensureGitConfig(folder) {
  const name  = tryGit(folder, ['config', 'user.name']);
  const email = tryGit(folder, ['config', 'user.email']);
  if (!name)  tryGit(folder, ['config', 'user.name',  'GitFast User']);
  if (!email) tryGit(folder, ['config', 'user.email', 'gitfast@local.dev']);
}

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 820, minWidth: 960, minHeight: 660,
    frame: false, backgroundColor: '#080b11',
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      sandbox: false, preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.loadFile(DIST_INDEX);
  if (isDev) {
    mainWindow.webContents.openDevTools();
    try {
      const chokidar = require('chokidar');
      const w = chokidar.watch(path.join(__dirname, '../dist'), { ignoreInitial: true, depth: 1 });
      w.on('change', () => { if (!mainWindow.isDestroyed()) mainWindow.webContents.reloadIgnoringCache(); });
      mainWindow.on('closed', () => w.close());
    } catch (_) {}
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  // ── FIX: Auto-updater setup moved inside whenReady so mainWindow exists ──
  // Skip update checks in dev mode to avoid noise
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-available', info.version);
      }
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update-downloaded', info.version);
      }
    });

    autoUpdater.on('error', (err) => {
      // Log silently — don't crash the app for update failures
      console.error('[updater] error:', err.message);
    });
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

// ── Updater IPC ───────────────────────────────────────────────────────────────
ipcMain.on('install-update', () => autoUpdater.quitAndInstall(false, true));
ipcMain.on('cancel-update', () => {
  // electron-updater doesn't have a built-in cancel, but we can flag it
  // so the update-downloaded event doesn't auto-install
  try { autoUpdater.autoInstallOnAppQuit = false; } catch (_) {}
});
ipcMain.handle('check-for-updates', () => {
  if (isDev) return { ok: false, error: 'Update checks disabled in dev mode.' };
  try { autoUpdater.checkForUpdates(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window-close', () => mainWindow.close());

// ── Settings ──────────────────────────────────────────────────────────────────
ipcMain.handle('get-settings', () =>
  store.get('settings', { pat: '', defaultFolder: '', defaultRemote: '' })
);
ipcMain.handle('save-settings', (_, s) => { store.set('settings', s); return { ok: true }; });

// ── Folder picker ─────────────────────────────────────────────────────────────
ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));

// ── Git check ─────────────────────────────────────────────────────────────────
ipcMain.handle('git-check', () => {
  const r = spawnSync(GIT, ['--version'], { encoding: 'utf8', timeout: 3000, windowsHide: true });
  if (r.error || r.status !== 0) {
    return { ok: false, error: 'Git not found. Install from https://git-scm.com and restart.', binary: GIT };
  }
  return { ok: true, version: r.stdout.trim(), binary: GIT };
});

// ── Git Status ────────────────────────────────────────────────────────────────
ipcMain.handle('git-status', (_, { folder }) => {
  try {
    const d = ensureDir(folder);
    if (!d.ok) return { ok: false, error: d.error };

    // Check .git exists
    if (!fs.existsSync(path.join(folder, '.git'))) {
      return { ok: false, error: `Not a git repository:\n"${folder}"\n\nUse Init to initialize it first.` };
    }

    // --- status porcelain v1 ---
    const statusOut = runGit(folder, ['status', '--porcelain']);
    const modified = [], not_added = [], created = [], deleted = [], staged = [];
    for (const line of statusOut.split('\n').filter(Boolean)) {
      const xy = line.slice(0, 2);
      const file = line.slice(3).trim();
      const x = xy[0], y = xy[1];
      if (x === 'A') created.push(file);
      else if (x === 'M') staged.push(file);
      else if (x === 'D') deleted.push(file);
      if (y === 'M') modified.push(file);
      else if (y === '?') not_added.push(file);
    }

    // --- ahead/behind ---
    let ahead = 0, behind = 0;
    const ab = tryGit(folder, ['rev-list', '--count', '--left-right', '@{u}...HEAD']);
    if (ab) { const p = ab.split('\t'); behind = parseInt(p[0]) || 0; ahead = parseInt(p[1]) || 0; }

    const status = { modified, not_added, created, deleted, staged, ahead, behind };

    // --- log ---
    const logOut = tryGit(folder, ['log', '--pretty=format:%H|%s|%an|%ai', '-10']) || '';
    const log = logOut.split('\n').filter(Boolean).map(l => {
      const [hash, message, author_name, date] = l.split('|');
      return { hash, message, author_name, date };
    });

    // --- remotes ---
    const remotesOut = tryGit(folder, ['remote', '-v']) || '';
    const remoteMap = {};
    for (const line of remotesOut.split('\n').filter(Boolean)) {
      const [name, url] = line.split('\t');
      if (!remoteMap[name]) remoteMap[name] = { name, refs: { fetch: url?.split(' ')[0] || '' } };
    }
    const remotes = Object.values(remoteMap);

    // --- branches ---
    const branchOut = tryGit(folder, ['branch']) || '';
    const all = branchOut.split('\n').filter(Boolean).map(b => b.replace(/^\*?\s+/, ''));
    const currentLine = branchOut.split('\n').find(b => b.startsWith('*'));
    const current = currentLine ? currentLine.replace(/^\*\s+/, '') : '';

    return { ok: true, status, log, remotes, branches: { all, current } };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── Git Init ──────────────────────────────────────────────────────────────────
ipcMain.handle('git-init', (_, { folder }) => {
  try {
    const d = ensureDir(folder);
    if (!d.ok) return { ok: false, error: d.error };

    if (fs.existsSync(path.join(folder, '.git'))) {
      return { ok: false, error: `Already a git repository:\n"${folder}"` };
    }

    runGit(folder, ['init']);

    if (!fs.existsSync(path.join(folder, '.git'))) {
      return { ok: false, error: `git init ran but .git was not created in:\n"${folder}"` };
    }

    ensureGitConfig(folder);
    return { ok: true, message: `✓ Initialized git repository in:\n"${folder}"` };
  } catch (e) {
    return { ok: false, error: `Init failed: ${e.message}` };
  }
});

// ── Git Clone ─────────────────────────────────────────────────────────────────
ipcMain.handle('git-clone', (_, { remoteUrl, folder, pat }) => {
  try {
    if (!remoteUrl) return { ok: false, error: 'Remote URL is required.' };
    if (!folder)    return { ok: false, error: 'Destination folder is required.' };

    const parent = path.dirname(folder);
    const d = ensureDir(parent);
    if (!d.ok) return { ok: false, error: d.error };

    const url = pat ? injectPAT(remoteUrl, pat) : remoteUrl;
    // Clone into parent dir, targeting the folder name
    const folderName = path.basename(folder);
    runGit(parent, ['clone', url, folderName]);
    ensureGitConfig(folder);
    return { ok: true, message: `✓ Cloned into "${folder}"` };
  } catch (e) {
    return { ok: false, error: `Clone failed: ${e.message}` };
  }
});

// ── Add Remote ────────────────────────────────────────────────────────────────
ipcMain.handle('git-add-remote', (_, { folder, remoteUrl, name = 'origin' }) => {
  try {
    // Remove if exists, then add fresh
    tryGit(folder, ['remote', 'remove', name]);
    runGit(folder, ['remote', 'add', name, remoteUrl]);
    return { ok: true, message: `✓ Remote '${name}' set to ${remoteUrl}` };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// ── Git Add ───────────────────────────────────────────────────────────────────
ipcMain.handle('git-add', (_, { folder, files = '.' }) => {
  try {
    const d = ensureDir(folder);
    if (!d.ok) return { ok: false, error: d.error };
    if (!fs.existsSync(path.join(folder, '.git'))) {
      return { ok: false, error: `"${folder}" is not a git repository.` };
    }
    runGit(folder, ['add', files]);
    // Count staged files
    const out = tryGit(folder, ['diff', '--cached', '--name-only']) || '';
    const count = out.split('\n').filter(Boolean).length;
    return { ok: true, message: `✓ Staged ${count} file(s).` };
  } catch (e) {
    return { ok: false, error: `Stage failed: ${e.message}` };
  }
});

// ── Git Commit ────────────────────────────────────────────────────────────────
ipcMain.handle('git-commit', (_, { folder, message }) => {
  try {
    if (!message?.trim()) return { ok: false, error: 'Commit message is required.' };

    // Check something is staged
    const staged = tryGit(folder, ['diff', '--cached', '--name-only']) || '';
    if (!staged.trim()) {
      return { ok: false, error: 'Nothing staged to commit.\nUse "Stage & Commit → Stage" first.' };
    }

    ensureGitConfig(folder);
    const out = runGit(folder, ['commit', '-m', message.trim()]);
    return { ok: true, message: `✓ ${out.split('\n')[0]}` };
  } catch (e) {
    return { ok: false, error: `Commit failed: ${e.message}` };
  }
});

// ── Git Push ──────────────────────────────────────────────────────────────────
ipcMain.handle('git-push', (_, { folder, remoteUrl, branch, pat }) => {
  try {
    if (!folder)    return { ok: false, error: 'No folder set. Configure in Settings.' };
    if (!remoteUrl) return { ok: false, error: 'Remote URL is required.' };

    // Resolve current branch if not specified
    const resolvedBranch = branch || tryGit(folder, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'main';

    // Set remote URL with PAT
    const authedUrl = pat ? injectPAT(remoteUrl, pat) : remoteUrl;
    tryGit(folder, ['remote', 'remove', 'origin']);
    runGit(folder, ['remote', 'add', 'origin', authedUrl]);

    runGit(folder, ['push', '-u', 'origin', resolvedBranch]);
    return { ok: true, message: `✓ Pushed to origin/${resolvedBranch}` };
  } catch (e) {
    return { ok: false, error: `Push failed: ${e.message}` };
  }
});

// ── Git Pull ──────────────────────────────────────────────────────────────────
ipcMain.handle('git-pull', (_, { folder, branch, pat }) => {
  try {
    if (!folder) return { ok: false, error: 'No folder set. Configure in Settings.' };

    const resolvedBranch = branch || tryGit(folder, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'main';

    // Update remote URL with PAT if provided
    if (pat) {
      const remoteUrl = tryGit(folder, ['remote', 'get-url', 'origin']);
      if (remoteUrl) {
        tryGit(folder, ['remote', 'set-url', 'origin', injectPAT(remoteUrl, pat)]);
      }
    }

    runGit(folder, ['pull', 'origin', resolvedBranch]);
    return { ok: true, message: `✓ Pulled from origin/${resolvedBranch}` };
  } catch (e) {
    return { ok: false, error: `Pull failed: ${e.message}` };
  }
});

// ── Branch Create ─────────────────────────────────────────────────────────────
ipcMain.handle('git-branch-create', (_, { folder, branchName }) => {
  try {
    runGit(folder, ['checkout', '-b', branchName]);
    return { ok: true, message: `✓ Created & switched to '${branchName}'` };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Branch Switch ─────────────────────────────────────────────────────────────
ipcMain.handle('git-branch-switch', (_, { folder, branchName }) => {
  try {
    runGit(folder, ['checkout', branchName]);
    return { ok: true, message: `✓ Switched to '${branchName}'` };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Branch Delete ─────────────────────────────────────────────────────────────
ipcMain.handle('git-branch-delete', (_, { folder, branchName }) => {
  try {
    runGit(folder, ['branch', '-d', branchName]);
    return { ok: true, message: `✓ Deleted branch '${branchName}'` };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── Branch Merge ──────────────────────────────────────────────────────────────
ipcMain.handle('git-branch-merge', (_, { folder, branchName }) => {
  try {
    runGit(folder, ['merge', branchName]);
    return { ok: true, message: `✓ Merged '${branchName}' into current branch` };
  } catch (e) { return { ok: false, error: e.message }; }
});

// ── GitHub API ────────────────────────────────────────────────────────────────
function parseGitHubUrl(url) {
  const m = url.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

ipcMain.handle('gh-list-prs', async (_, { remoteUrl, pat }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/pulls?state=open`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, prs: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-create-pr', async (_, { remoteUrl, pat, title, body, head, base }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/pulls`,
      { title, body, head, base },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, pr: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-merge-pr', async (_, { remoteUrl, pat, prNumber }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.put(
      `https://api.github.com/repos/${p.owner}/${p.repo}/pulls/${prNumber}/merge`,
      { merge_method: 'merge' },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, message: res.data.message };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-get-user', async (_, { pat }) => {
  try {
    const res = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${pat}` }
    });
    return { ok: true, user: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

// ── GitHub Actions ────────────────────────────────────────────────────────────
ipcMain.handle('gh-list-workflow-runs', async (_, { remoteUrl, pat }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/runs?per_page=40`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, runs: res.data.workflow_runs };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-list-workflows', async (_, { remoteUrl, pat }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/workflows`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, workflows: res.data.workflows };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-get-run-jobs', async (_, { remoteUrl, pat, runId }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/runs/${runId}/jobs`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, jobs: res.data.jobs };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-get-job-logs', async (_, { remoteUrl, pat, jobId }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    // GitHub redirects logs to a signed URL; follow it
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/jobs/${jobId}/logs`,
      {
        headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' },
        maxRedirects: 5,
        responseType: 'text',
      }
    );
    return { ok: true, logs: res.data };
  } catch (e) {
    // 410 means logs expired
    if (e.response?.status === 410) return { ok: true, logs: '(Logs have expired for this job)' };
    return { ok: false, error: e.response?.data?.message || e.message };
  }
});

ipcMain.handle('gh-rerun-workflow', async (_, { remoteUrl, pat, runId }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/runs/${runId}/rerun`,
      {},
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-cancel-run', async (_, { remoteUrl, pat, runId }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/runs/${runId}/cancel`,
      {},
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-trigger-workflow', async (_, { remoteUrl, pat, workflowId, branch, inputs = {} }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/actions/workflows/${workflowId}/dispatches`,
      { ref: branch, inputs },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

// ── GitHub Issues ─────────────────────────────────────────────────────────────
ipcMain.handle('gh-list-issues', async (_, { remoteUrl, pat, state = 'open' }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/issues?state=${state}&per_page=50`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    // Filter out pull requests (GitHub returns them in issues endpoint)
    const issues = res.data.filter(i => !i.pull_request);
    return { ok: true, issues };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-create-issue', async (_, { remoteUrl, pat, title, body, labels = [] }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/issues`,
      { title, body, labels },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, issue: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-close-issue', async (_, { remoteUrl, pat, issueNumber }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    await axios.patch(
      `https://api.github.com/repos/${p.owner}/${p.repo}/issues/${issueNumber}`,
      { state: 'closed' },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-add-comment', async (_, { remoteUrl, pat, issueNumber, body }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/issues/${issueNumber}/comments`,
      { body },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, comment: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

// ── GitHub Releases ───────────────────────────────────────────────────────────
ipcMain.handle('gh-list-releases', async (_, { remoteUrl, pat }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.get(
      `https://api.github.com/repos/${p.owner}/${p.repo}/releases?per_page=20`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, releases: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-create-release', async (_, { remoteUrl, pat, tagName, name, body, targetCommitish, draft, prerelease }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    const res = await axios.post(
      `https://api.github.com/repos/${p.owner}/${p.repo}/releases`,
      { tag_name: tagName, name, body, target_commitish: targetCommitish, draft: !!draft, prerelease: !!prerelease },
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true, release: res.data };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

ipcMain.handle('gh-delete-release', async (_, { remoteUrl, pat, releaseId }) => {
  try {
    const p = parseGitHubUrl(remoteUrl);
    if (!p) return { ok: false, error: 'Not a valid GitHub URL' };
    await axios.delete(
      `https://api.github.com/repos/${p.owner}/${p.repo}/releases/${releaseId}`,
      { headers: { Authorization: `token ${pat}`, Accept: 'application/vnd.github.v3+json' } }
    );
    return { ok: true };
  } catch (e) { return { ok: false, error: e.response?.data?.message || e.message }; }
});

// ── .gitignore Management ─────────────────────────────────────────────────────

ipcMain.handle('gitignore-read', (_, { folder }) => {
  try {
    const p = path.join(folder, '.gitignore');
    const content = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
    return { ok: true, content };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('gitignore-write', (_, { folder, content }) => {
  try {
    const p = path.join(folder, '.gitignore');
    fs.writeFileSync(p, content, 'utf8');
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('gitignore-detect-project', (_, { folder }) => {
  try {
    const files = fs.readdirSync(folder);
    const detected = [];
    // Node / JS
    if (files.includes('package.json') || files.includes('node_modules')) detected.push('node');
    // Python
    if (files.some(f => f.endsWith('.py')) || files.includes('requirements.txt') || files.includes('Pipfile')) detected.push('python');
    // Java
    if (files.some(f => f.endsWith('.java')) || files.includes('pom.xml') || files.includes('build.gradle')) detected.push('java');
    // .NET / C#
    if (files.some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) detected.push('dotnet');
    // Rust
    if (files.includes('Cargo.toml')) detected.push('rust');
    // Go
    if (files.includes('go.mod')) detected.push('go');
    // Flutter / Dart
    if (files.includes('pubspec.yaml')) detected.push('flutter');
    // PHP
    if (files.includes('composer.json')) detected.push('php');
    // Ruby
    if (files.includes('Gemfile')) detected.push('ruby');
    // Xcode / Swift / iOS
    if (files.some(f => f.endsWith('.xcodeproj') || f.endsWith('.xcworkspace'))) detected.push('xcode');
    // Android
    if (files.some(f => f === 'AndroidManifest.xml') || files.includes('gradle')) detected.push('android');
    // General IDE / OS (always include)
    detected.push('editors', 'os');
    return { ok: true, detected };
  } catch (e) { return { ok: false, error: e.message }; }
});
