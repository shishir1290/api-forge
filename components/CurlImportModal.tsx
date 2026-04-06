'use client';
import { useState, useRef, useEffect } from 'react';
import { Terminal, X, ArrowRight, AlertCircle } from 'lucide-react';
import { parseCurl } from '@/lib/parseCurl';
import type { RequestConfig } from '@/types';

interface Props {
  onImport: (req: RequestConfig) => void;
  onClose: () => void;
}

export default function CurlImportModal({ onImport, onClose }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    // Try reading clipboard on open
    navigator.clipboard?.readText?.().then((text) => {
      if (text.trim().toLowerCase().startsWith('curl')) {
        setValue(text.trim());
      }
    }).catch(() => { /* ignore */ });
  }, []);

  const handleImport = () => {
    const trimmed = value.trim();
    if (!trimmed) { setError('Please paste a cURL command.'); return; }
    const result = parseCurl(trimmed);
    if (!result) {
      setError('Could not parse this cURL command. Make sure it starts with "curl".');
      return;
    }
    onImport(result);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    // Ctrl/Cmd+Enter to import
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleImport();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 1001,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          width: 620,
          maxWidth: '95vw',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          fontFamily: 'Inter, sans-serif',
        }}
        onKeyDown={handleKey}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg,#58a6ff22,#bc8cff22)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Terminal size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
              Import cURL Command
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Paste any cURL command — headers, body, auth, and params are auto-detected
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4, borderRadius: 4,
              display: 'flex',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            placeholder={`curl -X POST https://api.example.com/users \\
  -H 'Authorization: Bearer TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Alice","email":"alice@example.com"}'`}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: 180,
              background: 'var(--bg-tertiary)',
              border: `1px solid ${error ? 'var(--accent-red)' : 'var(--border)'}`,
              borderRadius: 8,
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              fontSize: 12,
              lineHeight: 1.7,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              if (!error) e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onBlur={(e) => {
              if (!error) e.target.style.borderColor = 'var(--border)';
            }}
          />

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
            {[
              'Method (-X)',
              'Headers (-H)',
              'JSON body (-d)',
              'Form data (-F)',
              'URL-encoded (--data)',
              'Bearer / Basic auth',
              'Query params',
              'Cookies',
            ].map((chip) => (
              <span
                key={chip}
                style={{
                  fontSize: 10, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 10,
                  background: 'var(--bg-active)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              marginTop: 12, padding: '8px 12px',
              background: '#ff626215',
              border: '1px solid #ff626230',
              borderRadius: 6, fontSize: 12,
              color: 'var(--accent-red)',
            }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Tip: ⌘+Enter to import
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '7px 16px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              style={{
                background: 'var(--accent-blue)',
                border: 'none', borderRadius: 6,
                padding: '7px 18px', cursor: 'pointer',
                color: 'white', fontSize: 13, fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            >
              Import <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
