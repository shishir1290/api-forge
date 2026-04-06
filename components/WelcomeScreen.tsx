'use client';
import { useState } from 'react';
import { Plus, Zap, Shield, Globe, Terminal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/store/useAppStore';
import CurlImportModal from './CurlImportModal';
import type { RequestConfig } from '@/types';

const EXAMPLE_REQUESTS: Array<{ name: string; method: RequestConfig['method']; url: string }> = [
  { name: 'JSONPlaceholder Posts', method: 'GET', url: 'https://jsonplaceholder.typicode.com/posts' },
  { name: 'JSONPlaceholder Users', method: 'GET', url: 'https://jsonplaceholder.typicode.com/users' },
  { name: 'Create Post', method: 'POST', url: 'https://jsonplaceholder.typicode.com/posts' },
  { name: 'GitHub API', method: 'GET', url: 'https://api.github.com/repos/vercel/next.js' },
];

export default function WelcomeScreen() {
  const { openTab } = useAppStore();
  const [showCurlModal, setShowCurlModal] = useState(false);

  const createNew = () => {
    const req: RequestConfig = {
      id: uuidv4(), name: 'New Request', method: 'GET', url: '',
      headers: [], params: [], body: { type: 'none', content: '', formData: [] }, auth: { type: 'none' },
    };
    openTab(req);
  };

  const openExample = (ex: typeof EXAMPLE_REQUESTS[0]) => {
    const req: RequestConfig = {
      id: uuidv4(), name: ex.name, method: ex.method, url: ex.url,
      headers: [], params: [], body: { type: 'none', content: '', formData: [] }, auth: { type: 'none' },
    };
    openTab(req);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', padding: 40, background: 'var(--bg-primary)',
    }}>
      {showCurlModal && (
        <CurlImportModal
          onImport={(req) => { openTab(req); }}
          onClose={() => setShowCurlModal(false)}
        />
      )}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #58a6ff, #bc8cff)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28, fontWeight: 800, color: 'white',
        }}>A</div>

        <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Welcome to APIForge
        </h1>
        <p style={{ margin: '0 0 32px', color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
          A powerful, free API client for teams. Build, test, and document your APIs.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '0 auto 40px' }}>
          <button
            onClick={createNew}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--accent-blue)', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', color: 'white',
              fontSize: '14px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Plus size={16} /> New Request
          </button>
          <button
            onClick={() => setShowCurlModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)', borderRadius: 8,
              padding: '10px 20px', cursor: 'pointer', color: 'var(--text-secondary)',
              fontSize: '14px', fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.color = 'var(--accent-blue)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <Terminal size={15} /> Import cURL
          </button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: 12 }}>
            QUICK START
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {EXAMPLE_REQUESTS.map((ex) => (
              <button
                key={ex.name}
                onClick={() => openExample(ex)}
                style={{
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  borderRadius: 7, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'var(--bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: ex.method === 'GET' ? 'var(--method-get)' : ex.method === 'POST' ? 'var(--method-post)' : 'var(--method-put)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 3 }}>{ex.method}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{ex.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { icon: <Zap size={16} />, title: 'Fast', desc: 'Instant response times' },
            { icon: <Shield size={16} />, title: 'Secure', desc: 'Your data stays local' },
            { icon: <Globe size={16} />, title: 'Free', desc: 'Open & free forever' },
          ].map((f) => (
            <div key={f.title} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--accent-blue)', marginBottom: 6 }}>{f.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{f.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
