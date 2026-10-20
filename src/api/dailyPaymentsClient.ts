import type {
  DailyPaymentEntry,
  DriverKhataTransaction,
  FuelRecord,
  MaintenanceRecord,
  VendorSettlement,
} from '../types';
import { apiJson } from './http';

export type DailyPaymentRouted = {
  khata?: DriverKhataTransaction;
  fuelRecord?: FuelRecord;
  maintenance?: MaintenanceRecord;
  settlement?: VendorSettlement;
};

export async function fetchDailyPayments(params?: {
  category?: string;
  driverId?: string;
  from?: string;
  to?: string;
}): Promise<DailyPaymentEntry[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.driverId) qs.set('driverId', params.driverId);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; payments: DailyPaymentEntry[] }>(
    `/api/daily-payments${suffix}`
  );
  return data.payments;
}

export async function createDailyPaymentApi(
  payload: (DailyPaymentEntry | (Omit<DailyPaymentEntry, 'id'> & { id?: string })) & {
    skipRouting?: boolean;
  }
): Promise<{ payment: DailyPaymentEntry; routed: DailyPaymentRouted }> {
  const data = await apiJson<{
    success: true;
    payment: DailyPaymentEntry;
    routed: DailyPaymentRouted;
  }>('/api/daily-payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { payment: data.payment, routed: data.routed || {} };
}

export async function createDailyPaymentsBatchApi(
  payments: DailyPaymentEntry[]
): Promise<{ payments: DailyPaymentEntry[]; routed: DailyPaymentRouted[] }> {
  const data = await apiJson<{
    success: true;
    payments: DailyPaymentEntry[];
    routed: DailyPaymentRouted[];
  }>('/api/daily-payments/batch', {
    method: 'POST',
    body: JSON.stringify({ payments }),
  });
  return { payments: data.payments, routed: data.routed || [] };
}

export async function updateDailyPaymentApi(
  id: string,
  payload: Partial<DailyPaymentEntry>
): Promise<DailyPaymentEntry> {
  const data = await apiJson<{ success: true; payment: DailyPaymentEntry }>(
    `/api/daily-payments/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.payment;
}

export async function deleteDailyPaymentApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/daily-payments/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkImportDailyPaymentsApi(
  payments: DailyPaymentEntry[]
): Promise<DailyPaymentEntry[]> {
  const data = await apiJson<{ success: true; payments: DailyPaymentEntry[] }>(
    '/api/daily-payments/bulk-import',
    { method: 'POST', body: JSON.stringify({ payments }) }
  );
  return data.payments;
}

export async function fetchDailyPaymentsSummary(params?: {
  from?: string;
  to?: string;
}): Promise<{
  total: number;
  count: number;
  byDate: Array<{ date: string; amount: number }>;
  byCategory: Array<{ category: string; amount: number }>;
}> {
  const qs = new URLSearchParams();
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{
    success: true;
    summary: {
      total: number;
      count: number;
      byDate: Array<{ date: string; amount: number }>;
      byCategory: Array<{ category: string; amount: number }>;
    };
  }>(`/api/daily-payments/summary${suffix}`);
  return data.summary;
}
