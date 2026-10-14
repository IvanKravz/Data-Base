import React from 'react';

interface Props {
  status: string;
  display: string;
}

const COLOR_MAP: Record<string, string> = {
  active: 'badge--blue',
  hired: 'badge--green',
  rejected: 'badge--red',
  archived: 'badge--gray',
  pending: 'badge--gray',
  done: 'badge--green',
  skipped: 'badge--yellow',
  overdue: 'badge--red',
};

export function CandidateStatusBadge({ status, display }: Props) {
  const cls = COLOR_MAP[status] ?? 'badge--gray';
  return <span className={`badge ${cls}`}>{display}</span>;
}