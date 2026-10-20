import type { MaintenanceRecord, Vehicle } from '../types';
import { apiJson } from './http';

export async function fetchMaintenanceRecords(params?: {
  vehicleId?: string;
  serviceType?: string;
  from?: string;
  to?: string;
}): Promise<MaintenanceRecord[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.serviceType) qs.set('serviceType', params.serviceType);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; records: MaintenanceRecord[] }>(
    `/api/maintenance${suffix}`
  );
  return data.records;
}

export async function createMaintenanceApi(
  payload: MaintenanceRecord | (Omit<MaintenanceRecord, 'id'> & { id?: string })
): Promise<{ record: MaintenanceRecord; vehicle: Vehicle | null }> {
  const data = await apiJson<{
    success: true;
    record: MaintenanceRecord;
    vehicle: Vehicle | null;
  }>('/api/maintenance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { record: data.record, vehicle: data.vehicle ?? null };
}

export async function updateMaintenanceApi(
  id: string,
  payload: Partial<MaintenanceRecord>
): Promise<MaintenanceRecord> {
  const data = await apiJson<{ success: true; record: MaintenanceRecord }>(
    `/api/maintenance/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.record;
}

export async function deleteMaintenanceApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/maintenance/${id}`, { method: 'DELETE' });
}

export async function bulkImportMaintenanceApi(
  records: MaintenanceRecord[]
): Promise<MaintenanceRecord[]> {
  const chunkSize = 80;
  const all: MaintenanceRecord[] = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; records: MaintenanceRecord[] }>(
      '/api/maintenance/bulk-import',
      { method: 'POST', body: JSON.stringify({ records: chunk }) }
    );
    all.push(...data.records);
  }
  return all;
}
