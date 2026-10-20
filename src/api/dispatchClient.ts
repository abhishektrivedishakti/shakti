import type {
  BookingRecord,
  BookerDetails,
  ClientDetails,
  CustomTariffPackage,
  DispatcherProfile,
  DutyStatus,
  DutyTariff,
  PassengerDetails,
  SavedDirectory,
} from '../types';
import { apiJson } from './http';

export async function fetchDispatchProfile(): Promise<DispatcherProfile> {
  const data = await apiJson<{ success: true; profile: DispatcherProfile }>(
    '/api/dispatch/profile'
  );
  return data.profile;
}

export async function updateDispatchProfileApi(
  profile: DispatcherProfile
): Promise<DispatcherProfile> {
  const data = await apiJson<{ success: true; profile: DispatcherProfile }>(
    '/api/dispatch/profile',
    { method: 'PUT', body: JSON.stringify(profile) }
  );
  return data.profile;
}

export async function fetchDispatchDirectory(): Promise<SavedDirectory> {
  const data = await apiJson<{ success: true; directory: SavedDirectory }>(
    '/api/dispatch/directory'
  );
  return data.directory;
}

export async function updateDispatchDirectoryApi(
  directory: SavedDirectory
): Promise<SavedDirectory> {
  const data = await apiJson<{ success: true; directory: SavedDirectory }>(
    '/api/dispatch/directory',
    { method: 'PUT', body: JSON.stringify(directory) }
  );
  return data.directory;
}

export async function createDirectoryClientApi(
  client: ClientDetails
): Promise<{ client: ClientDetails; directory: SavedDirectory }> {
  const data = await apiJson<{
    success: true;
    client: ClientDetails;
    directory: SavedDirectory;
  }>('/api/dispatch/directory/clients', {
    method: 'POST',
    body: JSON.stringify(client),
  });
  return { client: data.client, directory: data.directory };
}

export async function deleteDirectoryClientApi(id: string): Promise<SavedDirectory> {
  const data = await apiJson<{ success: true; directory: SavedDirectory }>(
    `/api/dispatch/directory/clients/${id}`,
    { method: 'DELETE' }
  );
  return data.directory;
}

export async function createDirectoryBookerApi(
  booker: BookerDetails
): Promise<{ booker: BookerDetails; directory: SavedDirectory }> {
  const data = await apiJson<{
    success: true;
    booker: BookerDetails;
    directory: SavedDirectory;
  }>('/api/dispatch/directory/bookers', {
    method: 'POST',
    body: JSON.stringify(booker),
  });
  return { booker: data.booker, directory: data.directory };
}

export async function deleteDirectoryBookerApi(id: string): Promise<SavedDirectory> {
  const data = await apiJson<{ success: true; directory: SavedDirectory }>(
    `/api/dispatch/directory/bookers/${id}`,
    { method: 'DELETE' }
  );
  return data.directory;
}

export async function createDirectoryPassengerApi(
  passenger: PassengerDetails
): Promise<{ passenger: PassengerDetails; directory: SavedDirectory }> {
  const data = await apiJson<{
    success: true;
    passenger: PassengerDetails;
    directory: SavedDirectory;
  }>('/api/dispatch/directory/passengers', {
    method: 'POST',
    body: JSON.stringify(passenger),
  });
  return { passenger: data.passenger, directory: data.directory };
}

export async function deleteDirectoryPassengerApi(id: string): Promise<SavedDirectory> {
  const data = await apiJson<{ success: true; directory: SavedDirectory }>(
    `/api/dispatch/directory/passengers/${id}`,
    { method: 'DELETE' }
  );
  return data.directory;
}

export async function fetchDispatchTariffs(): Promise<CustomTariffPackage[]> {
  const data = await apiJson<{ success: true; tariffs: CustomTariffPackage[] }>(
    '/api/dispatch/tariffs'
  );
  return data.tariffs;
}

export async function createDispatchTariffApi(
  tariff: CustomTariffPackage | (Omit<CustomTariffPackage, 'id'> & { id?: string })
): Promise<CustomTariffPackage> {
  const data = await apiJson<{ success: true; tariff: CustomTariffPackage }>(
    '/api/dispatch/tariffs',
    { method: 'POST', body: JSON.stringify(tariff) }
  );
  return data.tariff;
}

