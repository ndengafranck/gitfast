import React, { useEffect, useState, useCallback } from 'react'
import Titlebar from './components/Titlebar.jsx'
import Sidebar from './components/Sidebar.jsx'
import QuickBar from './components/QuickBar.jsx'
import ToastContainer from './components/Toast.jsx'
import StatusPanel from './components/StatusPanel.jsx'
import InitClonePanel from './components/InitClonePanel.jsx'
import CommitPanel from './components/CommitPanel.jsx'
import PushPanel, { PullPanel } from './components/PushPullPanel.jsx'
import BranchesPanel from './components/BranchesPanel.jsx'
import PRsPanel from './components/PRsPanel.jsx'
import ActionsPanel from './components/ActionsPanel.jsx'
import IssuesPanel from './components/IssuesPanel.jsx'
import ReleasesPanel from './components/ReleasesPanel.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import GitignorePanel from './components/GitignorePanel.jsx'
import { useSettings } from './hooks/useSettings.js'
import { useToast } from './hooks/useToast.js'
import { useGitStatus } from './hooks/useGitStatus.js'

// Wait for Electron's contextBridge to inject window.gitfast
function waitForBridge(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (window.gitfast) return resolve()
    const start = Date.now()
    const timer = setInterval(() => {
      if (window.gitfast) { clearInterval(timer); resolve() }
      else if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        reject(new Error('Electron bridge not available — try reloading (Ctrl+R)'))
      }
    }, 50)
  })
}

