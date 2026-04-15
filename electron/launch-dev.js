/**
 * launch-dev.js
 * Waits for `vite build --watch` (running in parallel) to produce dist/index.html,
 * then spawns Electron. Does NOT run its own build — avoids the file-lock clash.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.join(__dirname, '..');
const distIndex = path.join(root, 'dist', 'index.html');
const electronBin = String(require('electron'));

// Poll until dist/index.html appears (vite build --watch creates it on first build)
function waitForDist(timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (fs.existsSync(distIndex)) {
        // Extra 300ms buffer so Vite finishes writing all assets before Electron reads them
        setTimeout(resolve, 300);
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for dist/index.html — did Vite build fail?'));
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  });
}

console.log('[launch-dev] Waiting for Vite to build dist/...');

waitForDist()
  .then(() => {
    console.log('[launch-dev] dist/index.html ready — launching Electron...');
    const child = spawn(electronBin, [root], {
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_DEV: '1' },
    });
    child.on('close', (code) => process.exit(code ?? 0));
  })
  .catch((err) => {
    console.error('[launch-dev]', err.message);
    process.exit(1);
  });
