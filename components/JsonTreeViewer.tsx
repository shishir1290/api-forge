'use client';
import { useState, useCallback, memo } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countLines(val: JsonValue): number {
  if (val === null || typeof val !== 'object') return 1;
  if (Array.isArray(val)) {
    return val.reduce<number>((acc, v) => acc + countLines(v as JsonValue), 2);
  }
  const keys = Object.keys(val as object);
  return keys.reduce<number>((acc, k) => acc + countLines((val as Record<string, JsonValue>)[k]), 2);
}

function getTypeColor(val: JsonValue): string {
  if (val === null) return 'var(--json-null, #ff7b72)';
  if (typeof val === 'boolean') return 'var(--json-boolean, #79c0ff)';
  if (typeof val === 'number') return 'var(--json-number, #f0883e)';
  if (typeof val === 'string') return 'var(--json-string, #a5d6ff)';
  return 'var(--text-primary)';
}

function renderPrimitive(val: string | number | boolean | null): React.ReactNode {
  if (val === null) return <span style={{ color: 'var(--json-null, #ff7b72)', fontStyle: 'italic' }}>null</span>;
  if (typeof val === 'boolean') return <span style={{ color: 'var(--json-boolean, #79c0ff)' }}>{String(val)}</span>;
  if (typeof val === 'number') return <span style={{ color: 'var(--json-number, #f0883e)' }}>{val}</span>;
  // string
  return <span style={{ color: 'var(--json-string, #a5d6ff)' }}>"{escapeStr(val)}"</span>;
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

// ─── Inline preview (shown when node is collapsed) ───────────────────────────

function InlinePreview({ val, limit = 60 }: { val: JsonValue; limit?: number }) {
  let preview = '';
  try { preview = JSON.stringify(val); } catch { preview = '…'; }
  if (preview.length > limit) preview = preview.slice(0, limit) + '…';
  return (
    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 11 }}>
      {preview}
    </span>
  );
}

// ─── CollapseTag (shown when collapsed, e.g. "{12 lines}" "[3 items]") ───────

function CollapseTag({ val }: { val: JsonValue }) {
  if (Array.isArray(val)) {
    return (
      <span style={{
        color: 'var(--text-muted)', fontSize: 11,
        background: 'var(--bg-active)', borderRadius: 3,
        padding: '0px 5px', marginLeft: 4,
        border: '1px solid var(--border-subtle)',
        userSelect: 'none',
      }}>
        {val.length} {val.length === 1 ? 'item' : 'items'}
      </span>
    );
  }
  if (val !== null && typeof val === 'object') {
    const lines = countLines(val) - 2; // subtract open+close braces
    return (
      <span style={{
        color: 'var(--text-muted)', fontSize: 11,
        background: 'var(--bg-active)', borderRadius: 3,
        padding: '0px 5px', marginLeft: 4,
        border: '1px solid var(--border-subtle)',
        userSelect: 'none',
      }}>
        {lines} {lines === 1 ? 'line' : 'lines'}
      </span>
    );
  }
  return null;
}

// ─── JsonNode ─────────────────────────────────────────────────────────────────

interface NodeProps {
  keyName?: string | number;
  val: JsonValue;
  depth: number;
  isLast: boolean;
  defaultExpanded?: boolean;
  // Global collapse/expand signal
  globalRevision?: number;
  globalCollapsed?: boolean;
}

const INDENT = 16; // px per depth level
const AUTO_COLLAPSE_DEPTH = 2; // auto-collapse objects/arrays beyond this depth

