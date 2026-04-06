'use client';
import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { KeyValuePair } from '@/types';

interface Props {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  showDescription?: boolean;
}

export default function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  showDescription = false,
}: Props) {
  const addRow = () => {
    onChange([
      ...pairs,
      { id: uuidv4(), key: '', value: '', enabled: true, description: '' },
    ]);
  };

  const removeRow = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  const updateRow = (id: string, field: keyof KeyValuePair, value: string | boolean) => {
    onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const inputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    width: '100%',
    padding: '6px 8px',
    fontSize: '12px',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {pairs.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: showDescription ? '32px 24px 1fr 1fr 1fr 32px' : '32px 24px 1fr 1fr 32px',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '4px 8px',
          }}
        >
          <span />
          <span />
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '0 8px' }}>KEY</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '0 8px' }}>VALUE</span>
          {showDescription && (
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', padding: '0 8px' }}>DESCRIPTION</span>
          )}
          <span />
        </div>
      )}

      {pairs.map((pair) => (
        <div
          key={pair.id}
          style={{
            display: 'grid',
            gridTemplateColumns: showDescription ? '32px 24px 1fr 1fr 1fr 32px' : '32px 24px 1fr 1fr 32px',
            borderBottom: '1px solid var(--border-subtle)',
            alignItems: 'center',
            opacity: pair.enabled ? 1 : 0.4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', color: 'var(--text-muted)' }}>
            <GripVertical size={12} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="checkbox"
              checked={pair.enabled}
              onChange={(e) => updateRow(pair.id, 'enabled', e.target.checked)}
              style={{ accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
            />
          </div>
          <input
            style={inputStyle}
            placeholder={keyPlaceholder}
            value={pair.key}
            onChange={(e) => updateRow(pair.id, 'key', e.target.value)}
          />
          <input
            style={{ ...inputStyle, borderLeft: '1px solid var(--border-subtle)' }}
            placeholder={valuePlaceholder}
            value={pair.value}
            onChange={(e) => updateRow(pair.id, 'value', e.target.value)}
          />
          {showDescription && (
            <input
              style={{ ...inputStyle, borderLeft: '1px solid var(--border-subtle)' }}
              placeholder="Description"
              value={pair.description || ''}
              onChange={(e) => updateRow(pair.id, 'description', e.target.value)}
            />
          )}
          <button
            onClick={() => removeRow(pair.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <button
        onClick={addRow}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--accent-blue)',
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <Plus size={13} />
        Add Row
      </button>
    </div>
  );
}
