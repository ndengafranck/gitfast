import React, { useState, useEffect, useRef } from 'react'
import { Card, PanelHeader, Field, Input, Btn, BtnGroup, Row, Badge, Spinner, Empty } from './UI.jsx'

const STATUS_COLOR = {
  success:    'green',
  completed:  'green',
  failure:    'red',
  cancelled:  'orange',
  skipped:    'orange',
  in_progress:'blue',
  queued:     'purple',
  waiting:    'purple',
  requested:  'purple',
  pending:    'orange',
  timed_out:  'red',
  action_required: 'red',
}

const CONCLUSION_LABEL = {
  success: '✓ success',
  failure: '✗ failure',
  cancelled: '⊘ cancelled',
  skipped: '⊘ skipped',
  timed_out: '⏱ timed out',
  action_required: '! action required',
  null: null,
}

function StatusBadge({ status, conclusion }) {
  const key = conclusion || status
  const color = STATUS_COLOR[key] || 'blue'
  const label = conclusion
    ? (CONCLUSION_LABEL[conclusion] || conclusion)
    : status?.replace(/_/g, ' ')
  return <Badge color={color}>{label}</Badge>
}

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

function duration(startedAt, completedAt) {
  if (!startedAt) return ''
  const end = completedAt ? new Date(completedAt) : new Date()
  const secs = Math.floor((end - new Date(startedAt)) / 1000)
  if (secs < 60) return `${secs}s`
  const m = Math.floor(secs / 60), s = secs % 60
  return `${m}m ${s}s`
}

