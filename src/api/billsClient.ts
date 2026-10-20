import type { BillSeriesConfig, MonthlyBill, PaymentStatus } from '../types';
import { apiJson } from './http';

export async function fetchBills(params?: {
  tenderId?: string;
  vehicleId?: string;
  monthYear?: string;
  paymentStatus?: string;
}): Promise<MonthlyBill[]> {
  const qs = new URLSearchParams();
  if (params?.tenderId) qs.set('tenderId', params.tenderId);
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.monthYear) qs.set('monthYear', params.monthYear);
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; bills: MonthlyBill[] }>(`/api/bills${suffix}`);
  return data.bills;
}

export async function createBillApi(
  payload: (MonthlyBill | (Omit<MonthlyBill, 'id'> & { id?: string })) & {
    advanceSeries?: boolean;
  }
): Promise<{ bill: MonthlyBill; series: BillSeriesConfig | null }> {
  const data = await apiJson<{
    success: true;
    bill: MonthlyBill;
    series: BillSeriesConfig | null;
  }>('/api/bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { bill: data.bill, series: data.series ?? null };
}

export async function updateBillApi(
  id: string,
  payload: Partial<MonthlyBill>
): Promise<MonthlyBill> {
  const data = await apiJson<{ success: true; bill: MonthlyBill }>(`/api/bills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.bill;
}

export async function updateBillStatusApi(
  id: string,
  payload: {
    status: PaymentStatus;
    billNumber?: string;
    paymentRemarks?: string;
    remarks?: string;
    voucherNumber?: string;
    voucher?: string;
    paymentReceivedDate?: string;
  }
): Promise<MonthlyBill> {
  const data = await apiJson<{ success: true; bill: MonthlyBill }>(
    `/api/bills/${id}/status`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return data.bill;
}

export async function markBillPaidApi(
  id: string,
  payload?: {
    paymentReceivedDate?: string;
    date?: string;
    paymentRemarks?: string;
    voucherNumber?: string;
    referenceVoucher?: string;
  }
): Promise<MonthlyBill> {
  const data = await apiJson<{ success: true; bill: MonthlyBill }>(
    `/api/bills/${id}/mark-paid`,
    { method: 'POST', body: JSON.stringify(payload || {}) }
  );
  return data.bill;
}

export async function deleteBillApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/bills/${id}`, { method: 'DELETE' });
}

export async function generateBillFromLogsApi(payload: {
  vehicleId: string;
  monthYear: string;
  billNumber?: string;
  penaltyDeductions?: number;
  penaltyRemarks?: string;
  gstPercent?: number;
  tdsPercent?: number;
  billDate?: string;
  dueDate?: string;
  advanceSeries?: boolean;
  overridePrefix?: string;
}): Promise<{ bill: MonthlyBill; series: BillSeriesConfig | null; logCount: number }> {
  const data = await apiJson<{
    success: true;
    bill: MonthlyBill;
    series: BillSeriesConfig | null;
    logCount: number;
  }>('/api/bills/generate-from-logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    bill: data.bill,
    series: data.series ?? null,
    logCount: data.logCount ?? 0,
  };
}

export async function fetchBillPrintApi(id: string): Promise<unknown> {
  const data = await apiJson<{ success: true; print: unknown }>(`/api/bills/${id}/print`);
  return data.print;
}

export async function bulkImportBillsApi(bills: MonthlyBill[]): Promise<MonthlyBill[]> {
  const chunkSize = 80;
  const all: MonthlyBill[] = [];
  for (let i = 0; i < bills.length; i += chunkSize) {
    const chunk = bills.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; bills: MonthlyBill[] }>(
      '/api/bills/bulk-import',
      { method: 'POST', body: JSON.stringify({ bills: chunk }) }
    );
    all.push(...data.bills);
  }
  return all;
}

export async function fetchBillSeriesApi(): Promise<BillSeriesConfig> {
  const data = await apiJson<{ success: true; series: BillSeriesConfig }>('/api/bill-series');
  return data.series;
}

export async function updateBillSeriesApi(
  config: BillSeriesConfig
): Promise<BillSeriesConfig> {
  const data = await apiJson<{ success: true; series: BillSeriesConfig }>('/api/bill-series', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  return data.series;
}

export async function nextBillNumberApi(payload?: {
  tenderId?: string;
  monthYear?: string;
  overridePrefix?: string;
  count?: number;
}): Promise<{ billNumber: string; billNumbers: string[]; series: BillSeriesConfig }> {
  const data = await apiJson<{
    success: true;
    billNumber: string;
    billNumbers: string[];
    series: BillSeriesConfig;
  }>('/api/bill-series/next-number', {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
  return {
    billNumber: data.billNumber,
    billNumbers: data.billNumbers,
    series: data.series,
  };
}
