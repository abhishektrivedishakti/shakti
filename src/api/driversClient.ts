import type { DocumentAttachment, Driver } from '../types';
import { apiJson } from './http';

export async function fetchDrivers(params?: { status?: string; q?: string }): Promise<Driver[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; drivers: Driver[] }>(`/api/drivers${suffix}`);
  return data.drivers;
}

export async function createDriverApi(payload: Driver | (Omit<Driver, 'id'> & { id?: string })): Promise<Driver> {
  const data = await apiJson<{ success: true; driver: Driver }>('/api/drivers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.driver;
}

export async function updateDriverApi(id: string, payload: Partial<Driver>): Promise<Driver> {
  const data = await apiJson<{ success: true; driver: Driver }>(`/api/drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.driver;
}

export async function deleteDriverApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/drivers/${id}`, { method: 'DELETE' });
}

export async function bulkImportDriversApi(drivers: Driver[]): Promise<Driver[]> {
  // Chunk large seed payloads
  const chunkSize = 80;
  const all: Driver[] = [];
  for (let i = 0; i < drivers.length; i += chunkSize) {
    const chunk = drivers.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; drivers: Driver[] }>('/api/drivers/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ drivers: chunk }),
    });
    all.push(...data.drivers);
  }
  return all;
}

export async function addDriverDocumentApi(
  id: string,
  document: DocumentAttachment
): Promise<DocumentAttachment> {
  const data = await apiJson<{ success: true; document: DocumentAttachment }>(
    `/api/drivers/${id}/documents`,
    { method: 'POST', body: JSON.stringify({ document }) }
  );
  return data.document;
}

export async function enrollDriverStatutoryApi(
  id: string,
  payload: Partial<Driver>
): Promise<Driver> {
  const data = await apiJson<{ success: true; driver: Driver }>(`/api/drivers/${id}/enroll-statutory`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.driver;
}

export async function fetchDriverBalance(id: string): Promise<{ balance: number; note?: string }> {
  const data = await apiJson<{ success: true; balance: number; note?: string }>(
    `/api/drivers/${id}/balance`
  );
  return { balance: data.balance, note: data.note };
}
