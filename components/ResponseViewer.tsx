'use client';
import { useMemo, useState } from 'react';
import { Copy, Check, WrapText } from 'lucide-react';
import JsonTreeViewer from './JsonTreeViewer';

function syntaxHighlight(json: string): string {
  const escaped = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return escaped.replace(
    /(\"(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*\"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) cls = /:$/.test(match) ? 'json-key' : 'json-string';
      else if (/true|false/.test(match)) cls = 'json-boolean';
      else if (/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

type ViewMode = 'tree' | 'raw' | 'preview';

interface Props {
  content: string;
  contentType?: string;
  maxHeight?: string;
}

export default function ResponseViewer({ content, contentType, maxHeight = '100%' }: Props) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [wordWrap, setWordWrap] = useState(true);

  const isJson = useMemo(() => {
    if (contentType?.includes('json')) return true;
    try { JSON.parse(content); return true; } catch { return false; }
  }, [content, contentType]);

  const isHtml = !!(contentType?.includes('html'));

  const parsedJson = useMemo(() => {
    if (!isJson) return null;
    try { return JSON.parse(content); } catch { return null; }
  }, [content, isJson]);

  const prettyJson = useMemo(() => {
    if (!parsedJson) return content;
    try { return JSON.stringify(parsedJson, null, 2); } catch { return content; }
  }, [content, parsedJson]);

  const highlighted = useMemo(() => {
    if (!isJson) return null;
    return syntaxHighlight(prettyJson);
  }, [prettyJson, isJson]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: ViewMode; label: string }[] = [];
  if (isJson) tabs.push({ id: 'tree', label: 'JSON' });
  tabs.push({ id: 'raw', label: 'Raw' });
  if (isHtml) tabs.push({ id: 'preview', label: 'Preview' });

  const effectiveMode: ViewMode = tabs.find((t) => t.id === viewMode) ? viewMode : (isJson ? 'tree' : 'raw');

  const preStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    fontSize: '12px',
    lineHeight: 1.65,
    whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
    wordBreak: wordWrap ? 'break-all' : 'normal',
    color: 'var(--text-primary)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '5px 12px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
        flexShrink: 0,
      }}>
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setViewMode(tab.id)} style={{
            background: effectiveMode === tab.id ? 'var(--bg-active)' : 'none',
            border: effectiveMode === tab.id ? '1px solid var(--border)' : '1px solid transparent',
            borderRadius: 4, padding: '3px 10px', cursor: 'pointer',
            color: effectiveMode === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: '12px', fontFamily: 'Inter, sans-serif',
            fontWeight: effectiveMode === tab.id ? 600 : 400,
          }}>{tab.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        {effectiveMode === 'raw' && (
          <button onClick={() => setWordWrap((w) => !w)} title="Word wrap" style={{
            background: wordWrap ? 'var(--bg-active)' : 'none',
            border: '1px solid var(--border)', borderRadius: 4, padding: '3px 7px', cursor: 'pointer',
            color: wordWrap ? 'var(--accent-blue)' : 'var(--text-muted)', display: 'flex', alignItems: 'center',
          }}><WrapText size={12} /></button>
        )}
        <button onClick={handleCopy} style={{
          background: 'none', border: '1px solid var(--border)', borderRadius: 4,
          padding: '3px 8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '12px',
          display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif',
        }}>
          {copied ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', maxHeight, padding: effectiveMode === 'preview' ? 0 : '10px 14px' }}>
        {effectiveMode === 'preview' && isHtml && (
          <iframe srcDoc={content} style={{ width: '100%', height: '100%', border: 'none', background: 'white' }} title="Response Preview" />
        )}
        {effectiveMode === 'tree' && parsedJson !== null && <JsonTreeViewer data={parsedJson} />}
        {effectiveMode === 'tree' && parsedJson === null && <pre style={preStyle}>{content}</pre>}
        {effectiveMode === 'raw' && highlighted && (
          <pre style={preStyle} dangerouslySetInnerHTML={{ __html: highlighted }} />
        )}
        {effectiveMode === 'raw' && !highlighted && <pre style={preStyle}>{content}</pre>}
      </div>
    </div>
  );
}
