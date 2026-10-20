import type { DailyLogEntry, Vehicle } from '../types';
import { apiJson } from './http';

export async function fetchDailyLogs(params?: {
  vehicleId?: string;
  tenderId?: string;
  driverId?: string;
  from?: string;
  to?: string;
  verified?: boolean;
}): Promise<DailyLogEntry[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.tenderId) qs.set('tenderId', params.tenderId);
  if (params?.driverId) qs.set('driverId', params.driverId);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  if (typeof params?.verified === 'boolean') qs.set('verified', String(params.verified));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; logs: DailyLogEntry[] }>(`/api/daily-logs${suffix}`);
  return data.logs;
}

export async function createDailyLogApi(
  payload: DailyLogEntry | (Omit<DailyLogEntry, 'id'> & { id?: string })
): Promise<{ log: DailyLogEntry; vehicle: Vehicle | null }> {
  const data = await apiJson<{ success: true; log: DailyLogEntry; vehicle: Vehicle | null }>(
    '/api/daily-logs',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return { log: data.log, vehicle: data.vehicle ?? null };
}

export async function updateDailyLogApi(
  id: string,
  payload: Partial<DailyLogEntry>
): Promise<{ log: DailyLogEntry; vehicle: Vehicle | null }> {
  const data = await apiJson<{ success: true; log: DailyLogEntry; vehicle: Vehicle | null }>(
    `/api/daily-logs/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return { log: data.log, vehicle: data.vehicle ?? null };
}

export async function verifyDailyLogApi(
  id: string,
  payload?: { isVerifiedByOfficer?: boolean; officerRemarks?: string }
): Promise<DailyLogEntry> {
  const data = await apiJson<{ success: true; log: DailyLogEntry }>(`/api/daily-logs/${id}/verify`, {
    method: 'PATCH',
    body: JSON.stringify(payload ?? {}),
  });
  return data.log;
}

export async function deleteDailyLogApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/daily-logs/${id}`, { method: 'DELETE' });
}

export async function bulkImportDailyLogsApi(logs: DailyLogEntry[]): Promise<DailyLogEntry[]> {
  const chunkSize = 80;
  const all: DailyLogEntry[] = [];
  for (let i = 0; i < logs.length; i += chunkSize) {
    const chunk = logs.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; logs: DailyLogEntry[] }>(
      '/api/daily-logs/bulk-import',
      { method: 'POST', body: JSON.stringify({ logs: chunk }) }
    );
    all.push(...data.logs);
  }
  return all;
}

export async function previewBillFromLogsApi(payload: {
  from: string;
  to: string;
  tenderId?: string;
  vehicleId?: string;
}) {
  const data = await apiJson<{
    success: true;
    preview: {
      from: string;
      to: string;
      logCount: number;
      verifiedCount: number;
      unverifiedCount: number;
      totals: {
        totalKm: number;
        totalHours: number;
        tollParkingCost: number;
        driverDaNightHalt: number;
      };
      byVehicle: Array<{
        vehicleId: string;
        vehicleNumber: string;
        days: number;
        totalKm: number;
        totalHours: number;
      }>;
      note?: string;
    };
    logs: DailyLogEntry[];
  }>('/api/daily-logs/from-range/preview-bill', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}