export default function App() {
  const { settings, save: saveSettings, loaded } = useSettings()
  const { toasts, toast } = useToast()
  const { repoData, loading: statusLoading, error: statusError, refresh: refreshStatus } = useGitStatus()
  const [panel, setPanel] = useState('status')
  const [prCount, setPrCount] = useState(0)
  const [bridgeReady, setBridgeReady] = useState(!!window.gitfast)
  const [bridgeError, setBridgeError] = useState(null)

  // Update state: null | 'prompt' | 'downloading' | 'ready' | 'dismissed'
  const [updateState, setUpdateState] = useState(null)
  const [updateVersion, setUpdateVersion] = useState(null)

  // Wait for window.gitfast to be injected by Electron preload
  useEffect(() => {
    if (window.gitfast) { setBridgeReady(true); return }
    waitForBridge()
      .then(() => setBridgeReady(true))
      .catch(e => setBridgeError(e.message))
  }, [])

  // Once bridge + settings are ready, load repo status
  useEffect(() => {
    if (bridgeReady && loaded && settings.defaultFolder) {
      refreshStatus(settings.defaultFolder)
    }
  }, [bridgeReady, loaded, settings.defaultFolder])

  // Listen for auto-updater events from main process
  useEffect(() => {
    if (!bridgeReady || !window.gitfast) return

    window.gitfast.onUpdateAvailable((version) => {
      setUpdateVersion(version)
      setUpdateState('prompt') // Show the "update now or later?" dialog
    })

    window.gitfast.onUpdateDownloaded((version) => {
      setUpdateVersion(version)
      setUpdateState('ready') // Download done — show install prompt
    })

    return () => { window.gitfast.removeUpdateListeners?.() }
  }, [bridgeReady])

  const handleUpdateNow = () => {
    setUpdateState('downloading')
    // Download starts automatically once update-available fires in electron-updater.
    // Nothing extra to call — we just show the progress state.
  }

  const handleUpdateLater = () => {
    window.gitfast.cancelUpdate?.()
    setUpdateState('dismissed')
  }

  const handleInstallUpdate = () => {
    window.gitfast.installUpdate()
  }

  const handleSaveSettings = useCallback(async (next) => {
    const merged = await saveSettings(next)
    if (merged.defaultFolder) refreshStatus(merged.defaultFolder)
    return merged
  }, [saveSettings, refreshStatus])

  const handleRefresh = useCallback((folder) => {
    refreshStatus(folder || settings.defaultFolder)
  }, [refreshStatus, settings.defaultFolder])

  const quickAddAll = async () => {
    const folder = settings.defaultFolder
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    const r = await window.gitfast?.gitAdd({ folder, files: '.' })
    toast(r?.ok ? 'All files staged.' : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) refreshStatus(folder)
  }

  const quickPull = async () => {
    const folder = settings.defaultFolder
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    toast('Pulling…', 'info')
    const r = await window.gitfast?.gitPull({ folder, branch: repoData?.branches?.current || 'main', pat: settings.pat })
    toast(r?.ok ? r.message : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) refreshStatus(folder)
  }

  const quickPush = async () => {
    const folder = settings.defaultFolder
    const remote = settings.defaultRemote
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    if (!remote) return toast('Set a default remote URL in Settings.', 'error')
    toast('Pushing…', 'info')
    const r = await window.gitfast?.gitPush({
      folder, remoteUrl: remote,
      branch: repoData?.branches?.current || 'main',
      pat: settings.pat,
    })
    toast(r?.ok ? r.message : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
  }

  const currentBranch = repoData?.branches?.current || ''
  const sharedProps = { settings, toast, onRefresh: handleRefresh }

  // ── Bridge not available yet ───────────────────────────────────────────────
  if (bridgeError) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, padding: 32 }}>
        <span style={{ fontSize: 36 }}>⚠️</span>
        <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>{bridgeError}</div>
      </div>
    )
  }

  // ── Waiting for bridge or settings ────────────────────────────────────────
  if (!bridgeReady || !loaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
          Git<span style={{ color: 'var(--accent)' }}>Fast</span>
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Starting up…</span>
      </div>
    )
  }

  const renderPanel = () => {
    switch (panel) {
      case 'status':
        return (
          <StatusPanel
            repoData={repoData}
            loading={statusLoading}
            error={statusError}
            folder={settings.defaultFolder}
            onOpenSettings={() => setPanel('settings')}
            onRefresh={handleRefresh}
          />
        )
      case 'init-clone': return <InitClonePanel {...sharedProps} onSaveSettings={handleSaveSettings} />
      case 'commit':     return <CommitPanel {...sharedProps} />
      case 'push':       return <PushPanel {...sharedProps} currentBranch={currentBranch} />
      case 'pull':       return <PullPanel {...sharedProps} currentBranch={currentBranch} />
      case 'branches':   return <BranchesPanel {...sharedProps} />
      case 'prs':        return <PRsPanel settings={settings} toast={toast} onPRCount={setPrCount} />
      case 'actions':    return <ActionsPanel settings={settings} toast={toast} />
      case 'issues':     return <IssuesPanel settings={settings} toast={toast} />
      case 'releases':   return <ReleasesPanel settings={settings} toast={toast} />
      case 'gitignore':  return <GitignorePanel folder={settings.defaultFolder} toast={toast} />
      case 'settings':   return <SettingsPanel settings={settings} onSave={handleSaveSettings} toast={toast} />
      default:           return null
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <Titlebar folder={settings.defaultFolder} branch={currentBranch} />

      <QuickBar
        onAddAll={quickAddAll}
        onCommit={() => setPanel('commit')}
        onPull={quickPull}
        onPush={quickPush}
        onRefresh={() => refreshStatus(settings.defaultFolder)}
      />

      {/* ── Update: "now or later?" prompt modal ── */}
      {updateState === 'prompt' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 999,
          background: 'rgba(8,11,17,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--bg1)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '28px 32px', width: 360,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>⬆</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  GitFast v{updateVersion} is available
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  A new version is ready to download.
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Would you like to download and install it now?
              The update will download in the background while you keep working.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={handleUpdateLater}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--r)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                Later
              </button>
              <button
                onClick={handleUpdateNow}
                style={{
                  padding: '7px 16px', borderRadius: 'var(--r)',
                  border: '1px solid var(--accent)', background: 'var(--accent)',
                  color: 'var(--bg0)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                Download Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Update: downloading in background banner ── */}
      {updateState === 'downloading' && (
        <div style={{
          background: 'var(--bg3)', borderBottom: '1px solid var(--border)',
          fontSize: 12, padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)',
        }}>
          <span style={{ color: 'var(--accent)', animation: 'spin .8s linear infinite', display: 'inline-block' }}>↻</span>
          <span>Downloading GitFast v{updateVersion} in the background…</span>
        </div>
      )}

      {/* ── Update: ready to install banner ── */}
      {updateState === 'ready' && (
        <div style={{
          background: 'var(--green-bg)', borderBottom: '1px solid var(--green)',
          fontSize: 12, padding: '6px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ color: 'var(--green)' }}>✓ GitFast v{updateVersion} downloaded — ready to install.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setUpdateState('dismissed')}
              style={{
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              Later
            </button>
            <button
              onClick={handleInstallUpdate}
              style={{
                background: 'var(--green)', color: 'var(--bg0)',
                border: 'none', borderRadius: 4,
                padding: '3px 12px', fontSize: 11,
                fontWeight: 700, cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              Restart & Install
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          active={panel}
          onNav={id => setPanel(id)}
          folder={settings.defaultFolder}
          branch={currentBranch}
          prCount={prCount}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg0)' }}>
          {renderPanel()}
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  )
}
