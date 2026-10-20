import { apiJson, authHeaders, fetchWithTimeout, parseJsonResponse } from './http';

export type BackupDetectedCounts = Record<string, number>;

export async function downloadServerBackup(): Promise<void> {
  const res = await fetchWithTimeout('/api/export/backup', {
    headers: authHeaders(),
  });
  const json = await parseJsonResponse<{
    success: boolean;
    data?: unknown;
    error?: string;
  }>(res);
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.error || `Backup export failed (${res.status})`);
  }

  const blob = new Blob([JSON.stringify(json.data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `shakti-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function validateServerBackup(payload: unknown): Promise<{
  message: string;
  detected: BackupDetectedCounts;
}> {
  const data = await apiJson<{
    success: true;
    message: string;
    accepted: boolean;
    restored: boolean;
    detected: BackupDetectedCounts;
  }>('/api/import/backup', {
    method: 'POST',
    body: JSON.stringify({ data: payload, confirmRestore: false }),
  });
  return { message: data.message, detected: data.detected };
}

export async function restoreServerBackup(payload: unknown): Promise<{
  message: string;
  detected: BackupDetectedCounts;
  counts?: BackupDetectedCounts;
}> {
  const data = await apiJson<{
    success: true;
    message: string;
    restored: boolean;
    detected: BackupDetectedCounts;
    counts?: BackupDetectedCounts;
  }>('/api/import/backup', {
    method: 'POST',
    body: JSON.stringify({ data: payload, confirmRestore: true }),
  });
  return {
    message: data.message,
    detected: data.detected,
    counts: data.counts,
  };
}

export async function resetOperationalDataApi(): Promise<{ message: string }> {
  const data = await apiJson<{ success: true; message: string }>(
    '/api/admin/reset-operational-data',
    {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    }
  );
  return { message: data.message };
}
