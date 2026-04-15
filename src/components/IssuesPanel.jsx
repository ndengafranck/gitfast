import React, { useState, useEffect } from 'react'
import { Card, PanelHeader, Field, Input, Textarea, Btn, BtnGroup, Row, Badge, Spinner, Empty } from './UI.jsx'

function ago(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function IssuesPanel({ settings, toast }) {
  const [remoteUrl, setRemoteUrl] = useState(settings.defaultRemote || '')
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterState, setFilterState] = useState('open')

  // Create issue form
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [labels, setLabels] = useState('')
  const [creating, setCreating] = useState(false)

  // Comment
  const [commentText, setCommentText] = useState({})
  const [commenting, setCommenting] = useState(null)
  const [closingIssue, setClosingIssue] = useState(null)
  const [expandedIssue, setExpandedIssue] = useState(null)

  useEffect(() => {
    if (settings.defaultRemote) setRemoteUrl(settings.defaultRemote)
  }, [settings.defaultRemote])

  const loadIssues = async () => {
    if (!remoteUrl) return toast('Enter a remote URL.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    setLoading(true)
    const r = await window.gitfast?.ghListIssues({ remoteUrl, pat: settings.pat, state: filterState })
    setLoading(false)
    if (!r?.ok) return toast(r?.error || 'Failed', 'error')
    setIssues(r.issues || [])
  }

  useEffect(() => {
    if (remoteUrl && settings.pat) loadIssues()
  }, [filterState])

  const createIssue = async () => {
    if (!title.trim()) return toast('Title is required.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    setCreating(true)
    const labelArr = labels.split(',').map(l => l.trim()).filter(Boolean)
    const r = await window.gitfast?.ghCreateIssue({
      remoteUrl, pat: settings.pat, title: title.trim(), body, labels: labelArr,
    })
    setCreating(false)
    if (!r?.ok) return toast(r?.error || 'Failed to create issue', 'error')
    toast(`✓ Issue #${r.issue.number} created!`, 'success')
    setTitle(''); setBody(''); setLabels('')
    loadIssues()
  }

  const closeIssue = async (issue) => {
    setClosingIssue(issue.number)
    const r = await window.gitfast?.ghCloseIssue({ remoteUrl, pat: settings.pat, issueNumber: issue.number })
    setClosingIssue(null)
    toast(r?.ok ? `✓ Issue #${issue.number} closed` : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) loadIssues()
  }

  const addComment = async (issueNumber) => {
    const text = commentText[issueNumber]?.trim()
    if (!text) return toast('Enter a comment.', 'error')
    setCommenting(issueNumber)
    const r = await window.gitfast?.ghAddComment({ remoteUrl, pat: settings.pat, issueNumber, body: text })
    setCommenting(null)
    if (!r?.ok) return toast(r?.error || 'Failed', 'error')
    toast('✓ Comment added!', 'success')
    setCommentText(prev => ({ ...prev, [issueNumber]: '' }))
  }

  const LABEL_COLORS = {
    bug: 'red', feature: 'blue', enhancement: 'blue',
    question: 'purple', documentation: 'orange', help: 'green',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Issues" sub="Browse, create, and manage GitHub issues" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* Create Issue */}
        <Card title="Create Issue" accent="⊕">
          <Field label="Title">
            <Input value={title} onChange={setTitle} placeholder="Bug: something is broken" />
          </Field>
          <Field label="Description">
            <Textarea value={body} onChange={setBody} placeholder="Steps to reproduce, expected behavior..." rows={4} />
          </Field>
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Labels (comma-separated)" hint="e.g. bug, enhancement">
                <Input value={labels} onChange={setLabels} placeholder="bug, enhancement" />
              </Field>
            </div>
          </Row>
          <Field label="Remote URL">
            <Input value={remoteUrl} onChange={setRemoteUrl} placeholder="https://github.com/user/repo.git" />
          </Field>
          <BtnGroup>
            <Btn variant="primary" onClick={createIssue} disabled={creating || !title.trim()}>
              {creating ? '⏳ Creating…' : '⊕ Create Issue'}
            </Btn>
          </BtnGroup>
        </Card>

        {/* Issues list */}
        <Card title="Issues" accent="⊡">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Remote URL">
                <Input value={remoteUrl} onChange={setRemoteUrl} placeholder="https://github.com/user/repo.git" />
              </Field>
            </div>
            <Btn onClick={loadIssues} disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? <><Spinner size={11} /> Loading</> : '↻ Load'}
            </Btn>
          </Row>

          {/* State filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['open', 'closed', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilterState(s)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: filterState === s ? 'var(--accent)' : 'var(--border)',
                  background: filterState === s ? 'var(--accent-dim)' : 'transparent',
                  color: filterState === s ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer',
                }}
              >{s}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
          ) : issues.length === 0 ? (
            <Empty icon="⊡" text="No issues found. Load issues to get started." />
          ) : (
            issues.map(issue => (
              <div key={issue.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    background: 'var(--bg2)',
                    border: `1px solid ${expandedIssue === issue.number ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: expandedIssue === issue.number ? 'var(--r) var(--r) 0 0' : 'var(--r)',
                    padding: 14, cursor: 'pointer',
                  }}
                  onClick={() => setExpandedIssue(expandedIssue === issue.number ? null : issue.number)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{
                      fontSize: 14, flexShrink: 0,
                      color: issue.state === 'open' ? 'var(--green)' : 'var(--text-dim)',
                    }}>
                      {issue.state === 'open' ? '○' : '●'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: 5 }}>#{issue.number}</span>
                        {issue.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                        {issue.labels?.map(lbl => (
                          <span key={lbl.name} style={{
                            fontSize: 9, padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                            background: `#${lbl.color}22`,
                            color: `#${lbl.color}`,
                            border: `1px solid #${lbl.color}55`,
                          }}>{lbl.name}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        @{issue.user?.login} · {ago(issue.created_at)}
                        {issue.comments > 0 && <span style={{ marginLeft: 8 }}>💬 {issue.comments}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      {issue.state === 'open' && (
                        <Btn variant="danger" sm onClick={() => closeIssue(issue)} disabled={closingIssue === issue.number}>
                          {closingIssue === issue.number ? '⏳' : '⊘ Close'}
                        </Btn>
                      )}
                      <Btn variant="ghost" sm onClick={() => window.gitfast?.openExternal(issue.html_url)}>
                        ↗
                      </Btn>
                    </div>
                  </div>
                </div>

                {/* Expanded: comment box */}
                {expandedIssue === issue.number && (
                  <div style={{
                    background: 'var(--bg1)', border: '1px solid var(--accent)',
                    borderTop: 'none', borderRadius: '0 0 var(--r) var(--r)',
                    padding: 12,
                  }}>
                    {issue.body && (
                      <div style={{
                        fontSize: 11, color: 'var(--text-muted)', marginBottom: 10,
                        padding: 10, background: 'var(--bg2)', borderRadius: 4,
                        whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto',
                      }}>
                        {issue.body}
                      </div>
                    )}
                    <Textarea
                      value={commentText[issue.number] || ''}
                      onChange={v => setCommentText(prev => ({ ...prev, [issue.number]: v }))}
                      placeholder="Add a comment…"
                      rows={2}
                    />
                    <BtnGroup>
                      <Btn
                        variant="primary" sm
                        onClick={() => addComment(issue.number)}
                        disabled={commenting === issue.number}
                      >
                        {commenting === issue.number ? '⏳' : '✎ Comment'}
                      </Btn>
                    </BtnGroup>
                  </div>
                )}
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
