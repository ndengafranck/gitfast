import React, { useState } from 'react'
import { Card, PanelHeader, Field, Input, Textarea, Btn, BtnGroup, Row, Badge, Spinner, Empty } from './UI.jsx'

export default function PRsPanel({ settings, toast, onPRCount }) {
  const [prs, setPrs] = useState([])
  const [listRemote, setListRemote] = useState(settings.defaultRemote || '')
  const [loadingPRs, setLoadingPRs] = useState(false)

  const [prRemote, setPrRemote] = useState(settings.defaultRemote || '')
  const [head, setHead] = useState('')
  const [base, setBase] = useState('main')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [creating, setCreating] = useState(false)

  const loadPRs = async () => {
    if (!listRemote) return toast('Enter a remote URL.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    setLoadingPRs(true)
    const r = await window.gitfast?.ghListPRs({ remoteUrl: listRemote, pat: settings.pat })
    setLoadingPRs(false)
    if (!r.ok) return toast(r.error, 'error')
    setPrs(r.prs)
    onPRCount(r.prs.length)
  }

  const doCreatePR = async () => {
    if (!prRemote || !head || !title) return toast('Fill in Remote URL, Head Branch, and Title.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    setCreating(true)
    const r = await window.gitfast?.ghCreatePR({ remoteUrl: prRemote, pat: settings.pat, title, body, head, base })
    setCreating(false)
    if (!r.ok) return toast(r.error, 'error')
    toast(`PR #${r.pr.number} created!`, 'success')
    window.gitfast?.openExternal(r.pr.html_url)
    setHead(''); setTitle(''); setBody('')
  }

  const doMergePR = async (pr) => {
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    const r = await window.gitfast?.ghMergePR({ remoteUrl: listRemote, pat: settings.pat, prNumber: pr.number })
    toast(r.ok ? r.message : r.error, r.ok ? 'success' : 'error')
    if (r.ok) loadPRs()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Pull Requests" sub="View open PRs or create a new pull request via GitHub API" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        <Card title="Create Pull Request" accent="⊕">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Head Branch (from)">
                <Input value={head} onChange={setHead} placeholder="feature/my-feature" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Base Branch (into)">
                <Input value={base} onChange={setBase} placeholder="main" />
              </Field>
            </div>
          </Row>
          <Field label="Title">
            <Input value={title} onChange={setTitle} placeholder="feat: add amazing feature" />
          </Field>
          <Field label="Description">
            <Textarea value={body} onChange={setBody} placeholder="Describe your changes..." rows={3} />
          </Field>
          <Field label="Remote URL">
            <Input value={prRemote} onChange={setPrRemote} placeholder="https://github.com/user/repo.git" />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={doCreatePR} disabled={creating}>
              {creating ? '⏳ Creating…' : '⇋ Create PR'}
            </Btn>
          </BtnGroup>
        </Card>

        <Card title="Open Pull Requests" accent="⇋">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Remote URL">
                <Input value={listRemote} onChange={setListRemote} placeholder="https://github.com/user/repo.git" />
              </Field>
            </div>
            <Btn onClick={loadPRs} disabled={loadingPRs} style={{ marginBottom: 10 }}>
              {loadingPRs ? '⏳' : '↻ Load PRs'}
            </Btn>
          </Row>

          {loadingPRs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
          ) : prs.length === 0 ? (
            <Empty icon="⇋" text="Enter a remote URL and click Load PRs" />
          ) : (
            prs.map(pr => (
              <div key={pr.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: 14, marginBottom: 8,
              }}>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6, fontWeight: 500 }}>
                  <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>#{pr.number}</span>
                  {pr.title}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
                  <span>⎇ {pr.head.ref} → {pr.base.ref}</span>
                  <span>@{pr.user.login}</span>
                  <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn variant="ghost" sm onClick={() => window.gitfast?.openExternal(pr.html_url)}>
                    View on GitHub ↗
                  </Btn>
                  <Btn variant="primary" sm onClick={() => doMergePR(pr)}>
                    Merge PR
                  </Btn>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
