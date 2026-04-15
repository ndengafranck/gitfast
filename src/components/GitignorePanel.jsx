import { useState, useEffect, useCallback } from 'react';
import { Card, Btn } from './UI';

// ── Template library ──────────────────────────────────────────────────────────
const TEMPLATES = {
  node: {
    label: 'Node / JS',
    icon: '⬡',
    content: `# Node / JavaScript
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
.npm
.pnp.*
.yarn/cache
.yarn/unplugged
dist/
build/
.cache/
.parcel-cache/
.next/
.nuxt/
.vite/
coverage/
*.tsbuildinfo
`,
  },
  python: {
    label: 'Python',
    icon: '🐍',
    content: `# Python
__pycache__/
*.py[cod]
*.pyo
*.pyd
*.egg
*.egg-info/
dist/
build/
.eggs/
.venv/
venv/
env/
.env
*.pyc
.pytest_cache/
.mypy_cache/
.ruff_cache/
htmlcov/
.coverage
`,
  },
  java: {
    label: 'Java / Maven / Gradle',
    icon: '☕',
    content: `# Java
*.class
*.jar
*.war
*.ear
*.nar
target/
build/
.gradle/
.mvn/
out/
*.iml
`,
  },
  dotnet: {
    label: '.NET / C#',
    icon: '🔷',
    content: `# .NET / C#
bin/
obj/
*.user
*.suo
*.userprefs
.vs/
*.nupkg
*.snupkg
TestResults/
`,
  },
  rust: {
    label: 'Rust',
    icon: '🦀',
    content: `# Rust
/target/
Cargo.lock
`,
  },
  go: {
    label: 'Go',
    icon: '🐹',
    content: `# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
vendor/
`,
  },
  flutter: {
    label: 'Flutter / Dart',
    icon: '🐦',
    content: `# Flutter / Dart
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
*.g.dart
`,
  },
  php: {
    label: 'PHP / Composer',
    icon: '🐘',
    content: `# PHP
vendor/
composer.lock
.env
.env.local
cache/
storage/logs/
*.log
`,
  },
  ruby: {
    label: 'Ruby / Rails',
    icon: '💎',
    content: `# Ruby
*.gem
*.rbc
.bundle/
vendor/bundle/
log/
tmp/
.env
`,
  },
  xcode: {
    label: 'Xcode / iOS / Swift',
    icon: '🍎',
    content: `# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.moved-aside
*.xccheckout
*.xcscmblueprint
DerivedData/
*.hmap
*.ipa
*.dSYM.zip
*.dSYM
Pods/
`,
  },
  android: {
    label: 'Android',
    icon: '🤖',
    content: `# Android
*.iml
.gradle/
local.properties
.idea/
.DS_Store
build/
captures/
.externalNativeBuild/
.cxx/
*.apk
`,
  },
  editors: {
    label: 'IDEs & Editors',
    icon: '🖥',
    content: `# IDEs & Editors
.vscode/
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace
`,
  },
  os: {
    label: 'OS Files',
    icon: '💻',
    content: `# OS Files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini
$RECYCLE.BIN/
`,
  },
  env: {
    label: 'Secrets / .env',
    icon: '🔐',
    content: `# Secrets & environment
.env
.env.*
!.env.example
*.pem
*.key
secrets/
`,
  },
};

// ── Parse existing .gitignore into sections ───────────────────────────────────
function parseContent(raw) {
  return raw || '';
}

