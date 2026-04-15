import React from 'react'
import { Btn } from './UI.jsx'

export default function QuickBar({ onAddAll, onCommit, onPull, onPush, onRefresh }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 24px', background: 'var(--bg1)',
      borderBottom: '1px solid var(--border)', flexShrink: 0,
    }}>
      <span style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '1.5px', marginRight: 4, fontWeight: 700 }}>QUICK</span>
      <Btn variant="ghost" sm onClick={onAddAll}>⊕ Add All</Btn>
      <Btn variant="ghost" sm onClick={onCommit}>✎ Commit</Btn>
      <Btn variant="ghost" sm onClick={onPull}>↓ Pull</Btn>
      <Btn variant="ghost" sm onClick={onPush}>↑ Push</Btn>
      <Btn variant="ghost" sm onClick={onRefresh}>↻ Refresh</Btn>
    </div>
  )
}
