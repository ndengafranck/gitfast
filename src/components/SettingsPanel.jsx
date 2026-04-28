import React, { useState, useEffect } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup, Row } from './UI.jsx'

const APP_VERSION = '1.3.0'

export default function SettingsPanel({ settings, onSave, toast }) {
  const [folder, setFolder] = useState(settings.defaultFolder || '')
  const [remote, setRemote] = useState(settings.defaultRemote || '')
  const [pat, setPat] = useState(settings.pat || '')
  const [showPat, setShowPat] = useState(false)
  const [ghUser, setGhUser] = useState(null)
  const [testing, setTesting] = useState(false)
  const [gitDiag, setGitDiag] = useState(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(null) // 'checking' | 'up-to-date' | 'available' | 'downloaded'

  useEffect(() => {
    window.gitfast?.gitCheck().then(r => setGitDiag(r))

    // Listen for update events triggered while Settings is open
    window.gitfast?.onUpdateAvailable((version) => {
      setUpdateStatus({ state: 'available', version })
    })
    window.gitfast?.onUpdateDownloaded((version) => {
      setUpdateStatus({ state: 'downloaded', version })
    })
  }, [])

  const pick = async () => {
    const f = await window.gitfast?.pickFolder()
    if (f) setFolder(f)
  }

  const save = async () => {
    await onSave({ defaultFolder: folder.trim(), defaultRemote: remote.trim(), pat: pat.trim() })
    toast('Settings saved.', 'success')
  }

  const test = async () => {
    if (!pat.trim()) return toast('Enter a PAT first.', 'error')
    setTesting(true)
    const r = await window.gitfast?.ghGetUser({ pat: pat.trim() })
    setTesting(false)
    if (r?.ok) {
      setGhUser(r.user)
      toast(`Authenticated as @${r.user.login} ✓`, 'success')
    } else {
      setGhUser(null)
      toast(`Auth failed: ${r?.error || 'unknown error'}`, 'error')
    }
  }

  const checkUpdate = async () => {
    setCheckingUpdate(true)
    setUpdateStatus({ state: 'checking' })
    const r = await window.gitfast?.checkForUpdates()
    setCheckingUpdate(false)
    if (!r?.ok) {
      setUpdateStatus({ state: 'up-to-date' })
      toast(r?.error || 'Already on the latest version.', 'info')
    }
    // If an update exists, the onUpdateAvailable listener above will fire
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Settings" sub="Configure your workspace and GitHub authentication" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* Git Binary Status */}
        {gitDiag && (
          <div style={{
            padding: '10px 14px', borderRadius: 'var(--r)',
            background: gitDiag.ok ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${gitDiag.ok ? 'var(--green)' : 'var(--red)'}`,
            marginBottom: 16, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>{gitDiag.ok ? '✓' : '✕'}</span>
            <div>
              {gitDiag.ok
                ? <span style={{ color: 'var(--green)' }}>Git found: <code>{gitDiag.version}</code></span>
                : <span style={{ color: 'var(--red)' }}>
                    Git not found — install from{' '}
                    <a href="#" onClick={e => { e.preventDefault(); window.gitfast?.openExternal('https://git-scm.com/download/win') }}>
                      git-scm.com
                    </a>{' '}
                    then restart GitFast.
                  </span>
              }
            </div>
          </div>
        )}

        {/* Workspace */}
        <Card title="Workspace" accent="◈">
          <Field label="Default Repo Folder" hint="GitFast will operate on this folder by default across all panels.">
            <Row>
              <div style={{ flex: 1 }}>
                <Input value={folder} onChange={setFolder} placeholder="C:\Users\you\projects\my-repo" />
              </div>
              <Btn onClick={pick}>Browse</Btn>
            </Row>
          </Field>
          <Field label="Default Remote URL" hint="Pre-fills remote URL fields in Push, Pull, and PR panels.">
            <Input value={remote} onChange={setRemote} placeholder="https://github.com/username/repo.git" />
          </Field>
        </Card>

        {/* GitHub Auth */}
        <Card title="GitHub Authentication" accent="🔑">
          <Field
            label="Personal Access Token (PAT)"
            hint={
              <span>
                Create at{' '}
                <a href="#" onClick={e => { e.preventDefault(); window.gitfast?.openExternal('https://github.com/settings/tokens') }}>
                  github.com/settings/tokens
                </a>
                {' '}— enable the <code>repo</code> + <code>workflow</code> scopes.
              </span>
            }
          >
            <Input
              type={showPat ? 'text' : 'password'}
              value={pat}
              onChange={setPat}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              rightEl={
                <button
                  onClick={() => setShowPat(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}
                >{showPat ? '🙈' : '👁'}</button>
              }
            />
          </Field>

          {ghUser && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginTop: 8,
              padding: '8px 12px', background: 'var(--green-bg)',
              border: '1px solid var(--green)', borderRadius: 'var(--r)',
            }}>
              <img src={ghUser.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>@{ghUser.login}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ghUser.name}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Start */}
        <Card title="Quick Start" accent="📋">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div><span style={{ color: 'var(--accent)' }}>1.</span> Set your <b>Default Repo Folder</b> and <b>Remote URL</b> above, then <b>Save Settings</b>.</div>
            <div><span style={{ color: 'var(--accent)' }}>2.</span> For a new project: go to <b>Init / Clone</b> → Init Repository.</div>
            <div><span style={{ color: 'var(--accent)' }}>3.</span> To push: go to <b>Stage & Commit</b> → Stage → Commit, then <b>Push</b>.</div>
            <div><span style={{ color: 'var(--accent)' }}>4.</span> PAT is required for Push, Pull, and Pull Requests on private repos.</div>
          </div>
        </Card>

        {/* About & Updates */}
        <Card title="About & Updates" accent="◎">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>GitFast</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Version {APP_VERSION} · by Ndenga Franck</div>
            </div>
            <Btn variant="secondary" onClick={checkUpdate} disabled={checkingUpdate}>
              {checkingUpdate ? '⏳ Checking…' : '↻ Check for Updates'}
            </Btn>
          </div>

          {/* Update status feedback */}
          {updateStatus && (
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--r)', fontSize: 12,
              background: updateStatus.state === 'downloaded' ? 'var(--green-bg)'
                        : updateStatus.state === 'available'  ? 'var(--accent-dim)'
                        : updateStatus.state === 'up-to-date' ? 'var(--bg2)'
                        : 'var(--bg2)',
              border: `1px solid ${
                updateStatus.state === 'downloaded' ? 'var(--green)'
                : updateStatus.state === 'available' ? 'var(--accent)'
                : 'var(--border)'
              }`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}>
              <span style={{
                color: updateStatus.state === 'downloaded' ? 'var(--green)'
                     : updateStatus.state === 'available'  ? 'var(--accent)'
                     : 'var(--text-muted)',
              }}>
                {updateStatus.state === 'checking'   && '⏳ Checking for updates…'}
                {updateStatus.state === 'up-to-date' && '✓ You are on the latest version.'}
                {updateStatus.state === 'available'  && `⬇ v${updateStatus.version} is downloading in the background…`}
                {updateStatus.state === 'downloaded' && `✅ v${updateStatus.version} downloaded — restart to install.`}
              </span>
              {updateStatus.state === 'downloaded' && (
                <Btn variant="primary" sm onClick={() => window.gitfast?.installUpdate()}>
                  Restart & Install
                </Btn>
              )}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
            Updates are checked automatically on startup. When a new version is available,
            it downloads silently in the background and you'll see a banner at the top of the app.
          </div>
        </Card>

        <BtnGroup>
          <Btn variant="primary" onClick={save}>Save Settings</Btn>
          <Btn variant="secondary" onClick={test} disabled={testing}>
            {testing ? '⏳ Testing…' : 'Test GitHub Connection'}
          </Btn>
        </BtnGroup>

      </div>
    </div>
  )
}
