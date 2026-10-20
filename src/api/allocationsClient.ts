import type {
  Driver,
  DriverAllocationHistory,
  Officer,
  OfficerAllocationHistory,
  OfficerTransferReason,
  ReplacementReason,
  Vehicle,
  VehicleAllocationHistory,
  VehicleReplacementReason,
} from '../types';
import { apiJson } from './http';

export async function fetchDriverAllocations(params?: {
  vehicleId?: string;
  driverId?: string;
}): Promise<DriverAllocationHistory[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.driverId) qs.set('driverId', params.driverId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; history: DriverAllocationHistory[] }>(
    `/api/allocations/drivers${suffix}`
  );
  return data.history;
}

export async function fetchVehicleAllocations(params?: {
  vehicleId?: string;
  tenderId?: string;
}): Promise<VehicleAllocationHistory[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.tenderId) qs.set('tenderId', params.tenderId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; history: VehicleAllocationHistory[] }>(
    `/api/allocations/vehicles${suffix}`
  );
  return data.history;
}

export async function fetchOfficerAllocations(params?: {
  vehicleId?: string;
  officerId?: string;
}): Promise<OfficerAllocationHistory[]> {
  const qs = new URLSearchParams();
  if (params?.vehicleId) qs.set('vehicleId', params.vehicleId);
  if (params?.officerId) qs.set('officerId', params.officerId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; history: OfficerAllocationHistory[] }>(
    `/api/allocations/officers${suffix}`
  );
  return data.history;
}

export async function bulkImportAllocationsApi(payload: {
  drivers?: DriverAllocationHistory[];
  vehicles?: VehicleAllocationHistory[];
  officers?: OfficerAllocationHistory[];
}): Promise<{
  drivers: DriverAllocationHistory[];
  vehicles: VehicleAllocationHistory[];
  officers: OfficerAllocationHistory[];
}> {
  const data = await apiJson<{
    success: true;
    drivers: DriverAllocationHistory[];
    vehicles: VehicleAllocationHistory[];
    officers: OfficerAllocationHistory[];
  }>('/api/allocations/bulk-import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    drivers: data.drivers,
    vehicles: data.vehicles,
    officers: data.officers,
  };
}

export async function replaceDriverApi(payload: {
  vehicleId: string;
  newDriverId: string;
  reason: ReplacementReason;
  effectiveDate: string;
  notes?: string;
}): Promise<{
  allocation: DriverAllocationHistory;
  vehicle: Vehicle;
  drivers: Driver[];
  officer: Officer | null;
}> {
  const data = await apiJson<{
    success: true;
    allocation: DriverAllocationHistory;
    vehicle: Vehicle;
    drivers: Driver[];
    officer: Officer | null;
  }>('/api/allocations/replace-driver', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function replaceVehicleApi(payload: {
  tenderId?: string;
  oldVehicleId: string;
  newVehicle: Record<string, unknown>;
  reason: VehicleReplacementReason;
  effectiveDate: string;
  notes?: string;
  transferDriverAndOfficer?: boolean;
}): Promise<{
  allocation: VehicleAllocationHistory;
  oldVehicle: Vehicle;
  vehicle: Vehicle;
  officer: Officer | null;
  driver: Driver | null;
}> {
  const data = await apiJson<{
    success: true;
    allocation: VehicleAllocationHistory;
    oldVehicle: Vehicle;
    vehicle: Vehicle;
    officer: Officer | null;
    driver: Driver | null;
  }>('/api/allocations/replace-vehicle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function transferOfficerApi(payload: {
  vehicleId: string;
  action: 'halt_car_post_vacant' | 'reassign_new_officer' | 'surrender_vehicle' | 'move_to_pool';
  effectiveDate: string;
  reason: OfficerTransferReason;
  transferOrderNumber?: string;
  notes?: string;
  newOfficer?: {
    id?: string;
    name: string;
    designation: string;
    department?: string;
    mobile: string;
    reportingTime?: string;
  };
  driverAction?: 'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave';
}): Promise<{
  allocation: OfficerAllocationHistory | null;
  vehicle: Vehicle;
  oldOfficer: Officer | null;
  officer: Officer | null;
  driver: Driver | null;
}> {
  const data = await apiJson<{
    success: true;
    allocation: OfficerAllocationHistory | null;
    vehicle: Vehicle;
    oldOfficer: Officer | null;
    officer: Officer | null;
    driver: Driver | null;
  }>('/api/allocations/transfer-officer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function relieveOfficerAllocationApi(payload: {
  vehicleId: string;
  effectiveDate?: string;
  reason?: OfficerTransferReason;
  transferOrderNumber?: string;
  notes?: string;
  driverAction?: 'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave';
}): Promise<{
  allocation: OfficerAllocationHistory | null;
  vehicle: Vehicle;
  oldOfficer: Officer | null;
  officer: Officer | null;
  driver: Driver | null;
}> {
  const data = await apiJson<{
    success: true;
    allocation: OfficerAllocationHistory | null;
    vehicle: Vehicle;
    oldOfficer: Officer | null;
    officer: Officer | null;
    driver: Driver | null;
  }>('/api/allocations/relieve-officer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export async function reactivateVehicleAllocationApi(payload: {
  vehicleId: string;
  effectiveDate: string;
  notes?: string;
  officerId?: string;
  newOfficer?: { name: string; designation: string; mobile: string; department?: string };
}): Promise<{
  allocation: OfficerAllocationHistory;
  vehicle: Vehicle;
  officer: Officer;
}> {
  const data = await apiJson<{
    success: true;
    allocation: OfficerAllocationHistory;
    vehicle: Vehicle;
    officer: Officer;
  }>('/api/allocations/reactivate-vehicle', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}
