import type { Officer } from '../types';
import { apiJson } from './http';

export async function fetchOfficers(params?: {
  tenderId?: string;
  status?: string;
  q?: string;
}): Promise<Officer[]> {
  const qs = new URLSearchParams();
  if (params?.tenderId) qs.set('tenderId', params.tenderId);
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; officers: Officer[] }>(`/api/officers${suffix}`);
  return data.officers;
}

export async function createOfficerApi(payload: Officer | (Omit<Officer, 'id'> & { id?: string })): Promise<Officer> {
  const data = await apiJson<{ success: true; officer: Officer }>('/api/officers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.officer;
}

export async function updateOfficerApi(id: string, payload: Partial<Officer>): Promise<Officer> {
  const data = await apiJson<{ success: true; officer: Officer }>(`/api/officers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.officer;
}

export async function deleteOfficerApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/officers/${id}`, { method: 'DELETE' });
}

export async function bulkImportOfficersApi(officers: Officer[]): Promise<Officer[]> {
  const chunkSize = 80;
  const all: Officer[] = [];
  for (let i = 0; i < officers.length; i += chunkSize) {
    const chunk = officers.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; officers: Officer[] }>('/api/officers/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ officers: chunk }),
    });
    all.push(...data.officers);
  }
  return all;
}

export async function transferOfficerApi(
  id: string,
  payload: { transferDestination: string; transferDate?: string; transferOrderNumber?: string }
): Promise<Officer> {
  const data = await apiJson<{ success: true; officer: Officer }>(`/api/officers/${id}/transfer`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.officer;
}

export async function relieveOfficerApi(
  id: string,
  payload?: { relieveDate?: string; reason?: string }
): Promise<Officer> {
  const data = await apiJson<{ success: true; officer: Officer }>(`/api/officers/${id}/relieve`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
  return data.officer;
}
