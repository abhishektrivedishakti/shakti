import type { Vendor, VendorSettlement } from '../types';
import { apiJson } from './http';

export async function fetchVendors(params?: {
  status?: string;
  vendorType?: string;
}): Promise<Vendor[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.vendorType) qs.set('vendorType', params.vendorType);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; vendors: Vendor[] }>(`/api/vendors${suffix}`);
  return data.vendors;
}

export async function createVendorApi(
  payload: Vendor | (Omit<Vendor, 'id'> & { id?: string })
): Promise<Vendor> {
  const data = await apiJson<{ success: true; vendor: Vendor }>('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.vendor;
}

export async function updateVendorApi(id: string, payload: Partial<Vendor>): Promise<Vendor> {
  const data = await apiJson<{ success: true; vendor: Vendor }>(`/api/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.vendor;
}

export async function deleteVendorApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/vendors/${id}`, { method: 'DELETE' });
}

export async function bulkImportVendorsApi(vendors: Vendor[]): Promise<Vendor[]> {
  const data = await apiJson<{ success: true; vendors: Vendor[] }>('/api/vendors/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ vendors }),
  });
  return data.vendors;
}

export async function fetchVendorSettlements(params?: {
  vendorId?: string;
  monthYear?: string;
  paymentStatus?: string;
}): Promise<VendorSettlement[]> {
  const qs = new URLSearchParams();
  if (params?.vendorId) qs.set('vendorId', params.vendorId);
  if (params?.monthYear) qs.set('monthYear', params.monthYear);
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; settlements: VendorSettlement[] }>(
    `/api/vendor-settlements${suffix}`
  );
  return data.settlements;
}

export async function createVendorSettlementApi(
  payload: VendorSettlement | (Omit<VendorSettlement, 'id'> & { id?: string })
): Promise<VendorSettlement> {
  const data = await apiJson<{ success: true; settlement: VendorSettlement }>(
    '/api/vendor-settlements',
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data.settlement;
}

export async function updateVendorSettlementApi(
  id: string,
  payload: Partial<VendorSettlement>
): Promise<VendorSettlement> {
  const data = await apiJson<{ success: true; settlement: VendorSettlement }>(
    `/api/vendor-settlements/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.settlement;
}

export async function deleteVendorSettlementApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/vendor-settlements/${id}`, {
    method: 'DELETE',
  });
}

export async function payVendorSettlementApi(
  id: string,
  payload?: { paymentRef?: string; paymentDate?: string; referenceNumber?: string }
): Promise<VendorSettlement> {
  const data = await apiJson<{ success: true; settlement: VendorSettlement }>(
    `/api/vendor-settlements/${id}/pay`,
    { method: 'POST', body: JSON.stringify(payload || {}) }
  );
  return data.settlement;
}

export async function bulkImportVendorSettlementsApi(
  settlements: VendorSettlement[]
): Promise<VendorSettlement[]> {
  const data = await apiJson<{ success: true; settlements: VendorSettlement[] }>(
    '/api/vendor-settlements/bulk-import',
    { method: 'POST', body: JSON.stringify({ settlements }) }
  );
  return data.settlements;
}
