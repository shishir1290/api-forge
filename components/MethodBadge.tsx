'use client';
import type { HttpMethod } from '@/types';

const METHOD_LABELS: Record<HttpMethod, string> = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DEL',
  HEAD: 'HEAD',
  OPTIONS: 'OPT',
};

export default function MethodBadge({ method, small }: { method: HttpMethod; small?: boolean }) {
  const cls = `method-badge-${method.toLowerCase()}`;
  return (
    <span
      className={`${cls} font-bold rounded px-1.5 py-0.5 mono`}
      style={{ fontSize: small ? '10px' : '11px', letterSpacing: '0.02em' }}
    >
      {METHOD_LABELS[method] || method}
    </span>
  );
}
