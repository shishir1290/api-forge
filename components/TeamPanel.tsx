'use client';
import { useState } from 'react';
import {
  Users, UserPlus, Crown, Shield, Edit3, Eye,
  Trash2, Mail, X, Check, ChevronDown, Settings,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import type { TeamRole } from '@/types';

const ROLE_CONFIG: Record<TeamRole, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  owner:  { label: 'Owner',  icon: <Crown size={11} />,  color: '#f0883e', desc: 'Full control' },
  admin:  { label: 'Admin',  icon: <Shield size={11} />, color: '#bc8cff', desc: 'Manage members & collections' },
  editor: { label: 'Editor', icon: <Edit3 size={11} />,  color: '#58a6ff', desc: 'Edit requests & collections' },
  viewer: { label: 'Viewer', icon: <Eye size={11} />,    color: '#3fb950', desc: 'Read-only access' },
};

const ROLES: TeamRole[] = ['owner', 'admin', 'editor', 'viewer'];

function Avatar({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color + '22', border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.34, fontWeight: 700, color, flexShrink: 0,
      fontFamily: 'Inter, sans-serif',
    }}>
      {initials}
    </div>
  );
}

function RoleBadge({ role }: { role: TeamRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
      background: cfg.color + '18', color: cfg.color,
      border: `1px solid ${cfg.color}35`,
      fontFamily: 'Inter, sans-serif',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function RoleDropdown({
  current, memberId, isOwner,
}: { current: TeamRole; memberId: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const { updateMemberRole } = useAppStore();

  if (isOwner) return <RoleBadge role={current} />;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: 'none', border: '1px solid var(--border)',
          borderRadius: 10, padding: '2px 8px', cursor: 'pointer',
          fontSize: 10, fontWeight: 600, color: ROLE_CONFIG[current].color,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {ROLE_CONFIG[current].icon}
        {ROLE_CONFIG[current].label}
        <ChevronDown size={9} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
          <div style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 51,
            background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
            borderRadius: 8, padding: 4, minWidth: 170,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {ROLES.filter((r) => r !== 'owner').map((role) => (
              <button
                key={role}
                onClick={() => { updateMemberRole(memberId, role); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: current === role ? 'var(--bg-active)' : 'none',
                  border: 'none', cursor: 'pointer', padding: '7px 10px', borderRadius: 5,
                  fontFamily: 'Inter, sans-serif', textAlign: 'left',
                }}
                onMouseEnter={(e) => { if (current !== role) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { if (current !== role) e.currentTarget.style.background = 'none'; }}
              >
                <span style={{ color: ROLE_CONFIG[role].color }}>{ROLE_CONFIG[role].icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ROLE_CONFIG[role].label}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ROLE_CONFIG[role].desc}</div>
                </div>
                {current === role && <Check size={12} style={{ marginLeft: 'auto', color: 'var(--accent-green)' }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>('editor');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { inviteMember, workspace } = useAppStore();

  const validate = () => {
    if (!name.trim()) return 'Name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (workspace.members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
      return 'This email is already a member.';
    }
    return '';
  };

  const handleInvite = () => {
    const err = validate();
    if (err) { setError(err); return; }
    inviteMember(name.trim(), email.trim().toLowerCase(), role);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setName(''); setEmail(''); setError(''); }, 1500);
  };

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '8px 12px', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, background: 'var(--bg-secondary)',
        border: '1px solid var(--border)', borderRadius: 12,
        width: 440, maxWidth: '95vw',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#58a6ff22', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <UserPlus size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Invite Team Member</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>They will be added as {ROLE_CONFIG[role].label}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex' }}>
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.05em' }}>FULL NAME *</label>
              <input
                value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Alice Johnson"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.05em' }}>EMAIL ADDRESS *</label>
              <input
                type="email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="alice@company.com"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleInvite(); }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, letterSpacing: '0.05em' }}>ROLE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(ROLES.filter((r) => r !== 'owner') as TeamRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      background: role === r ? ROLE_CONFIG[r].color + '15' : 'var(--bg-tertiary)',
                      border: `1px solid ${role === r ? ROLE_CONFIG[r].color + '60' : 'var(--border)'}`,
                      borderRadius: 7, padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ color: ROLE_CONFIG[r].color }}>{ROLE_CONFIG[r].icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: role === r ? ROLE_CONFIG[r].color : 'var(--text-primary)' }}>
                        {ROLE_CONFIG[r].label}
                      </span>
                      {role === r && <Check size={11} style={{ marginLeft: 'auto', color: ROLE_CONFIG[r].color }} />}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{ROLE_CONFIG[r].desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 12, padding: '8px 12px',
              background: '#ff626215', border: '1px solid #ff626230',
              borderRadius: 6, fontSize: 12, color: 'var(--accent-red)',
            }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <button onClick={onClose} style={{
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 13,
          }}>Cancel</button>
          <button
            onClick={handleInvite}
            style={{
              background: success ? 'var(--accent-green)' : 'var(--accent-blue)',
              border: 'none', borderRadius: 6, padding: '7px 20px',
              cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.2s',
            }}
          >
            {success ? <><Check size={13} /> Invited!</> : <><Mail size={13} /> Send Invite</>}
          </button>
        </div>
      </div>
    </>
  );
}

export default function TeamPanel() {
  const { workspace, removeMember, updateWorkspace } = useAppStore();
  const [showInvite, setShowInvite] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [wkName, setWkName] = useState(workspace.name);
  const [search, setSearch] = useState('');

  const filtered = workspace.members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = workspace.members.filter((m) => m.status === 'active').length;
  const pendingCount = workspace.members.filter((m) => m.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)', fontFamily: 'Inter, sans-serif' }}>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#58a6ff,#bc8cff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>🏢</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                value={wkName}
                autoFocus
                onChange={(e) => setWkName(e.target.value)}
                onBlur={() => { updateWorkspace({ name: wkName }); setEditingName(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { updateWorkspace({ name: wkName }); setEditingName(false); } if (e.key === 'Escape') { setWkName(workspace.name); setEditingName(false); } }}
                style={{
                  background: 'var(--bg-active)', border: '1px solid var(--accent-blue)',
                  borderRadius: 4, padding: '2px 8px', color: 'var(--text-primary)',
                  fontSize: 15, fontWeight: 700, outline: 'none', width: '100%', fontFamily: 'Inter, sans-serif',
                }}
              />
            ) : (
              <div
                onClick={() => setEditingName(true)}
                style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                title="Click to rename"
              >
                {workspace.name}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {activeCount} active · {pendingCount} pending
            </div>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-blue)', border: 'none', borderRadius: 6,
              padding: '7px 14px', cursor: 'pointer', color: 'white',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}
          >
            <UserPlus size={13} /> Invite
          </button>
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members…"
          style={{
            width: '100%', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)', borderRadius: 6,
            padding: '6px 10px', color: 'var(--text-primary)',
            fontSize: 12, outline: 'none', fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent-blue)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
        />
      </div>

      {/* Role legend */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
        {ROLES.map((r) => (
          <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)' }}>
            <span style={{ color: ROLE_CONFIG[r].color }}>{ROLE_CONFIG[r].icon}</span>
            <span style={{ color: ROLE_CONFIG[r].color, fontWeight: 600 }}>{ROLE_CONFIG[r].label}</span>
            — {ROLE_CONFIG[r].desc}
          </span>
        ))}
      </div>

      {/* Members list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No members found
          </div>
        )}
        {filtered.map((member) => (
          <div
            key={member.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'none'; }}
          >
            <Avatar name={member.name} color={member.avatar} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {member.name}
                </span>
                {member.status === 'pending' && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                    background: '#f0883e18', color: '#f0883e', border: '1px solid #f0883e30',
                    letterSpacing: '0.04em',
                  }}>PENDING</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {member.email}
              </div>
            </div>
            <RoleDropdown current={member.role} memberId={member.id} isOwner={member.role === 'owner'} />
            {member.role !== 'owner' && (
              <button
                onClick={() => { if (window.confirm(`Remove ${member.name} from the workspace?`)) removeMember(member.id); }}
                title="Remove member"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-red)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer stats */}
      <div style={{
        padding: '10px 20px', borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)', fontSize: 11, color: 'var(--text-muted)',
        display: 'flex', gap: 16, flexShrink: 0,
      }}>
        <span>👥 {workspace.members.length} members</span>
        <span>✅ {activeCount} active</span>
        {pendingCount > 0 && <span>⏳ {pendingCount} pending</span>}
      </div>
    </div>
  );
}
