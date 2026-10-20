import type { DriverKhataTransaction, DriverLeaveRecord } from '../types';
import { apiJson } from './http';

export async function fetchKhataTransactions(params?: {
  driverId?: string;
}): Promise<DriverKhataTransaction[]> {
  const qs = new URLSearchParams();
  if (params?.driverId) qs.set('driverId', params.driverId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; transactions: DriverKhataTransaction[] }>(
    `/api/khata${suffix}`
  );
  return data.transactions;
}

export async function fetchKhataSummary(): Promise<
  Array<{
    driverId: string;
    driverName: string;
    totalAdvanceGiven: number;
    totalSalaryPaid: number;
    totalTripExpenseFastag: number;
    currentAdvanceBalance: number;
    pendingFuelBudgetBalance: number;
    transactionCount: number;
  }>
> {
  const data = await apiJson<{ success: true; summaries: Array<any> }>('/api/khata/summary');
  return data.summaries;
}

export async function createKhataTransactionApi(
  payload: DriverKhataTransaction | (Omit<DriverKhataTransaction, 'id'> & { id?: string })
): Promise<DriverKhataTransaction> {
  const data = await apiJson<{ success: true; transaction: DriverKhataTransaction }>('/api/khata', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.transaction;
}

export async function updateKhataTransactionApi(
  id: string,
  payload: Partial<DriverKhataTransaction>
): Promise<DriverKhataTransaction> {
  const data = await apiJson<{ success: true; transaction: DriverKhataTransaction }>(
    `/api/khata/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.transaction;
}

export async function deleteKhataTransactionApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/khata/${id}`, { method: 'DELETE' });
}

export async function bulkImportKhataApi(
  transactions: DriverKhataTransaction[]
): Promise<DriverKhataTransaction[]> {
  const data = await apiJson<{ success: true; transactions: DriverKhataTransaction[] }>(
    '/api/khata/bulk-import',
    { method: 'POST', body: JSON.stringify({ transactions }) }
  );
  return data.transactions;
}

export async function fetchDriverLeaves(params?: {
  driverId?: string;
}): Promise<DriverLeaveRecord[]> {
  const qs = new URLSearchParams();
  if (params?.driverId) qs.set('driverId', params.driverId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; leaves: DriverLeaveRecord[] }>(
    `/api/driver-leaves${suffix}`
  );
  return data.leaves;
}

export async function createDriverLeaveApi(
  payload: DriverLeaveRecord | (Omit<DriverLeaveRecord, 'id'> & { id?: string })
): Promise<DriverLeaveRecord> {
  const data = await apiJson<{ success: true; leave: DriverLeaveRecord }>('/api/driver-leaves', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.leave;
}

export async function updateDriverLeaveApi(
  id: string,
  payload: Partial<DriverLeaveRecord>
): Promise<DriverLeaveRecord> {
  const data = await apiJson<{ success: true; leave: DriverLeaveRecord }>(
    `/api/driver-leaves/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.leave;
}

export async function deleteDriverLeaveApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/driver-leaves/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkImportDriverLeavesApi(
  leaves: DriverLeaveRecord[]
): Promise<DriverLeaveRecord[]> {
  const data = await apiJson<{ success: true; leaves: DriverLeaveRecord[] }>(
    '/api/driver-leaves/bulk-import',
    { method: 'POST', body: JSON.stringify({ leaves }) }
  );
  return data.leaves;
}
