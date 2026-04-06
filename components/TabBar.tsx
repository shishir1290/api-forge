'use client';
import { X, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/useAppStore';
import MethodBadge from './MethodBadge';
import type { RequestConfig } from '@/types';

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, openTab, requests } = useAppStore();

  const handleNewTab = () => {
    const request: RequestConfig = {
      id: uuidv4(),
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: { type: 'none', content: '', formData: [] },
      auth: { type: 'none' },
    };
    openTab(request);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-secondary)',
      overflowX: 'auto',
      flexShrink: 0,
      minHeight: 36,
    }}>
      {tabs.map((tab) => {
        const request = requests[tab.id];
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 10px',
              height: 36,
              cursor: 'pointer',
              background: isActive ? 'var(--bg-primary)' : 'none',
              borderRight: '1px solid var(--border)',
              borderTop: isActive ? '2px solid var(--accent-blue)' : '2px solid transparent',
              flexShrink: 0,
              maxWidth: 200,
              userSelect: 'none',
            }}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
          >
            {request && <MethodBadge method={request.method} small />}
            <span style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontSize: '12px', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              maxWidth: 110,
            }}>
              {tab.name}
              {tab.isDirty && <span style={{ color: 'var(--accent-yellow)', marginLeft: 3 }}>●</span>}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 2, display: 'flex',
                borderRadius: 3, flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-active)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      <button
        onClick={handleNewTab}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '8px 12px', display: 'flex',
          alignItems: 'center', flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
