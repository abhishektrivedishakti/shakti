import type { StatutoryPayrollEntry } from '../types';
import { apiJson } from './http';

export async function fetchStatutoryPayroll(params?: {
  monthYear?: string;
  driverId?: string;
}): Promise<StatutoryPayrollEntry[]> {
  const qs = new URLSearchParams();
  if (params?.monthYear) qs.set('monthYear', params.monthYear);
  if (params?.driverId) qs.set('driverId', params.driverId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; entries: StatutoryPayrollEntry[] }>(
    `/api/statutory-payroll${suffix}`
  );
  return data.entries;
}

export async function createStatutoryPayrollApi(
  payload: StatutoryPayrollEntry | (Omit<StatutoryPayrollEntry, 'id'> & { id?: string })
): Promise<StatutoryPayrollEntry> {
  const data = await apiJson<{ success: true; entry: StatutoryPayrollEntry }>(
    '/api/statutory-payroll',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data.entry;
}

export async function updateStatutoryPayrollApi(
  id: string,
  payload: Partial<StatutoryPayrollEntry>
): Promise<StatutoryPayrollEntry> {
  const data = await apiJson<{ success: true; entry: StatutoryPayrollEntry }>(
    `/api/statutory-payroll/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.entry;
}

export async function deleteStatutoryPayrollApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/statutory-payroll/${id}`, {
    method: 'DELETE',
  });
}

export async function generateStatutoryMonthApi(
  monthYear: string
): Promise<StatutoryPayrollEntry[]> {
  const data = await apiJson<{ success: true; entries: StatutoryPayrollEntry[] }>(
    '/api/statutory-payroll/generate-month',
    { method: 'POST', body: JSON.stringify({ monthYear }) }
  );
  return data.entries;
}

export async function fetchStatutoryComplianceSummary(monthYear?: string): Promise<{
  entryCount: number;
  driverCount: number;
  totalGrossEarned: number;
  totalEpfEmployee: number;
  totalEsicEmployee: number;
  totalEpfEmployer: number;
  totalEsicEmployer: number;
  totalBonus: number;
  totalNetInHand: number;
  totalCtcOutflow: number;
  draftCount: number;
  processedCount: number;
  depositedCount: number;
}> {
  const qs = monthYear ? `?monthYear=${encodeURIComponent(monthYear)}` : '';
  const data = await apiJson<{ success: true; summary: any }>(
    `/api/statutory-payroll/compliance-summary${qs}`
  );
  return data.summary;
}

export async function bulkImportStatutoryPayrollApi(
  entries: StatutoryPayrollEntry[]
): Promise<StatutoryPayrollEntry[]> {
  const data = await apiJson<{ success: true; entries: StatutoryPayrollEntry[] }>(
    '/api/statutory-payroll/bulk-import',
    { method: 'POST', body: JSON.stringify({ entries }) }
  );
  return data.entries;
}
