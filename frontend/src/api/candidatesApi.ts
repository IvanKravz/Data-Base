/**
 * API-клиент для модуля «Кандидаты».
 */

const BASE = '/api/candidates';

const getToken = (): string | null => localStorage.getItem('accessToken');

const authHeaders = (extra: Record<string, string> = {}): Record<string, string> => {
  const h: Record<string, string> = { ...extra };
  const t = getToken();
  if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
};

const handleError = async (response: Response, url: string, method: string): Promise<never> => {
  let message = `HTTP ${response.status}`;
  try {
    const text = await response.text();
    if (text) {
      try {
        const json = JSON.parse(text);
        message = json.detail || json.error || JSON.stringify(json);
      } catch {
        message = text;
      }
    }
  } catch { /* noop */ }

  window.dispatchEvent(new CustomEvent('apiError', {
    detail: { status: response.status, message, url, method, originalStatus: response.status },
  }));
  throw Object.assign(new Error(message), { status: response.status });
};

const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const method = init.method || 'GET';
  const response = await fetch(url, {
    ...init,
    headers: authHeaders(init.headers as Record<string, string> | undefined),
  });
  if (!response.ok) await handleError(response, url, method);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

const buildQuery = (params: Record<string, any>): string => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
};

// ===================== Типы =====================

export type CandidateStatus = 'active' | 'hired' | 'rejected' | 'archived';

export interface CandidateBrief {
  id: number;
  full_name: string;
  position?: string;
}

export interface CandidateListItem {
  number: number;
  full_name: string;
  planned_position: string;
  phone: string | null;
  curator: CandidateBrief | null;
  curator_display: string | null;
  division: { id: number; name: string } | null;
  division_display: string | null;
  custom_division_name: string | null;
  custom_curator_name: string | null;
  status: CandidateStatus;
  status_display: string;
  /**
   * Дата последней смены статуса. Используется для отображения года
   * событий «Принят» / «Отказ» / «Архив».
   * Может быть `null` у старых записей.
   */
  status_changed_at: string | null;
  /**
   * Год события «Отказ» / «Архив» — вычисляется на бэкенде из
   * `status_changed_at`. Для статусов active / hired — `null`.
   * Используется для бейджа года в колонке «Статус» и для фильтра по году.
   */
  status_year: number | null;
  progress: { done: number; total: number };
  overdue_count: number;
  created_at: string;
  updated_at: string;
}

export interface CandidateStage {
  id: number;
  stage_type: string;
  stage_type_display: string;
  phase: 'primary' | 'coordination' | 'medical' | 'checks' | 'interviews' | 'attestation';
  phase_display: string;
  order: number;
  planned_date: string | null;
  actual_date: string | null;
  status: 'pending' | 'done' | 'skipped';
  status_display: string;
  is_overdue: boolean;
  comment: string | null;
}

export interface CandidateDetail extends CandidateListItem {
  note: string | null;
  stages: CandidateStage[];
  hired_employee: number | null;
}

export interface CandidateStats {
  total: number;
  by_status: Record<string, number>;
  overdue_count: number;
}

export interface CandidateWriteData {
  full_name: string;
  planned_position: string;
  phone?: string | null;
  // Справочник:
  curator?: number | null;
  division?: number | null;
  // Режим «другое подразделение»:
  custom_division_name?: string | null;
  custom_curator_name?: string | null;
  // Общее:
  note?: string | null;
  /**
   * Статус. Значение `'hired'` через обычный write-эндпоинт запрещено —
   * оно выставляется только действием `hire`.
   */
  status?: CandidateStatus;
}

// ===================== API =====================

export const candidatesApi = {
  create: (data: CandidateWriteData): Promise<CandidateDetail> =>
    request(`${BASE}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: number | string, data: Partial<CandidateWriteData>): Promise<CandidateDetail> =>
    request(`${BASE}/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  remove: (id: number | string): Promise<void> =>
    request(`${BASE}/${id}/`, { method: 'DELETE' }),

  list: (params: Record<string, any> = {}): Promise<CandidateListItem[] | { results: CandidateListItem[] }> =>
    request(`${BASE}/${buildQuery(params)}`),

  get: (id: number | string): Promise<CandidateDetail> =>
    request(`${BASE}/${id}/`),

  stats: (params: Record<string, any> = {}): Promise<CandidateStats> =>
    request(`${BASE}/stats/${buildQuery(params)}`),

  dictionaries: (): Promise<any> =>
    request(`${BASE}/dictionaries/`),

  updateStage: (candidateId: number | string, stageId: number, data: Partial<CandidateStage>) =>
    request<CandidateStage>(`${BASE}/${candidateId}/stages/${stageId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  hire: (candidateId: number | string, data: { division?: number; category?: string }) =>
    request<any>(`${BASE}/${candidateId}/hire/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  exportFile: async (format: 'csv' | 'xlsx', params: Record<string, any> = {}): Promise<void> => {
    const qs = new URLSearchParams();
    qs.set('fmt', format);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const url = `${BASE}/export/?${qs.toString()}`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) await handleError(response, url, 'GET');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `candidates.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  },
};