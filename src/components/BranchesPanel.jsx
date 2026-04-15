import React, { useState, useEffect } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup, Row, Badge, Spinner, Empty } from './UI.jsx'

export default function BranchesPanel({ settings, toast, onRefresh }) {
  const [branches, setBranches] = useState([])
  const [current, setCurrent] = useState('')
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [mergeName, setMergeName] = useState('')
  const [busy, setBusy] = useState('')

  const folder = settings.defaultFolder

  const load = async () => {
    if (!folder) return
    setLoading(true)
    const r = await window.gitfast?.gitStatus({ folder })
    setLoading(false)
    if (r?.ok) {
      setBranches(r.branches.all || [])
      setCurrent(r.branches.current || '')
    }
  }

  useEffect(() => { load() }, [folder])

  const doCreate = async () => {
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    if (!newName.trim()) return toast('Enter a branch name.', 'error')
    setBusy('create')
    const r = await window.gitfast?.gitBranchCreate({ folder, branchName: newName.trim() })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) { setNewName(''); load(); onRefresh(folder) }
  }

  const doSwitch = async (name) => {
    setBusy('switch-' + name)
    const r = await window.gitfast?.gitBranchSwitch({ folder, branchName: name })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) { load(); onRefresh(folder) }
  }

  const doDelete = async (name) => {
    setBusy('delete-' + name)
    const r = await window.gitfast?.gitBranchDelete({ folder, branchName: name })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) load()
  }

  const doMerge = async () => {
    if (!folder) return toast('Set a repo folder in Settings first.', 'error')
    if (!mergeName.trim()) return toast('Enter a branch name to merge.', 'error')
    setBusy('merge')
    const r = await window.gitfast?.gitBranchMerge({ folder, branchName: mergeName.trim() })
    setBusy('')
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) { setMergeName(''); load(); onRefresh(folder) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Branches" sub="Create, switch, merge, or delete branches" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        <Card title="New Branch" accent="⊕">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Branch Name">
                <Input value={newName} onChange={setNewName} placeholder="feature/my-feature" />
              </Field>
            </div>
            <Btn variant="primary" onClick={doCreate} disabled={busy === 'create'} style={{ marginBottom: 10 }}>
              {busy === 'create' ? '⏳' : 'Create & Switch'}
            </Btn>
          </Row>
        </Card>

        <Card title="Local Branches" accent="⎇">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
          ) : branches.length === 0 ? (
            <Empty icon="⎇" text="No branches yet" />
          ) : (
            branches.map(b => (
              <div key={b} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 'var(--r)',
                background: b === current ? 'var(--green-bg)' : 'var(--bg2)',
                border: `1px solid ${b === current ? 'var(--green)' : 'var(--border)'}`,
                marginBottom: 6,
              }}>
                <span style={{
                  flex: 1, fontSize: 12,
                  color: b === current ? 'var(--green)' : 'var(--text)',
                  fontWeight: b === current ? 600 : 400,
                }}>
                  {b === current ? '⎇ ' : ''}{b}
                </span>
                {b === current
                  ? <Badge color="green">current</Badge>
                  : (
                    <div style={{ display: 'flex', gap: 5 }}>
                      <Btn variant="secondary" sm onClick={() => doSwitch(b)} disabled={busy === 'switch-' + b}>
                        Switch
                      </Btn>
                      <Btn variant="danger" sm onClick={() => doDelete(b)} disabled={busy === 'delete-' + b}>
                        Delete
                      </Btn>
                    </div>
                  )
                }
              </div>
            ))
          )}
        </Card>

        <Card title="Merge Branch Into Current" accent="⇋">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Branch to Merge">
                <Input value={mergeName} onChange={setMergeName} placeholder="feature/my-feature" />
              </Field>
            </div>
            <Btn variant="secondary" onClick={doMerge} disabled={busy === 'merge'} style={{ marginBottom: 10 }}>
              {busy === 'merge' ? '⏳' : 'Merge'}
            </Btn>
          </Row>
        </Card>

      </div>
    </div>
  )
}