const JsonNode = memo(function JsonNode({
  keyName, val, depth, isLast, defaultExpanded, globalRevision, globalCollapsed,
}: NodeProps) {
  const isObject = val !== null && typeof val === 'object' && !Array.isArray(val);
  const isArray = Array.isArray(val);
  const isExpandable = isObject || isArray;

  const autoExpand = defaultExpanded !== undefined
    ? defaultExpanded
    : depth < AUTO_COLLAPSE_DEPTH;

  const [open, setOpen] = useState(autoExpand);
  const [lastRevision, setLastRevision] = useState(globalRevision);

  // Respond to global collapse/expand
  if (globalRevision !== lastRevision) {
    setLastRevision(globalRevision);
    setOpen(!globalCollapsed);
  }

  const toggle = useCallback(() => setOpen((o) => !o), []);

  const comma = !isLast ? <span style={{ color: 'var(--text-muted)' }}>,</span> : null;

  const keyEl = keyName !== undefined ? (
    <span style={{ color: 'var(--json-key, #58a6ff)', marginRight: 2 }}>
      {typeof keyName === 'string' ? `"${keyName}"` : keyName}
      <span style={{ color: 'var(--text-muted)' }}>: </span>
    </span>
  ) : null;

  if (!isExpandable) {
    return (
      <div style={{ paddingLeft: depth * INDENT, lineHeight: '20px', display: 'flex', alignItems: 'baseline' }}>
        {keyEl}
        {renderPrimitive(val as string | number | boolean | null)}
        {comma}
      </div>
    );
  }

  const openBrace = isArray ? '[' : '{';
  const closeBrace = isArray ? ']' : '}';
  const children = isArray
    ? (val as JsonValue[])
    : Object.entries(val as Record<string, JsonValue>);

  return (
    <div>
      {/* Toggle row */}
      <div
        onClick={toggle}
        style={{
          paddingLeft: depth * INDENT,
          display: 'flex', alignItems: 'center',
          cursor: 'pointer',
          lineHeight: '20px',
          userSelect: 'none',
          borderRadius: 3,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'none'; }}
      >
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          color: 'var(--text-muted)', marginRight: 3, flexShrink: 0,
          width: 14,
        }}>
          {open
            ? <ChevronDown size={11} />
            : <ChevronRight size={11} />
          }
        </span>
        {keyEl}
        <span style={{ color: 'var(--text-muted)' }}>{openBrace}</span>
        {!open && <CollapseTag val={val} />}
        {open && <span style={{ color: 'var(--text-muted)' }}></span>}
        {!open && (
          <>
            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{closeBrace}</span>
            {comma}
          </>
        )}
      </div>

      {/* Children */}
      {open && (
        <div>
          {isArray
            ? (val as JsonValue[]).map((item, idx) => (
                <JsonNode
                  key={idx}
                  val={item}
                  depth={depth + 1}
                  isLast={idx === (val as JsonValue[]).length - 1}
                  globalRevision={globalRevision}
                  globalCollapsed={globalCollapsed}
                />
              ))
            : (Object.entries(val as Record<string, JsonValue>)).map(([k, v], idx, arr) => (
                <JsonNode
                  key={k}
                  keyName={k}
                  val={v}
                  depth={depth + 1}
                  isLast={idx === arr.length - 1}
                  globalRevision={globalRevision}
                  globalCollapsed={globalCollapsed}
                />
              ))
          }
          <div style={{ paddingLeft: depth * INDENT, lineHeight: '20px', color: 'var(--text-muted)' }}>
            {closeBrace}{comma}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Root component ───────────────────────────────────────────────────────────

interface Props {
  data: JsonValue;
}

export default function JsonTreeViewer({ data }: Props) {
  const [globalRevision, setGlobalRevision] = useState(0);
  const [globalCollapsed, setGlobalCollapsed] = useState(false);

  const collapseAll = () => {
    setGlobalCollapsed(true);
    setGlobalRevision((r) => r + 1);
  };
  const expandAll = () => {
    setGlobalCollapsed(false);
    setGlobalRevision((r) => r + 1);
  };

  return (
    <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono, Fira Code, monospace', lineHeight: '20px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <button
          onClick={expandAll}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          Expand All
        </button>
        <button
          onClick={collapseAll}
          style={btnStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          Collapse All
        </button>
      </div>

      {Array.isArray(data)
        ? <JsonNode val={data} depth={0} isLast globalRevision={globalRevision} globalCollapsed={globalCollapsed} />
        : <JsonNode val={data} depth={0} isLast globalRevision={globalRevision} globalCollapsed={globalCollapsed} />
      }
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'var(--bg-active)',
  border: '1px solid var(--border)',
  borderRadius: 4,
  padding: '2px 10px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: 11,
  fontFamily: 'Inter, sans-serif',
  transition: 'border-color 0.15s',
};
