import type {
  FuelPumpVendor,
  FuelRecord,
  FuelSlip,
  FuelVendorMonthlyBill,
  Vehicle,
} from '../types';
import { apiJson } from './http';

// ── Pumps ──────────────────────────────────────────────────────────

export async function fetchFuelPumps(params?: {
  status?: string;
  q?: string;
}): Promise<FuelPumpVendor[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; pumps: FuelPumpVendor[] }>(
    `/api/fuel-pumps${suffix}`
  );
  return data.pumps;
}

export async function createFuelPumpApi(
  payload: FuelPumpVendor | (Omit<FuelPumpVendor, 'id'> & { id?: string })
): Promise<FuelPumpVendor> {
  const data = await apiJson<{ success: true; pump: FuelPumpVendor }>('/api/fuel-pumps', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.pump;
}

export async function updateFuelPumpApi(
  id: string,
  payload: Partial<FuelPumpVendor>
): Promise<FuelPumpVendor> {
  const data = await apiJson<{ success: true; pump: FuelPumpVendor }>(`/api/fuel-pumps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.pump;
}

export async function deleteFuelPumpApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/fuel-pumps/${id}`, { method: 'DELETE' });
}

export async function bulkImportFuelPumpsApi(
  pumps: FuelPumpVendor[]
): Promise<FuelPumpVendor[]> {
  const chunkSize = 80;
  const all: FuelPumpVendor[] = [];
  for (let i = 0; i < pumps.length; i += chunkSize) {
    const chunk = pumps.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; pumps: FuelPumpVendor[] }>(
      '/api/fuel-pumps/bulk-import',
      { method: 'POST', body: JSON.stringify({ pumps: chunk }) }
    );
    all.push(...data.pumps);
  }
  return all;
}

export async function fetchFuelPumpLookups(): Promise<FuelPumpVendor[]> {
  const data = await apiJson<{ success: true; pumps: FuelPumpVendor[] }>(
    '/api/lookups/fuel-pumps'
  );
  return data.pumps;
}

// ── Records ────────────────────────────────────────────────────────

export async function fetchFuelRecords(params?: {
  vehicleId?: string;
  driverId?: string;
  pumpVendorId?: string;
  from?: string;
  to?: string;
}): Promise<FuelRecord[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.driverId) qs.set('driverId', params.driverId);
  if (params?.pumpVendorId) qs.set('pumpVendorId', params.pumpVendorId);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; records: FuelRecord[] }>(
    `/api/fuel-records${suffix}`
  );
  return data.records;
}

export async function createFuelRecordApi(
  payload: FuelRecord | (Omit<FuelRecord, 'id'> & { id?: string })
): Promise<{ record: FuelRecord; vehicle: Vehicle | null }> {
  const data = await apiJson<{
    success: true;
    record: FuelRecord;
    vehicle: Vehicle | null;
  }>('/api/fuel-records', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { record: data.record, vehicle: data.vehicle ?? null };
}

export async function updateFuelRecordApi(
  id: string,
  payload: Partial<FuelRecord>
): Promise<FuelRecord> {
  const data = await apiJson<{ success: true; record: FuelRecord }>(
    `/api/fuel-records/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.record;
}

export async function deleteFuelRecordApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/fuel-records/${id}`, { method: 'DELETE' });
}

export async function bulkImportFuelRecordsApi(records: FuelRecord[]): Promise<FuelRecord[]> {
  const chunkSize = 80;
  const all: FuelRecord[] = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; records: FuelRecord[] }>(
      '/api/fuel-records/bulk-import',
      { method: 'POST', body: JSON.stringify({ records: chunk }) }
    );
    all.push(...data.records);
  }
  return all;
}

// ── Slips ──────────────────────────────────────────────────────────

export async function fetchFuelSlips(params?: {
  status?: string;
  vehicleId?: string;
  pumpVendorId?: string;
  from?: string;
  to?: string;
}): Promise<FuelSlip[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.pumpVendorId) qs.set('pumpVendorId', params.pumpVendorId);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; slips: FuelSlip[] }>(`/api/fuel-slips${suffix}`);
  return data.slips;
}