export async function updateDispatchTariffApi(
  id: string,
  tariff: Partial<CustomTariffPackage>
): Promise<CustomTariffPackage> {
  const data = await apiJson<{ success: true; tariff: CustomTariffPackage }>(
    `/api/dispatch/tariffs/${id}`,
    { method: 'PUT', body: JSON.stringify(tariff) }
  );
  return data.tariff;
}

export async function deleteDispatchTariffApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/dispatch/tariffs/${id}`, { method: 'DELETE' });
}

export async function fetchDispatchBookings(params?: {
  status?: string;
  from?: string;
  to?: string;
}): Promise<BookingRecord[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.from) qs.set('from', params.from);
  if (params?.to) qs.set('to', params.to);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; bookings: BookingRecord[] }>(
    `/api/dispatch/bookings${suffix}`
  );
  return data.bookings;
}

export async function createDispatchBookingApi(
  booking: BookingRecord | (Omit<BookingRecord, 'id'> & { id?: string })
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    '/api/dispatch/bookings',
    { method: 'POST', body: JSON.stringify(booking) }
  );
  return data.booking;
}

export async function updateDispatchBookingApi(
  id: string,
  booking: Partial<BookingRecord>
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    `/api/dispatch/bookings/${id}`,
    { method: 'PUT', body: JSON.stringify(booking) }
  );
  return data.booking;
}

export async function deleteDispatchBookingApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/dispatch/bookings/${id}`, { method: 'DELETE' });
}

export async function updateDispatchBookingStatusApi(
  id: string,
  status: DutyStatus
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    `/api/dispatch/bookings/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status }) }
  );
  return data.booking;
}

export async function updateDispatchBookingTariffApi(
  id: string,
  tariff: DutyTariff
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    `/api/dispatch/bookings/${id}/tariff`,
    { method: 'PUT', body: JSON.stringify({ tariff }) }
  );
  return data.booking;
}

export async function clientSettlementApi(
  id: string,
  payload: {
    clientPaymentStatus: BookingRecord['clientPaymentStatus'];
    clientInvoiceNumber?: string;
    invoiceNo?: string;
    clientPaidAmount?: number;
  }
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    `/api/dispatch/bookings/${id}/client-settlement`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data.booking;
}

export async function driverSettlementApi(
  id: string,
  payload: {
    driverPaymentStatus: BookingRecord['driverPaymentStatus'];
    driverPaidAmount?: number;
  }
): Promise<BookingRecord> {
  const data = await apiJson<{ success: true; booking: BookingRecord }>(
    `/api/dispatch/bookings/${id}/driver-settlement`,
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return data.booking;
}

export async function fetchDispatchBookingSlip(id: string): Promise<{
  slip: {
    driverSlip: string;
    passengerSlip: string;
    bookerSlip: string;
    print: Record<string, unknown>;
  };
  booking: BookingRecord;
}> {
  const data = await apiJson<{
    success: true;
    slip: {
      driverSlip: string;
      passengerSlip: string;
      bookerSlip: string;
      print: Record<string, unknown>;
    };
    booking: BookingRecord;
  }>(`/api/dispatch/bookings/${id}/slip`);
  return { slip: data.slip, booking: data.booking };
}

export async function bulkImportDispatchBookingsApi(
  bookings: BookingRecord[]
): Promise<BookingRecord[]> {
  const data = await apiJson<{ success: true; bookings: BookingRecord[] }>(
    '/api/dispatch/bookings/bulk-import',
    { method: 'POST', body: JSON.stringify({ bookings }) }
  );
  return data.bookings;
}

export async function fetchDispatchKpi(): Promise<Record<string, unknown>> {
  const data = await apiJson<{ success: true; kpi: Record<string, unknown> }>(
    '/api/dispatch/kpi'
  );
  return data.kpi;
}

export async function fetchDispatchFinance(
  period: 'all' | 'this_month' | 'last_month' = 'all'
): Promise<Record<string, unknown>> {
  const data = await apiJson<{ success: true; finance: Record<string, unknown> }>(
    `/api/dispatch/finance?period=${period}`
  );
  return data.finance;
}

export async function fetchGpsSnapshot(): Promise<{
  snapshot: Array<Record<string, unknown>>;
  simulated: boolean;
}> {
  const data = await apiJson<{
    success: true;
    snapshot: Array<Record<string, unknown>>;
    simulated: boolean;
  }>('/api/dispatch/gps-snapshot');
  return { snapshot: data.snapshot, simulated: data.simulated };
}
