import React, { useState } from 'react'

export function Card({ title, accent, children, style }) {
  return (
    <div style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: 18, marginBottom: 14,
      animation: 'fadeUp .2s ease', ...style,
    }}>
      {title && (
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1.4px',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {accent && <span style={{ color: 'var(--accent)' }}>{accent}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 3 }}>{hint}</div>}
    </div>
  )
}

export function Input({ id, type = 'text', value, onChange, placeholder, style, rightEl }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', padding: rightEl ? '8px 36px 8px 10px' : '8px 10px',
          color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12, outline: 'none',
          transition: 'border .15s, box-shadow .15s',
          letterSpacing: type === 'password' ? 3 : 'normal',
          ...style,
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 2px var(--accent-dim)'; }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
      {rightEl && (
        <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
          {rightEl}
        </div>
      )}
    </div>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: '8px 10px',
        color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 12, outline: 'none',
        resize: 'vertical', transition: 'border .15s',
      }}
      onFocus={e => { e.target.style.borderColor = 'var(--accent)'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; }}
    />
  )
}

const BTN_VARIANTS = {
  primary: { bg: 'var(--accent)', color: 'var(--bg0)', border: 'var(--accent)' },
  secondary: { bg: 'var(--bg3)', color: 'var(--text)', border: 'var(--border)' },
  danger: { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red)' },
  ghost: { bg: 'transparent', color: 'var(--text-muted)', border: 'transparent' },
}

export function Btn({ children, variant = 'secondary', onClick, disabled, full, sm, style }) {
  const [hover, setHover] = useState(false)
  const v = BTN_VARIANTS[variant]
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: sm ? '4px 10px' : '7px 14px',
        borderRadius: 'var(--r)', border: `1px solid ${v.border}`,
        background: hover && variant === 'primary' ? 'color-mix(in srgb, var(--accent) 85%, white)' : v.bg,
        color: v.color, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font)', fontSize: sm ? 11 : 12, fontWeight: 500,
        opacity: disabled ? .4 : 1, transition: 'all .12s',
        whiteSpace: 'nowrap', width: full ? '100%' : 'auto',
        justifyContent: full ? 'center' : 'flex-start',
        ...style,
      }}
    >{children}</button>
  )
}

export function BtnGroup({ children }) {
  return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>{children}</div>
}

export function Badge({ children, color = 'blue' }) {
  const colors = {
    green: { bg: 'var(--green-bg)', color: 'var(--green)', border: 'var(--green)' },
    blue: { bg: 'var(--blue-bg)', color: 'var(--blue)', border: 'var(--blue)' },
    red: { bg: 'var(--red-bg)', color: 'var(--red)', border: 'var(--red)' },
    orange: { bg: 'var(--orange-bg)', color: 'var(--orange)', border: 'var(--orange)' },
    purple: { bg: 'rgba(176,138,255,.1)', color: 'var(--purple)', border: 'var(--purple)' },
  }
  const c = colors[color]
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
    }}>{children}</span>
  )
}

export function Spinner({ size = 14 }) {
  return (
    <span style={{
      width: size, height: size, border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)', borderRadius: '50%',
      display: 'inline-block', animation: 'spin .6s linear infinite', flexShrink: 0,
    }} />
  )
}

export function Empty({ icon, text }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 16px', color: 'var(--text-dim)', textAlign: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 26 }}>{icon}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{text}</span>
    </div>
  )
}

export function Row({ children, gap = 8 }) {
  return <div style={{ display: 'flex', gap, alignItems: 'flex-end' }}>{children}</div>
}

export function PanelHeader({ title, sub }) {
  return (
    <div style={{
      padding: '20px 26px 16px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg1)', flexShrink: 0,
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginBottom: 2 }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>{sub}</p>
    </div>
  )
}

export function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '14px 0' }} />
}
