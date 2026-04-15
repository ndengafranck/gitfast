import React, { useState } from 'react'

const ICONS  = { success: '✓', error: '✕', info: 'ℹ' }
const COLORS = { success: 'var(--green)', error: 'var(--red)', info: 'var(--blue)' }
const DURATION = { success: 3500, info: 3000, error: 8000 }  // errors stay longer

function ToastItem({ t }) {
  const [copied, setCopied] = useState(false)
  const isLong = t.message.length > 80 || t.message.includes('\n')

  const copy = () => {
    navigator.clipboard?.writeText(t.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{
      background: 'var(--bg3)',
      border: `1px solid ${COLORS[t.type]}`,
      borderRadius: 'var(--r)',
      padding: '10px 14px',
      fontSize: 12,
      minWidth: 280,
      maxWidth: 460,
      boxShadow: `0 4px 24px rgba(0,0,0,.5)`,
      animation: 'slideInRight .2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ color: COLORS[t.type], fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
          {ICONS[t.type]}
        </span>
        <span style={{
          color: 'var(--text)', flex: 1,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6,
        }}>
          {t.message}
        </span>
        {isLong && (
          <button
            onClick={copy}
            title="Copy error"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 11, flexShrink: 0,
              padding: '0 2px',
            }}
          >{copied ? '✓' : '⎘'}</button>
        )}
      </div>
    </div>
  )
}

export default function ToastContainer({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none', maxWidth: 460,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <ToastItem t={t} />
        </div>
      ))}
    </div>
  )
}
