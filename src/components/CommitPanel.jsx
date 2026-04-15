import React, { useState } from 'react'
import { Card, PanelHeader, Field, Input, Textarea, Btn, BtnGroup } from './UI.jsx'

export default function CommitPanel({ settings, toast, onRefresh }) {
  const [files, setFiles] = useState('.')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState('')

  const folder = settings.defaultFolder

  const doAdd = async () => {
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    setBusy('add')
    const r = await window.gitfast?.gitAdd({ folder, files: files || '.' })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) onRefresh(folder)
  }

  const doCommit = async () => {
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    if (!msg.trim()) return toast('Enter a commit message.', 'error')
    setBusy('commit')
    const r = await window.gitfast?.gitCommit({ folder, message: msg.trim() })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) { setMsg(''); onRefresh(folder) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Stage & Commit" sub="Stage your changes and create a commit" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
        <Card title="Stage Files" accent="⊕">
          <Field label="Files to Stage" hint="Use '.' to stage all changes, or enter a specific file path.">
            <Input value={files} onChange={setFiles} placeholder=". for all, or specific path" />
          </Field>
          <BtnGroup>
            <Btn variant="secondary" onClick={doAdd} disabled={busy === 'add'}>
              {busy === 'add' ? '⏳ Staging…' : '⊕ Stage'}
            </Btn>
            <Btn variant="ghost" onClick={() => { setFiles('.'); doAdd() }}>Stage All</Btn>
          </BtnGroup>
        </Card>

        <Card title="Commit" accent="✎">
          <Field label="Commit Message">
            <Textarea
              value={msg}
              onChange={setMsg}
              placeholder={'feat: add new feature\n\nDescribe what changed and why...'}
              rows={5}
            />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doCommit} disabled={busy === 'commit' || !msg.trim()}>
              {busy === 'commit' ? '⏳ Committing…' : '✎ Commit'}
            </Btn>
          </BtnGroup>
        </Card>
      </div>
    </div>
  )
}
