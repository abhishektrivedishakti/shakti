import type { DocumentAttachment, Vehicle, VehicleOperationalStatus } from '../types';
import { apiJson } from './http';

export async function fetchVehicles(params?: {
  tenderId?: string;
  status?: string;
  ownership?: string;
  q?: string;
}): Promise<Vehicle[]> {
  const qs = new URLSearchParams();
  if (params?.tenderId) qs.set('tenderId', params.tenderId);
  if (params?.status) qs.set('status', params.status);
  if (params?.ownership) qs.set('ownership', params.ownership);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; vehicles: Vehicle[] }>(`/api/vehicles${suffix}`);
  return data.vehicles;
}

export async function createVehicleApi(
  payload: Vehicle | (Omit<Vehicle, 'id'> & { id?: string })
): Promise<Vehicle> {
  const data = await apiJson<{ success: true; vehicle: Vehicle }>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.vehicle;
}

export async function updateVehicleApi(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
  const data = await apiJson<{ success: true; vehicle: Vehicle }>(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.vehicle;
}

export async function deleteVehicleApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/vehicles/${id}`, { method: 'DELETE' });
}

export async function bulkImportVehiclesApi(vehicles: Vehicle[]): Promise<Vehicle[]> {
  const chunkSize = 50;
  const all: Vehicle[] = [];
  for (let i = 0; i < vehicles.length; i += chunkSize) {
    const chunk = vehicles.slice(i, i + chunkSize);
    const data = await apiJson<{ success: true; vehicles: Vehicle[] }>('/api/vehicles/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ vehicles: chunk }),
    });
    all.push(...data.vehicles);
  }
  return all;
}

export async function fetchVehicleDocAlerts(withinDays = 45) {
  const data = await apiJson<{
    success: true;
    items: Array<{
      vehicleId: string;
      vehicleNumber: string;
      makeModel: string;
      docType: string;
      expiryDate: string;
      daysLeft: number;
      severity: string;
    }>;
  }>(`/api/vehicles/doc-alerts?withinDays=${withinDays}`);
  return data.items;
}

export async function reactivateVehicleApi(id: string, payload?: Partial<Vehicle>): Promise<Vehicle> {
  const data = await apiJson<{ success: true; vehicle: Vehicle }>(`/api/vehicles/${id}/reactivate`, {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
  });
  return data.vehicle;
}

export async function patchVehicleOdometerApi(id: string, currentOdometer: number): Promise<Vehicle> {
  const data = await apiJson<{ success: true; vehicle: Vehicle }>(`/api/vehicles/${id}/odometer`, {
    method: 'PATCH',
    body: JSON.stringify({ currentOdometer }),
  });
  return data.vehicle;
}

export async function patchVehicleStatusApi(
  id: string,
  status: VehicleOperationalStatus,
  extra?: { idleReason?: string; idleSinceDate?: string }
): Promise<Vehicle> {
  const data = await apiJson<{ success: true; vehicle: Vehicle }>(
    `/api/vehicles/${id}/operational-status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    }
  );
  return data.vehicle;
}

export async function addVehicleDocumentApi(
  id: string,
  document: DocumentAttachment
): Promise<DocumentAttachment> {
  const data = await apiJson<{ success: true; document: DocumentAttachment }>(
    `/api/vehicles/${id}/documents`,
    { method: 'POST', body: JSON.stringify({ document }) }
  );
  return data.document;
}
