import React from 'react'

const NAV = [
  { group: 'Workspace', items: [
    { id: 'status',     icon: '◈', label: 'Status' },
    { id: 'init-clone', icon: '⬡', label: 'Init / Clone' },
  ]},
  { group: 'Changes', items: [
    { id: 'commit', icon: '✎', label: 'Stage & Commit' },
    { id: 'push',   icon: '↑', label: 'Push' },
    { id: 'pull',   icon: '↓', label: 'Pull' },
  ]},
  { group: 'Branches', items: [
    { id: 'branches', icon: '⎇', label: 'Branches' },
    { id: 'prs',      icon: '⇋', label: 'Pull Requests' },
  ]},
  { group: 'GitHub', items: [
    { id: 'actions',  icon: '▶', label: 'Actions' },
    { id: 'issues',   icon: '⊡', label: 'Issues' },
    { id: 'releases', icon: '◈', label: 'Releases' },
  ]},
  { group: 'Config', items: [
    { id: 'gitignore', icon: '🚫', label: '.gitignore' },
    { id: 'settings',  icon: '⚙',  label: 'Settings' },
  ]},
]

export default function Sidebar({ active, onNav, folder, branch, prCount }) {
  const folderName = folder ? folder.split(/[/\\]/).pop() : null
  return (
    <div style={{
      width: 'var(--sidebar-w)', minWidth: 'var(--sidebar-w)',
      background: 'var(--bg1)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {NAV.map(({ group, items }) => (
        <div key={group} style={{ padding: '14px 8px 4px' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '1.8px',
            color: 'var(--text-dim)', textTransform: 'uppercase',
            padding: '0 8px 7px',
          }}>{group}</div>
          {items.map(item => (
            <NavBtn
              key={item.id}
              item={item}
              active={active === item.id}
              onClick={() => onNav(item.id)}
              badge={item.id === 'prs' && prCount > 0 ? prCount : null}
            />
          ))}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '10px 8px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          padding: '9px 12px', background: 'var(--bg2)',
          border: '1px solid var(--border)', borderRadius: 'var(--r)',
        }}>
          <div style={{
            color: 'var(--text)', fontSize: 12, fontWeight: 600,
            marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{folderName || 'No repo'}</div>
          <div style={{ color: 'var(--green)', fontSize: 11 }}>
            {branch ? `⎇ ${branch}` : '─'}
          </div>
        </div>
      </div>
    </div>
  )
}

function NavBtn({ item, active, onClick, badge }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 10px', borderRadius: 'var(--r)',
        background: (active || hover) ? 'var(--bg3)' : 'transparent',
        border: 'none', color: active ? 'var(--text)' : hover ? 'var(--text)' : 'var(--text-muted)',
        cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12,
        textAlign: 'left', transition: 'all .12s', position: 'relative',
        marginBottom: 1,
      }}
    >
      {active && (
        <span style={{
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 16, background: 'var(--accent)', borderRadius: '0 2px 2px 0',
        }} />
      )}
      <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{item.icon}</span>
      <span>{item.label}</span>
      {badge && (
        <span style={{
          marginLeft: 'auto', background: 'var(--accent)', color: 'var(--bg0)',
          fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10,
        }}>{badge}</span>
      )}
    </button>
  )
}
