import React, { useState } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup, Row } from './UI.jsx'

export default function InitClonePanel({ settings, toast, onRefresh, onSaveSettings }) {
  const [initFolder, setInitFolder] = useState(settings.defaultFolder || '')
  const [initRemote, setInitRemote] = useState(settings.defaultRemote || '')
  const [cloneUrl, setCloneUrl] = useState(settings.defaultRemote || '')
  const [cloneFolder, setCloneFolder] = useState('')
  const [busy, setBusy] = useState('')

  const pick = async (setter) => {
    const f = await window.gitfast?.pickFolder()
    if (f) setter(f)
  }

  const doInit = async () => {
    const folder = initFolder.trim()
    if (!folder) return toast('Enter or browse to a folder path.', 'error')
    setBusy('init')

    const r = await window.gitfast?.gitInit({ folder })
    setBusy('')

    if (!r?.ok) return toast(r?.error || 'Init failed', 'error')
    toast(r.message, 'success')

    // Add remote if provided
    if (initRemote.trim()) {
      const r2 = await window.gitfast?.gitAddRemote({ folder, remoteUrl: initRemote.trim() })
      toast(r2?.ok ? r2.message : (r2?.error || 'Failed to add remote'), r2?.ok ? 'info' : 'error')
    }

    // Save as active workspace and navigate to Status
    await onSaveSettings({
      defaultFolder: folder,
      defaultRemote: initRemote.trim() || settings.defaultRemote,
    })
    onRefresh(folder)
  }

  const doClone = async () => {
    const url = cloneUrl.trim()
    const folder = cloneFolder.trim()
    if (!url) return toast('Enter a remote URL.', 'error')
    if (!folder) return toast('Enter a destination folder path.', 'error')
    setBusy('clone')
    toast('Cloning… this may take a moment ⏳', 'info')

    const r = await window.gitfast?.gitClone({ remoteUrl: url, folder, pat: settings.pat })
    if (!r.ok) {
      setBusy('')
      return toast(r.error, 'error')
    }
    toast(r.message, 'success')

    // Save folder & remote into settings automatically
    await onSaveSettings({ defaultFolder: folder, defaultRemote: url })

    setBusy('')
    onRefresh(folder)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Init / Clone" sub="Initialize a new repo or clone one from GitHub" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* ── Init ── */}
        <Card title="Initialize Repository" accent="⬡">
          <Field
            label="Folder Path"
            hint="The folder to init. It will be created if it doesn't exist."
          >
            <Row>
              <div style={{ flex: 1 }}>
                <Input
                  value={initFolder}
                  onChange={setInitFolder}
                  placeholder="/path/to/my-project"
                />
              </div>
              <Btn onClick={() => pick(setInitFolder)}>Browse</Btn>
            </Row>
          </Field>
          <Field
            label="Remote URL (optional)"
            hint="If provided, remote 'origin' will be set after init."
          >
            <Input
              value={initRemote}
              onChange={setInitRemote}
              placeholder="https://github.com/user/repo.git"
            />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doInit} disabled={busy === 'init'}>
              {busy === 'init' ? '⏳ Initializing…' : '⬡ Init Repository'}
            </Btn>
          </BtnGroup>
        </Card>

        {/* ── Clone ── */}
        <Card title="Clone Repository" accent="⬇">
          <Field label="Remote URL">
            <Input
              value={cloneUrl}
              onChange={setCloneUrl}
              placeholder="https://github.com/user/repo.git"
            />
          </Field>
          <Field
            label="Clone Into Folder"
            hint="The full path where the repo folder will be created."
          >
            <Row>
              <div style={{ flex: 1 }}>
                <Input
                  value={cloneFolder}
                  onChange={setCloneFolder}
                  placeholder="/path/to/destination/repo-name"
                />
              </div>
              <Btn onClick={() => pick(setCloneFolder)}>Browse</Btn>
            </Row>
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doClone} disabled={busy === 'clone'}>
              {busy === 'clone' ? '⏳ Cloning…' : '⬇ Clone'}
            </Btn>
          </BtnGroup>
        </Card>

      </div>
    </div>
  )
}