export default function GitignorePanel({ folder, toast }) {
  const [content, setContent]         = useState('');
  const [detected, setDetected]       = useState([]);
  const [selected, setSelected]       = useState(new Set());
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);
  const [tab, setTab]                 = useState('visual'); // 'visual' | 'editor'
  const [dirty, setDirty]             = useState(false);
  const [customLine, setCustomLine]   = useState('');

  const load = useCallback(async () => {
    if (!folder) return;
    setLoading(true);
    try {
      const [readRes, detectRes] = await Promise.all([
        window.gitfast.gitignoreRead({ folder }),
        window.gitfast.gitignoreDetectProject({ folder }),
      ]);
      if (readRes.ok) setContent(parseContent(readRes.content));
      if (detectRes.ok) setDetected(detectRes.detected);
    } finally {
      setLoading(false);
    }
  }, [folder]);

  useEffect(() => { load(); }, [load]);

  // Figure out which template keys are already fully present in content
  const isInContent = (key) => {
    const tmpl = TEMPLATES[key];
    if (!tmpl) return false;
    // Check if the first comment line of the template is in content
    const firstLine = tmpl.content.split('\n').find(l => l.trim());
    return content.includes(firstLine);
  };

  const toggleTemplate = (key) => {
    const tmpl = TEMPLATES[key];
    if (!tmpl) return;
    if (isInContent(key)) {
      // Remove: strip the entire template block from content
      let newContent = content;
      tmpl.content.split('\n').forEach(line => {
        if (line.trim()) {
          const escaped = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          newContent = newContent.replace(new RegExp(`^${escaped}\\r?\\n?`, 'm'), '');
        }
      });
      setContent(newContent.replace(/\n{3,}/g, '\n\n'));
    } else {
      // Add the template block
      setContent(prev => {
        const sep = prev.endsWith('\n\n') ? '' : prev.endsWith('\n') ? '\n' : '\n\n';
        return prev + sep + tmpl.content;
      });
    }
    setDirty(true);
  };

  const addCustomLine = () => {
    if (!customLine.trim()) return;
    setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n') + customLine.trim() + '\n');
    setCustomLine('');
    setDirty(true);
  };

  const save = async () => {
    if (!folder) return toast('No folder selected', 'error');
    setSaving(true);
    try {
      const res = await window.gitfast.gitignoreWrite({ folder, content });
      if (res.ok) { toast('.gitignore saved!', 'success'); setDirty(false); }
      else toast(res.error, 'error');
    } finally {
      setSaving(false);
    }
  };

  const allKeys = Object.keys(TEMPLATES);

  if (!folder) return (
    <div style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>
      Select a repo folder in Settings first.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            .gitignore Manager
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {folder}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {dirty && <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>● Unsaved</span>}
          <Btn onClick={save} disabled={saving || !dirty}>
            {saving ? 'Saving…' : 'Save .gitignore'}
          </Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border)' }}>
        {['visual', 'editor'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0.4rem 1rem',
            fontSize: '0.82rem', fontWeight: tab === t ? 700 : 400,
            color: tab === t ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
            {t === 'visual' ? '🎛 Template Picker' : '✏️ Raw Editor'}
          </button>
        ))}
      </div>

      {tab === 'visual' && (
        <>
          {/* Auto-detected banner */}
          {detected.length > 0 && (
            <Card style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                🔍 Auto-detected in your project:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {detected.map(k => TEMPLATES[k] && (
                  <span key={k} style={{
                    background: 'rgba(99,102,241,0.18)', color: 'var(--accent)',
                    borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {TEMPLATES[k].icon} {TEMPLATES[k].label}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Template grid */}
          <Card>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Click to add / remove sections:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' }}>
              {allKeys.map(key => {
                const tmpl = TEMPLATES[key];
                const active = isInContent(key);
                const isDetected = detected.includes(key);
                return (
                  <button key={key} onClick={() => toggleTemplate(key)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.55rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, textAlign: 'left',
                    border: active ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                    background: active ? 'rgba(99,102,241,0.13)' : 'var(--surface)',
                    color: active ? 'var(--accent)' : 'var(--text)',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}>
                    <span style={{ fontSize: '1rem' }}>{tmpl.icon}</span>
                    <span>{tmpl.label}</span>
                    {active && <span style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>✓</span>}
                    {isDetected && !active && (
                      <span style={{
                        position: 'absolute', top: '3px', right: '4px',
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--accent)', opacity: 0.7,
                      }} title="Detected in project" />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Add custom rule */}
          <Card>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Add custom pattern:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={customLine}
                onChange={e => setCustomLine(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomLine()}
                placeholder="e.g. secrets/, *.log, build/"
                style={{
                  flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '6px', color: 'var(--text)', padding: '0.45rem 0.75rem',
                  fontSize: '0.82rem', fontFamily: 'monospace',
                }}
              />
              <Btn onClick={addCustomLine} disabled={!customLine.trim()}>Add</Btn>
            </div>
          </Card>

          {/* Preview */}
          <Card>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Preview ({content.split('\n').filter(l => l.trim() && !l.startsWith('#')).length} rules):
            </p>
            <pre style={{
              margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)',
              maxHeight: '180px', overflowY: 'auto', lineHeight: 1.5,
              background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.75rem',
              fontFamily: 'monospace',
            }}>
              {content || '# Empty — add templates above'}
            </pre>
          </Card>
        </>
      )}

      {tab === 'editor' && (
        <Card style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Edit raw .gitignore:
          </p>
          <textarea
            value={content}
            onChange={e => { setContent(e.target.value); setDirty(true); }}
            spellCheck={false}
            style={{
              width: '100%', minHeight: '420px', resize: 'vertical',
              background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--text)', padding: '0.75rem',
              fontSize: '0.8rem', fontFamily: 'monospace', lineHeight: 1.6,
              boxSizing: 'border-box',
            }}
          />
        </Card>
      )}
    </div>
  );
}