export async function createFuelSlipApi(
  payload: FuelSlip | (Omit<FuelSlip, 'id'> & { id?: string })
): Promise<FuelSlip> {
  const data = await apiJson<{ success: true; slip: FuelSlip }>('/api/fuel-slips', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.slip;
}

export async function updateFuelSlipApi(
  id: string,
  payload: Partial<FuelSlip>
): Promise<FuelSlip> {
  const data = await apiJson<{ success: true; slip: FuelSlip }>(`/api/fuel-slips/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.slip;
}

export async function markFuelSlipFilledApi(
  id: string,
  payload: Partial<FuelSlip> & { createFuelRecord?: boolean } = {}
): Promise<{ slip: FuelSlip; fuelRecord: FuelRecord | null; vehicle: Vehicle | null }> {
  const data = await apiJson<{
    success: true;
    slip: FuelSlip;
    fuelRecord: FuelRecord | null;
    vehicle: Vehicle | null;
  }>(`/api/fuel-slips/${id}/mark-filled`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return {
    slip: data.slip,
    fuelRecord: data.fuelRecord ?? null,
    vehicle: data.vehicle ?? null,
  };
}

export async function cancelFuelSlipApi(id: string, notes?: string): Promise<FuelSlip> {
  const data = await apiJson<{ success: true; slip: FuelSlip }>(
    `/api/fuel-slips/${id}/cancel`,
    { method: 'PATCH', body: JSON.stringify({ notes }) }
  );
  return data.slip;
}

export async function deleteFuelSlipApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/fuel-slips/${id}`, { method: 'DELETE' });
}

export async function bulkImportFuelSlipsApi(slips: FuelSlip[]): Promise<FuelSlip[]> {
  const chunkSize = 80;
  const all: FuelSlip[] = [];
  for (let i = 0; i < slips.length; i += chunkSize) {
    const chunk = slips.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; slips: FuelSlip[] }>(
      '/api/fuel-slips/bulk-import',
      { method: 'POST', body: JSON.stringify({ slips: chunk }) }
    );
    all.push(...data.slips);
  }
  return all;
}

// ── Vendor bills ───────────────────────────────────────────────────

export async function fetchFuelVendorBills(params?: {
  pumpVendorId?: string;
  monthYear?: string;
  paymentStatus?: string;
}): Promise<FuelVendorMonthlyBill[]> {
  const qs = new URLSearchParams();
  if (params?.pumpVendorId) qs.set('pumpVendorId', params.pumpVendorId);
  if (params?.monthYear) qs.set('monthYear', params.monthYear);
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; bills: FuelVendorMonthlyBill[] }>(
    `/api/fuel-vendor-bills${suffix}`
  );
  return data.bills;
}

export async function createFuelVendorBillApi(
  payload: (FuelVendorMonthlyBill | (Omit<FuelVendorMonthlyBill, 'id'> & { id?: string })) & {
    linkedSlipIds?: string[];
  }
): Promise<{ bill: FuelVendorMonthlyBill; slips: FuelSlip[] }> {
  const data = await apiJson<{
    success: true;
    bill: FuelVendorMonthlyBill;
    slips: FuelSlip[];
  }>('/api/fuel-vendor-bills', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { bill: data.bill, slips: data.slips ?? [] };
}

export async function updateFuelVendorBillApi(
  id: string,
  payload: Partial<FuelVendorMonthlyBill> & { linkedSlipIds?: string[] }
): Promise<FuelVendorMonthlyBill> {
  const data = await apiJson<{ success: true; bill: FuelVendorMonthlyBill }>(
    `/api/fuel-vendor-bills/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.bill;
}

export async function payFuelVendorBillApi(
  id: string,
  payment: {
    amount?: number;
    paidAmount?: number;
    date?: string;
    paidDate?: string;
    mode?: string;
    paymentMode?: string;
    ref?: string;
    paymentReference?: string;
  }
): Promise<FuelVendorMonthlyBill> {
  const data = await apiJson<{ success: true; bill: FuelVendorMonthlyBill }>(
    `/api/fuel-vendor-bills/${id}/pay`,
    { method: 'POST', body: JSON.stringify(payment) }
  );
  return data.bill;
}

export async function deleteFuelVendorBillApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/fuel-vendor-bills/${id}`, { method: 'DELETE' });
}

export async function bulkImportFuelVendorBillsApi(
  bills: FuelVendorMonthlyBill[]
): Promise<FuelVendorMonthlyBill[]> {
  const chunkSize = 80;
  const all: FuelVendorMonthlyBill[] = [];
  for (let i = 0; i < bills.length; i += chunkSize) {
    const chunk = bills.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; bills: FuelVendorMonthlyBill[] }>(
      '/api/fuel-vendor-bills/bulk-import',
      { method: 'POST', body: JSON.stringify({ bills: chunk }) }
    );
    all.push(...data.bills);
  }
  return all;
}
