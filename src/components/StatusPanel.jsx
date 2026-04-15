import React from 'react'
import { Card, PanelHeader, Spinner, Empty, Badge, Btn } from './UI.jsx'

function StatBox({ val, label }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '13px 14px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{val}</div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
    </div>
  )
}

const FILE_COLORS = { M: 'var(--yellow)', A: 'var(--green)', D: 'var(--red)', '?': 'var(--text-muted)' }

export default function StatusPanel({ repoData, loading, error, folder, onOpenSettings, onRefresh }) {

  // ── No folder configured ──────────────────────────────────────────────────
  if (!folder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <PanelHeader title="Repository Status" sub="Overview of your working directory" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 40 }}>📂</span>
          <div style={{ color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700 }}>No repository loaded</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Set a folder path in Settings to get started.</div>
          <Btn variant="primary" onClick={onOpenSettings}>⚙ Open Settings</Btn>
        </div>
      </div>
    )
  }

  // ── Loading (with timeout safety — max a few seconds) ─────────────────────
  if (loading && !repoData && !error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <PanelHeader title="Repository Status" sub={folder} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14 }}>
          <Spinner size={28} />
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Reading repository…</span>
        </div>
      </div>
    )
  }

  // ── Error state (not a repo, git not found, permission error, etc.) ────────
  if (error && !repoData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <PanelHeader title="Repository Status" sub={folder} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, padding: 32 }}>
          <span style={{ fontSize: 36 }}>⚠️</span>
          <div style={{
            background: 'var(--red-bg)', border: '1px solid var(--red)',
            borderRadius: 'var(--r)', padding: '14px 18px',
            color: 'var(--red)', fontSize: 12, maxWidth: 480,
            textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-wrap',
          }}>
            {error}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="primary" onClick={() => onRefresh(folder)}>↻ Retry</Btn>
            <Btn variant="secondary" onClick={onOpenSettings}>⚙ Settings</Btn>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', maxWidth: 400 }}>
            Make sure the folder exists and is a git repository.<br/>
            Use <b>Init / Clone</b> to set one up if needed.
          </div>
        </div>
      </div>
    )
  }

  // ── Loaded ────────────────────────────────────────────────────────────────
  const { status, log = [], remotes = [], branches = {} } = repoData || {}

  const files = repoData ? [
    ...((status?.modified  || []).map(f => ({ f, t: 'M' }))),
    ...((status?.not_added || []).map(f => ({ f, t: '?' }))),
    ...((status?.created   || []).map(f => ({ f, t: 'A' }))),
    ...((status?.deleted   || []).map(f => ({ f, t: 'D' }))),
  ] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader
        title="Repository Status"
        sub={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {folder}
            <button
              onClick={() => onRefresh(folder)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0 }}
              title="Refresh"
            >↻</button>
          </span>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <StatBox val={status ? (status.modified.length + status.not_added.length) : '─'} label="Modified Files" />
          <StatBox val={status ? (status.staged.length + status.created.length) : '─'}    label="Staged Files" />
          <StatBox val={branches.current || '─'}                                           label="Current Branch" />
          <StatBox val={status ? `${status.ahead}↑ ${status.behind}↓` : '─'}              label="Ahead / Behind" />
        </div>

        <Card title="Working Tree" accent="⊡">
          {files.length === 0
            ? <Empty icon="✓" text="Clean working tree" />
            : files.map(({ f, t }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 11, width: 14, textAlign: 'center', color: FILE_COLORS[t] || 'var(--text-muted)' }}>{t}</span>
                <span style={{ fontSize: 11, color: 'var(--text)', wordBreak: 'break-all' }}>{f}</span>
              </div>
            ))
          }
        </Card>

        <Card title="Recent Commits" accent="⊡">
          {log.length === 0
            ? <Empty icon="○" text="No commits yet" />
            : log.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 0', borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  background: 'var(--bg3)', color: 'var(--purple)',
                  padding: '2px 6px', borderRadius: 4, fontSize: 10, flexShrink: 0, marginTop: 2,
                }}>{c.hash?.slice(0, 7)}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{c.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.author_name} · {new Date(c.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          }
        </Card>

        <Card title="Remotes" accent="⊡">
          {remotes.length === 0
            ? <Empty icon="⊘" text="No remotes configured" />
            : remotes.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 0', borderBottom: i < remotes.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <Badge color="blue">{r.name}</Badge>
                <span style={{ color: 'var(--text-muted)', fontSize: 11, wordBreak: 'break-all' }}>{r.refs?.fetch || ''}</span>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  )
}
