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

export default function ReleasesPanel({ settings, toast }) {
  const [remoteUrl, setRemoteUrl] = useState(settings.defaultRemote || '')
  const [releases, setReleases] = useState([])
  const [loading, setLoading] = useState(false)

  // Create form
  const [tagName, setTagName] = useState('')
  const [releaseName, setReleaseName] = useState('')
  const [releaseBody, setReleaseBody] = useState('')
  const [targetBranch, setTargetBranch] = useState('main')
  const [isDraft, setIsDraft] = useState(false)
  const [isPrerelease, setIsPrerelease] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (settings.defaultRemote) setRemoteUrl(settings.defaultRemote)
  }, [settings.defaultRemote])

  const loadReleases = async () => {
    if (!remoteUrl) return toast('Enter a remote URL.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    setLoading(true)
    const r = await window.gitfast?.ghListReleases({ remoteUrl, pat: settings.pat })
    setLoading(false)
    if (!r?.ok) return toast(r?.error || 'Failed', 'error')
    setReleases(r.releases || [])
  }

  const createRelease = async () => {
    if (!tagName.trim()) return toast('Tag name is required (e.g. v1.0.0)', 'error')
    setCreating(true)
    const r = await window.gitfast?.ghCreateRelease({
      remoteUrl, pat: settings.pat,
      tagName: tagName.trim(),
      name: releaseName.trim() || tagName.trim(),
      body: releaseBody,
      targetCommitish: targetBranch,
      draft: isDraft,
      prerelease: isPrerelease,
    })
    setCreating(false)
    if (!r?.ok) return toast(r?.error || 'Failed to create release', 'error')
    toast(`✓ Release ${r.release.tag_name} created!`, 'success')
    setTagName(''); setReleaseName(''); setReleaseBody('')
    loadReleases()
  }

  const deleteRelease = async (release) => {
    if (!window.confirm(`Delete release "${release.name || release.tag_name}"?`)) return
    setDeleting(release.id)
    const r = await window.gitfast?.ghDeleteRelease({ remoteUrl, pat: settings.pat, releaseId: release.id })
    setDeleting(null)
    toast(r?.ok ? '✓ Release deleted' : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) loadReleases()
  }

  const tagSuggestion = tagName
    ? tagName
    : releases.length > 0
      ? bumpVersion(releases[0].tag_name)
      : 'v1.0.0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader title="Releases" sub="Create and manage GitHub releases and tags" />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* Create Release */}
        <Card title="Create Release" accent="⊕">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Tag Name" hint={`Next suggested: ${tagSuggestion}`}>
                <Input value={tagName} onChange={setTagName} placeholder="v1.0.0" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Release Title">
                <Input value={releaseName} onChange={setReleaseName} placeholder="Version 1.0.0" />
              </Field>
            </div>
          </Row>
          <Field label="Release Notes">
            <Textarea value={releaseBody} onChange={setReleaseBody} placeholder="## What's Changed&#10;&#10;- Feature X added&#10;- Bug Y fixed" rows={5} />
          </Field>
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Target Branch">
                <Input value={targetBranch} onChange={setTargetBranch} placeholder="main" />
              </Field>
            </div>
            <div style={{ flex: 1 }}>
              <Field label="Remote URL">
                <Input value={remoteUrl} onChange={setRemoteUrl} placeholder="https://github.com/user/repo.git" />
              </Field>
            </div>
          </Row>
          <div style={{ display: 'flex', gap: 16, marginBottom: 8, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={isDraft}
                onChange={e => setIsDraft(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Draft (don't publish yet)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={isPrerelease}
                onChange={e => setIsPrerelease(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Pre-release
            </label>
          </div>
          <BtnGroup>
            <Btn variant="primary" onClick={createRelease} disabled={creating || !tagName.trim()}>
              {creating ? '⏳ Creating…' : `⊕ ${isDraft ? 'Create Draft' : 'Publish Release'}`}
            </Btn>
          </BtnGroup>
        </Card>

        {/* Releases list */}
        <Card title="Existing Releases" accent="◈">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Remote URL">
                <Input value={remoteUrl} onChange={setRemoteUrl} placeholder="https://github.com/user/repo.git" />
              </Field>
            </div>
            <Btn onClick={loadReleases} disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? <><Spinner size={11} /> Loading</> : '↻ Load'}
            </Btn>
          </Row>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>
          ) : releases.length === 0 ? (
            <Empty icon="◈" text="No releases yet. Load to check." />
          ) : (
            releases.map(release => (
              <div key={release.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: 14, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>
                        {release.tag_name}
                      </span>
                      {release.name && release.name !== release.tag_name && (
                        <span style={{ fontSize: 12, color: 'var(--text)' }}>{release.name}</span>
                      )}
                      {release.draft && <Badge color="orange">draft</Badge>}
                      {release.prerelease && <Badge color="purple">pre-release</Badge>}
                      {!release.draft && !release.prerelease && <Badge color="green">latest</Badge>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: release.body ? 8 : 0 }}>
                      by @{release.author?.login} · {ago(release.published_at || release.created_at)}
                      {release.assets?.length > 0 && (
                        <span style={{ marginLeft: 8 }}>📦 {release.assets.length} asset{release.assets.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    {release.body && (
                      <div style={{
                        fontSize: 10, color: 'var(--text-muted)', marginTop: 6,
                        maxHeight: 60, overflowY: 'hidden',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {release.body.slice(0, 200)}{release.body.length > 200 ? '…' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <Btn variant="ghost" sm onClick={() => window.gitfast?.openExternal(release.html_url)}>
                      ↗ View
                    </Btn>
                    <Btn variant="danger" sm onClick={() => deleteRelease(release)} disabled={deleting === release.id}>
                      {deleting === release.id ? '⏳' : '✕'}
                    </Btn>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

function bumpVersion(tag) {
  if (!tag) return 'v1.0.0'
  const match = tag.match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) return 'v1.0.0'
  const [, major, minor, patch] = match
  return `v${major}.${minor}.${parseInt(patch) + 1}`
}
