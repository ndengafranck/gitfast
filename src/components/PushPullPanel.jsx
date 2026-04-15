import React, { useState } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup } from './UI.jsx'

export default function PushPanel({ settings, toast, onRefresh, currentBranch }) {
  const [remote, setRemote] = useState(settings.defaultRemote || '')
  const [branch, setBranch] = useState(currentBranch || 'main')
  const [busy, setBusy] = useState(false)

  const doPush = async () => {
    const folder = settings.defaultFolder
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    if (!remote) return toast('Enter a remote URL.', 'error')
    setBusy(true)
    toast('Pushing…', 'info')
    const r = await window.gitfast?.gitPush({ folder, remoteUrl: remote, branch, pat: settings.pat })
    setBusy(false)
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Push" sub="Push your commits to the remote repository" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
        <Card title="Push to Remote" accent="↑">
          <Field label="Remote URL" hint="Pre-filled from settings. Override if needed.">
            <Input value={remote} onChange={setRemote} placeholder="https://github.com/user/repo.git" />
          </Field>
          <Field label="Branch">
            <Input value={branch} onChange={setBranch} placeholder="main" />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doPush} disabled={busy}>
              {busy ? '⏳ Pushing…' : '↑ Push'}
            </Btn>
          </BtnGroup>
        </Card>
      </div>
    </div>
  )
}

export function PullPanel({ settings, toast, onRefresh, currentBranch }) {
  const [branch, setBranch] = useState(currentBranch || 'main')
  const [busy, setBusy] = useState(false)

  const doPull = async () => {
    const folder = settings.defaultFolder
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    setBusy(true)
    toast('Pulling…', 'info')
    const r = await window.gitfast?.gitPull({ folder, branch, pat: settings.pat })
    setBusy(false)
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) onRefresh(folder)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Pull" sub="Pull latest changes from the remote repository" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
        <Card title="Pull from Remote" accent="↓">
          <Field label="Branch">
            <Input value={branch} onChange={setBranch} placeholder="main" />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doPull} disabled={busy}>
              {busy ? '⏳ Pulling…' : '↓ Pull'}
            </Btn>
          </BtnGroup>
        </Card>
      </div>
    </div>
  )
}