export default function ActionsPanel({ settings, toast }) {
  const [remoteUrl, setRemoteUrl] = useState(settings.defaultRemote || '')
  const [runs, setRuns] = useState([])
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedRun, setExpandedRun] = useState(null)
  const [runJobs, setRunJobs] = useState({})
  const [expandedJob, setExpandedJob] = useState(null)
  const [jobLogs, setJobLogs] = useState({})
  const [loadingLogs, setLoadingLogs] = useState({})
  const [triggering, setTriggering] = useState(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState('')
  const [triggerBranch, setTriggerBranch] = useState('main')
  const [filterStatus, setFilterStatus] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (settings.defaultRemote) setRemoteUrl(settings.defaultRemote)
  }, [settings.defaultRemote])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => loadRuns(false), 15000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, remoteUrl, settings.pat])

  const loadRuns = async (showLoader = true) => {
    if (!remoteUrl) return toast('Enter a remote URL.', 'error')
    if (!settings.pat) return toast('Add your PAT in Settings first.', 'error')
    if (showLoader) setLoading(true)
    const [runsRes, wfRes] = await Promise.all([
      window.gitfast?.ghListWorkflowRuns({ remoteUrl, pat: settings.pat }),
      window.gitfast?.ghListWorkflows({ remoteUrl, pat: settings.pat }),
    ])
    if (showLoader) setLoading(false)
    if (!runsRes?.ok) return toast(runsRes?.error || 'Failed to load runs', 'error')
    setRuns(runsRes.runs || [])
    if (wfRes?.ok) {
      setWorkflows(wfRes.workflows || [])
      if (wfRes.workflows?.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(wfRes.workflows[0].id)
      }
    }
  }

  const loadJobs = async (runId) => {
    if (runJobs[runId]) {
      setExpandedRun(expandedRun === runId ? null : runId)
      return
    }
    const r = await window.gitfast?.ghGetRunJobs({ remoteUrl, pat: settings.pat, runId })
    if (!r?.ok) return toast(r?.error || 'Failed to load jobs', 'error')
    setRunJobs(prev => ({ ...prev, [runId]: r.jobs }))
    setExpandedRun(runId)
  }

  const loadLogs = async (jobId) => {
    if (jobLogs[jobId]) {
      setExpandedJob(expandedJob === jobId ? null : jobId)
      return
    }
    setLoadingLogs(prev => ({ ...prev, [jobId]: true }))
    const r = await window.gitfast?.ghGetJobLogs({ remoteUrl, pat: settings.pat, jobId })
    setLoadingLogs(prev => ({ ...prev, [jobId]: false }))
    if (!r?.ok) return toast(r?.error || 'Failed to load logs', 'error')
    setJobLogs(prev => ({ ...prev, [jobId]: r.logs }))
    setExpandedJob(jobId)
  }

  const rerunWorkflow = async (runId) => {
    if (!settings.pat) return toast('PAT required', 'error')
    setTriggering(runId)
    const r = await window.gitfast?.ghRerunWorkflow({ remoteUrl, pat: settings.pat, runId })
    setTriggering(null)
    toast(r?.ok ? '↻ Re-run triggered!' : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) setTimeout(() => loadRuns(false), 2000)
  }

  const cancelRun = async (runId) => {
    const r = await window.gitfast?.ghCancelRun({ remoteUrl, pat: settings.pat, runId })
    toast(r?.ok ? '⊘ Run cancelled' : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) setTimeout(() => loadRuns(false), 1500)
  }

  const triggerWorkflow = async () => {
    if (!selectedWorkflow) return toast('Select a workflow', 'error')
    if (!triggerBranch) return toast('Enter a branch name', 'error')
    setTriggering('new')
    const r = await window.gitfast?.ghTriggerWorkflow({
      remoteUrl, pat: settings.pat,
      workflowId: selectedWorkflow,
      branch: triggerBranch,
    })
    setTriggering(null)
    toast(r?.ok ? '▶ Workflow triggered!' : (r?.error || 'Failed'), r?.ok ? 'success' : 'error')
    if (r?.ok) setTimeout(() => loadRuns(false), 3000)
  }

  const filteredRuns = runs.filter(r => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'running') return r.status === 'in_progress' || r.status === 'queued'
    if (filterStatus === 'failed') return r.conclusion === 'failure' || r.conclusion === 'timed_out'
    if (filterStatus === 'success') return r.conclusion === 'success'
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <PanelHeader
        title="GitHub Actions"
        sub="Monitor workflow runs, view logs, trigger and re-run workflows"
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 26px' }}>

        {/* Load controls */}
        <Card title="Repository" accent="⊙">
          <Row>
            <div style={{ flex: 1 }}>
              <Field label="Remote URL">
                <Input
                  value={remoteUrl}
                  onChange={setRemoteUrl}
                  placeholder="https://github.com/user/repo.git"
                />
              </Field>
            </div>
            <Btn variant="primary" onClick={() => loadRuns()} disabled={loading} style={{ marginBottom: 10 }}>
              {loading ? <><Spinner size={11} /> Loading…</> : '↻ Load Runs'}
            </Btn>
          </Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
                style={{ accentColor: 'var(--accent)' }}
              />
              Auto-refresh every 15s
            </label>
            {runs.length > 0 && (
              <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                {runs.length} runs loaded
              </span>
            )}
          </div>
        </Card>

        {/* Trigger workflow */}
        {workflows.length > 0 && (
          <Card title="Trigger Workflow" accent="▶">
            <Row>
              <div style={{ flex: 1 }}>
                <Field label="Workflow">
                  <select
                    value={selectedWorkflow}
                    onChange={e => setSelectedWorkflow(e.target.value)}
                    style={{
                      width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r)', padding: '8px 10px', color: 'var(--text)',
                      fontFamily: 'var(--font)', fontSize: 12, outline: 'none',
                    }}
                  >
                    {workflows.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ width: 120 }}>
                <Field label="Branch">
                  <Input value={triggerBranch} onChange={setTriggerBranch} placeholder="main" />
                </Field>
              </div>
              <Btn
                variant="primary"
                onClick={triggerWorkflow}
                disabled={triggering === 'new'}
                style={{ marginBottom: 10 }}
              >
                {triggering === 'new' ? '⏳' : '▶ Run'}
              </Btn>
            </Row>
          </Card>
        )}

        {/* Filter bar */}
        {runs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['all', 'running', 'success', 'failed'].map(f => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid',
                  borderColor: filterStatus === f ? 'var(--accent)' : 'var(--border)',
                  background: filterStatus === f ? 'var(--accent-dim)' : 'transparent',
                  color: filterStatus === f ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer',
                }}
              >{f}</button>
            ))}
          </div>
        )}

        {/* Runs list */}
        <Card title="Workflow Runs" accent="⊞">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
              <Spinner size={24} />
            </div>
          ) : filteredRuns.length === 0 ? (
            <Empty icon="⊞" text={runs.length === 0 ? 'Enter a URL and click Load Runs' : 'No runs match this filter'} />
          ) : (
            filteredRuns.map(run => (
              <div key={run.id} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    background: 'var(--bg2)', border: `1px solid ${expandedRun === run.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r)', padding: '12px 14px',
                    cursor: 'pointer', transition: 'border .15s',
                  }}
                  onClick={() => loadJobs(run.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <RunStatusIcon status={run.status} conclusion={run.conclusion} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                      {run.name || run.workflow_id}
                    </span>
                    <StatusBadge status={run.status} conclusion={run.conclusion} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--purple)' }}>#{run.run_number}</span>
                    {' · '}
                    <span>{run.head_commit?.message?.split('\n')[0]?.slice(0, 60)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      ⎇ {run.head_branch}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      {run.event}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                      {duration(run.run_started_at, run.updated_at)} · {ago(run.updated_at)}
                    </span>
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      {(run.status === 'in_progress' || run.status === 'queued') && (
                        <Btn variant="danger" sm onClick={() => cancelRun(run.id)}>⊘ Cancel</Btn>
                      )}
                      {(run.conclusion === 'failure' || run.conclusion === 'success' || run.conclusion === 'cancelled') && (
                        <Btn
                          variant="secondary" sm
                          onClick={() => rerunWorkflow(run.id)}
                          disabled={triggering === run.id}
                        >
                          {triggering === run.id ? '⏳' : '↻ Re-run'}
                        </Btn>
                      )}
                      <Btn variant="ghost" sm onClick={() => window.gitfast?.openExternal(run.html_url)}>
                        ↗ GitHub
                      </Btn>
                    </div>
                  </div>
                </div>

                {/* Jobs expansion */}
                {expandedRun === run.id && runJobs[run.id] && (
                  <div style={{
                    background: 'var(--bg1)', border: '1px solid var(--border)',
                    borderTop: 'none', borderRadius: '0 0 var(--r) var(--r)',
                    padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: 1 }}>JOBS</div>
                    {runJobs[run.id].map(job => (
                      <div key={job.id} style={{ marginBottom: 6 }}>
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px',
                            background: expandedJob === job.id ? 'var(--bg3)' : 'var(--bg2)',
                            borderRadius: 'var(--r)',
                            border: `1px solid ${expandedJob === job.id ? 'var(--border-hi)' : 'var(--border)'}`,
                            cursor: 'pointer',
                          }}
                          onClick={() => loadLogs(job.id)}
                        >
                          <RunStatusIcon status={job.status} conclusion={job.conclusion} size={14} />
                          <span style={{ flex: 1, fontSize: 11, color: 'var(--text)' }}>{job.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                            {duration(job.started_at, job.completed_at)}
                          </span>
                          <StatusBadge status={job.status} conclusion={job.conclusion} />
                          {loadingLogs[job.id] && <Spinner size={11} />}
                        </div>

                        {/* Log output */}
                        {expandedJob === job.id && jobLogs[job.id] && (
                          <LogView logs={jobLogs[job.id]} />
                        )}
                      </div>
                    ))}
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

function RunStatusIcon({ status, conclusion, size = 16 }) {
  const key = conclusion || status
  const ICONS = {
    success: { char: '✓', color: 'var(--green)' },
    failure: { char: '✗', color: 'var(--red)' },
    cancelled: { char: '⊘', color: 'var(--orange)' },
    timed_out: { char: '⏱', color: 'var(--red)' },
    skipped: { char: '⊘', color: 'var(--text-muted)' },
    action_required: { char: '!', color: 'var(--red)' },
    in_progress: { char: '●', color: 'var(--blue)' },
    queued: { char: '◌', color: 'var(--purple)' },
    requested: { char: '◌', color: 'var(--purple)' },
    waiting: { char: '◌', color: 'var(--purple)' },
  }
  const icon = ICONS[key] || { char: '●', color: 'var(--text-muted)' }
  const isRunning = status === 'in_progress'
  return (
    <span style={{
      fontSize: size - 2,
      color: icon.color,
      flexShrink: 0,
      animation: isRunning ? 'pulse 1.4s ease-in-out infinite' : 'none',
      display: 'inline-block', width: size, textAlign: 'center',
    }}>
      {icon.char}
    </span>
  )
}

function LogView({ logs }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [logs])

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg0)', border: '1px solid var(--border)',
        borderTop: 'none', borderRadius: '0 0 4px 4px',
        padding: '10px 12px', maxHeight: 320, overflowY: 'auto',
        fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)',
        lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
      }}
    >
      {logs.split('\n').map((line, i) => {
        let color = 'var(--text-muted)'
        if (/error|failed|fatal/i.test(line)) color = 'var(--red)'
        else if (/warning/i.test(line)) color = 'var(--orange)'
        else if (/success|passed|completed/i.test(line)) color = 'var(--green)'
        else if (line.trim().startsWith('##[group]') || line.trim().startsWith('##[section]')) color = 'var(--accent)'
        else if (line.includes('##[')) color = 'var(--yellow)'
        return <div key={i} style={{ color }}>{line || ' '}</div>
      })}
    </div>
  )
}
