import React from 'react'

const s = {
  bar: {
    height: 'var(--titlebar-h)', background: 'var(--bg1)',
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center',
    WebkitAppRegion: 'drag', flexShrink: 0,
    position: 'relative', zIndex: 100,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '0 18px',
    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900,
    letterSpacing: '-0.5px', userSelect: 'none',
    WebkitAppRegion: 'no-drag',
  },
  center: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, fontSize: 11,
  },
  pill: {
    background: 'var(--bg3)', border: '1px solid var(--border)',
    padding: '2px 10px', borderRadius: 20, color: 'var(--blue)',
    fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
  },
  controls: {
    display: 'flex', alignItems: 'center',
    WebkitAppRegion: 'no-drag', paddingRight: 8,
  },
}

function WBtn({ label, cls, onClick }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 34, height: 'var(--titlebar-h)',
        background: hover ? (cls === 'close' ? 'var(--red)' : 'var(--bg3)') : 'transparent',
        border: 'none', cursor: 'pointer',
        color: hover && cls === 'close' ? '#fff' : 'var(--text-muted)',
        fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background .12s, color .12s',
      }}
    >{label}</button>
  )
}

export default function Titlebar({ folder, branch }) {
  const folderName = folder ? folder.split(/[/\\]/).pop() : null
  return (
    <div style={s.bar}>
      <div style={s.logo}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <span>Git<span style={{ color: 'var(--accent)' }}>Fast</span></span>
      </div>
      <div style={s.center}>
        {folderName
          ? <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{folderName}</span>
          : <span style={{ color: 'var(--text-dim)' }}>No repo selected</span>}
        {branch && (
          <span style={s.pill}>⎇ {branch}</span>
        )}
      </div>
      <div style={s.controls}>
        <WBtn label="─" onClick={() => window.gitfast?.minimize()} />
        <WBtn label="□" onClick={() => window.gitfast?.maximize()} />
        <WBtn label="✕" cls="close" onClick={() => window.gitfast?.close()} />
      </div>
    </div>
  )
}
