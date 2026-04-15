import React, { useState, useEffect } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup, Row } from './UI.jsx'

export default function SettingsPanel({ settings, onSave, toast }) {
  const [folder, setFolder] = useState(settings.defaultFolder || '')
  const [remote, setRemote] = useState(settings.defaultRemote || '')
  const [pat, setPat] = useState(settings.pat || '')
  const [showPat, setShowPat] = useState(false)
  const [ghUser, setGhUser] = useState(null)
  const [testing, setTesting] = useState(false)
  const [gitDiag, setGitDiag] = useState(null)

  // Check git binary on mount
  useEffect(() => {
    window.gitfast?.gitCheck().then(r => setGitDiag(r))
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Settings" sub="Configure your workspace and GitHub authentication" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* ── Git Binary Status ── */}
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

        {/* ── Workspace ── */}
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

        {/* ── GitHub Auth ── */}
        <Card title="GitHub Authentication" accent="🔑">
          <Field
            label="Personal Access Token (PAT)"
            hint={
              <span>
                Create at{' '}
                <a href="#" onClick={e => { e.preventDefault(); window.gitfast?.openExternal('https://github.com/settings/tokens') }}>
                  github.com/settings/tokens
                </a>
                {' '}— enable the <code>repo</code> scope. Required for push, pull, and PRs.
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

        {/* ── Quick-start guide ── */}
        <Card title="Quick Start" accent="📋">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            <div><span style={{ color: 'var(--accent)' }}>1.</span> Set your <b>Default Repo Folder</b> and <b>Remote URL</b> above, then <b>Save Settings</b>.</div>
            <div><span style={{ color: 'var(--accent)' }}>2.</span> For a new project: go to <b>Init / Clone</b> → Init Repository.</div>
            <div><span style={{ color: 'var(--accent)' }}>3.</span> To push: go to <b>Stage & Commit</b> → Stage → Commit, then <b>Push</b>.</div>
            <div><span style={{ color: 'var(--accent)' }}>4.</span> PAT is required for Push, Pull, and Pull Requests on private repos.</div>
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
