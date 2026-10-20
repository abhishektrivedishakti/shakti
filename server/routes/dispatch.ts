import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import {
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/apiResponse';
import { canEditModule, canViewModule } from '../lib/moduleAccess';
import {
  bookingDataFromBody,
  buildSlipPayload,
  computeDispatchFinance,
  computeDispatchKpi,
  DEFAULT_DISPATCH_PROFILE,
  directoryDataFromBody,
  EMPTY_DIRECTORY,
  mapDbBookingToApi,
  mapDbDirectoryToApi,
  mapDbProfileToApi,
  mapDbTariffToApi,
  profileDataFromBody,
  tariffPackageDataFromBody,
} from '../lib/dispatchMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { asJsonInput } from '../lib/jsonInput';
import { num, optStr, str } from '../lib/bodyParsers';
import type {
  BookerDetails,
  BookingRecord,
  ClientDetails,
  PassengerDetails,
  SavedDirectory,
} from '../../src/types';

export const dispatchRouter = Router();

async function ensureProfile() {
  const existing = await prisma.dispatchProfile.findUnique({ where: { id: 'default' } });
  if (existing) return existing;
  return prisma.dispatchProfile.create({
    data: { id: 'default', ...profileDataFromBody(DEFAULT_DISPATCH_PROFILE as unknown as Record<string, unknown>) },
  });
}

async function ensureDirectory() {
  const existing = await prisma.dispatchDirectory.findUnique({ where: { id: 'default' } });
  if (existing) return existing;
  return prisma.dispatchDirectory.create({
    data: { id: 'default', ...directoryDataFromBody(EMPTY_DIRECTORY as unknown as Record<string, unknown>) },
  });
}

function withId<T extends { id?: string }>(item: T, prefix: string): T & { id: string } {
  const id =
    typeof item.id === 'string' && item.id.trim()
      ? item.id.trim()
      : `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return { ...item, id };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

dispatchRouter.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const row = await ensureProfile();
    return sendSuccess(res, { profile: mapDbProfileToApi(row) });
  } catch (err) {
    console.error('GET /api/dispatch/profile:', err);
    return sendError(res, 500, 'Could not load dispatch profile.');
  }
});

dispatchRouter.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const data = profileDataFromBody((req.body ?? {}) as Record<string, unknown>);
    if (!data.companyName) return sendBadRequest(res, 'companyName is required.');
    await ensureProfile();
    const row = await prisma.dispatchProfile.update({ where: { id: 'default' }, data });
    return sendSuccess(res, { profile: mapDbProfileToApi(row) });
  } catch (err) {
    console.error('PUT /api/dispatch/profile:', err);
    return sendError(res, 500, 'Could not update dispatch profile.');
  }
});

// ─── Directory ───────────────────────────────────────────────────────────────

dispatchRouter.get('/directory', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const row = await ensureDirectory();
    return sendSuccess(res, { directory: mapDbDirectoryToApi(row) });
  } catch (err) {
    console.error('GET /api/dispatch/directory:', err);
    return sendError(res, 500, 'Could not load dispatch directory.');
  }
});

dispatchRouter.put('/directory', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    await ensureDirectory();
    const data = directoryDataFromBody((req.body ?? {}) as Record<string, unknown>);
    const row = await prisma.dispatchDirectory.update({ where: { id: 'default' }, data });
    return sendSuccess(res, { directory: mapDbDirectoryToApi(row) });
  } catch (err) {
    console.error('PUT /api/dispatch/directory:', err);
    return sendError(res, 500, 'Could not update dispatch directory.');
  }
});

async function mutateDirectoryList(
  key: keyof SavedDirectory,
  mutate: (list: unknown[]) => unknown[]
) {
  const row = await ensureDirectory();
  const dir = mapDbDirectoryToApi(row);
  const nextList = mutate((dir[key] as unknown[]) || []);
  const updated = { ...dir, [key]: nextList };
  const saved = await prisma.dispatchDirectory.update({
    where: { id: 'default' },
    data: directoryDataFromBody(updated as unknown as Record<string, unknown>),
  });
  return mapDbDirectoryToApi(saved);
}

dispatchRouter.post('/directory/clients', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as ClientDetails;
    if (!str(body.name)) return sendBadRequest(res, 'Client name is required.');
    const item = withId(body, 'CLI');
    const directory = await mutateDirectoryList('clients', (list) => {
      const filtered = list.filter(
        (c) => !(c && typeof c === 'object' && (c as ClientDetails).id === item.id)
      );
      return [item, ...filtered];
    });
    return sendSuccess(res, { client: item, directory }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/directory/clients:', err);
    return sendError(res, 500, 'Could not save client.');
  }
});

dispatchRouter.delete('/directory/clients/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const directory = await mutateDirectoryList('clients', (list) =>
      list.filter((c) => !(c && typeof c === 'object' && (c as ClientDetails).id === req.params.id))
    );
    return sendSuccess(res, { deleted: true, id: req.params.id, directory });
  } catch (err) {
    console.error('DELETE /api/dispatch/directory/clients/:id:', err);
    return sendError(res, 500, 'Could not delete client.');
  }
});

dispatchRouter.post('/directory/bookers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as BookerDetails;
    if (!str(body.name) || !str(body.phone)) {
      return sendBadRequest(res, 'Booker name and phone are required.');
    }
    const item = withId(body, 'BKR');
    const directory = await mutateDirectoryList('bookers', (list) => {
      const filtered = list.filter(
        (c) => !(c && typeof c === 'object' && (c as BookerDetails).id === item.id)
      );
      return [item, ...filtered];
    });
    return sendSuccess(res, { booker: item, directory }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/directory/bookers:', err);
    return sendError(res, 500, 'Could not save booker.');
  }
});

dispatchRouter.delete('/directory/bookers/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const directory = await mutateDirectoryList('bookers', (list) =>
      list.filter((c) => !(c && typeof c === 'object' && (c as BookerDetails).id === req.params.id))
    );
    return sendSuccess(res, { deleted: true, id: req.params.id, directory });
  } catch (err) {
    console.error('DELETE /api/dispatch/directory/bookers/:id:', err);
    return sendError(res, 500, 'Could not delete booker.');
  }
});

dispatchRouter.post('/directory/passengers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as PassengerDetails;
    if (!str(body.name)) return sendBadRequest(res, 'Passenger name is required.');
    const item = withId(body, 'PAX');
    const directory = await mutateDirectoryList('passengers', (list) => {
      const filtered = list.filter(
        (c) => !(c && typeof c === 'object' && (c as PassengerDetails).id === item.id)
      );
      return [item, ...filtered];
    });
    return sendSuccess(res, { passenger: item, directory }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/directory/passengers:', err);
    return sendError(res, 500, 'Could not save passenger.');
  }
});

dispatchRouter.delete(
  '/directory/passengers/:id',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
      const directory = await mutateDirectoryList('passengers', (list) =>
        list.filter(
          (c) => !(c && typeof c === 'object' && (c as PassengerDetails).id === req.params.id)
        )
      );
      return sendSuccess(res, { deleted: true, id: req.params.id, directory });
    } catch (err) {
      console.error('DELETE /api/dispatch/directory/passengers/:id:', err);
      return sendError(res, 500, 'Could not delete passenger.');
    }
  }
);

// ─── Tariffs ─────────────────────────────────────────────────────────────────

dispatchRouter.get('/tariffs', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const rows = await prisma.dispatchTariffPackage.findMany({
      orderBy: [{ packageName: 'asc' }],
    });
    return sendSuccess(res, { tariffs: rows.map(mapDbTariffToApi) });
  } catch (err) {
    console.error('GET /api/dispatch/tariffs:', err);
    return sendError(res, 500, 'Could not load tariffs.');
  }
});

dispatchRouter.post('/tariffs', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = tariffPackageDataFromBody(body);
    if (!data.packageName) return sendBadRequest(res, 'packageName is required.');
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.dispatchTariffPackage.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { tariff: mapDbTariffToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/tariffs:', err);
    return sendError(res, 500, 'Could not create tariff.');
  }
});

dispatchRouter.put('/tariffs/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchTariffPackage.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Tariff package not found.');
    const data = tariffPackageDataFromBody({
      ...existing,
      ...(req.body ?? {}),
    } as Record<string, unknown>);
    if (!data.packageName) return sendBadRequest(res, 'packageName is required.');
    const row = await prisma.dispatchTariffPackage.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { tariff: mapDbTariffToApi(row) });
  } catch (err) {
    console.error('PUT /api/dispatch/tariffs/:id:', err);
    return sendError(res, 500, 'Could not update tariff.');
  }
});

dispatchRouter.delete('/tariffs/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchTariffPackage.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Tariff package not found.');
    await prisma.dispatchTariffPackage.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/dispatch/tariffs/:id:', err);
    return sendError(res, 500, 'Could not delete tariff.');
  }
});

// ─── KPI / Finance / GPS (before :id routes) ─────────────────────────────────

dispatchRouter.get('/kpi', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const rows = await prisma.dispatchBooking.findMany();
    const bookings = rows.map(mapDbBookingToApi);
    return sendSuccess(res, { kpi: computeDispatchKpi(bookings) });
  } catch (err) {
    console.error('GET /api/dispatch/kpi:', err);
    return sendError(res, 500, 'Could not load dispatch KPI.');
  }
});

dispatchRouter.get('/finance', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const periodRaw = typeof req.query.period === 'string' ? req.query.period : 'all';
    const period =
      periodRaw === 'this_month' || periodRaw === 'last_month' ? periodRaw : 'all';
    const rows = await prisma.dispatchBooking.findMany();
    const bookings = rows.map(mapDbBookingToApi);
    return sendSuccess(res, { finance: computeDispatchFinance(bookings, period) });
  } catch (err) {
    console.error('GET /api/dispatch/finance:', err);
    return sendError(res, 500, 'Could not load dispatch finance.');
  }
});

dispatchRouter.get('/gps-snapshot', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const rows = await prisma.dispatchBooking.findMany({
      where: { status: { in: ['dispatched', 'active_enroute'] } },
      orderBy: [{ reportingDate: 'desc' }],
      take: 20,
    });
    const bookings = rows.map(mapDbBookingToApi);
    const snapshot = bookings.map((b, idx) => ({
      bookingId: b.id,
      bookingNumber: b.bookingNumber,
      vehicleNumber: b.vehicleNumber,
      driverName: b.driverName,
      status: b.status,
      location: {
        latitude: 26.8467 + (idx % 5) * 0.01,
        longitude: 80.9462 + (idx % 7) * 0.008,
        speedKmH: b.status === 'active_enroute' ? 35 + (idx % 20) : 0,
        heading: (idx * 45) % 360,
        address: b.pickupLocation || 'Lucknow sector relay',
        lastUpdated: new Date().toISOString(),
        status: b.status === 'active_enroute' ? 'moving' : 'idle',
        odometerKm: b.garageOutKm + (b.tariff.extraKmRun || 0),
      },
    }));
    return sendSuccess(res, { snapshot, simulated: true });
  } catch (err) {
    console.error('GET /api/dispatch/gps-snapshot:', err);
    return sendError(res, 500, 'Could not load GPS snapshot.');
  }
});

// ─── Bookings ────────────────────────────────────────────────────────────────

dispatchRouter.get('/bookings', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const rows = await prisma.dispatchBooking.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(from || to
          ? {
              reportingDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ reportingDate: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { bookings: rows.map(mapDbBookingToApi) });
  } catch (err) {
    console.error('GET /api/dispatch/bookings:', err);
    return sendError(res, 500, 'Could not load bookings.');
  }
});

dispatchRouter.post('/bookings/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.bookings)
      ? body.bookings
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide bookings array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = bookingDataFromBody(raw);
        if (!data.bookingNumber || !data.reportingDate) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.dispatchBooking.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbBookingToApi(row));
        } catch {
          if (id) {
            const existing = await tx.dispatchBooking.findUnique({ where: { id } });
            if (existing) out.push(mapDbBookingToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { bookings: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/bookings/bulk-import:', err);
    return sendError(res, 500, 'Booking bulk import failed.');
  }
});

dispatchRouter.get('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const row = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Booking not found.');
    return sendSuccess(res, { booking: mapDbBookingToApi(row) });
  } catch (err) {
    console.error('GET /api/dispatch/bookings/:id:', err);
    return sendError(res, 500, 'Could not load booking.');
  }
});

dispatchRouter.post('/bookings', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = bookingDataFromBody(body);
    if (!data.bookingNumber) return sendBadRequest(res, 'bookingNumber is required.');
    if (!data.reportingDate) return sendBadRequest(res, 'reportingDate is required.');
    const client = body.client as { name?: string } | undefined;
    if (!client?.name) return sendBadRequest(res, 'client.name is required.');
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.dispatchBooking.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { booking: mapDbBookingToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/dispatch/bookings:', err);
    return sendError(res, 500, 'Could not create booking.');
  }
});

dispatchRouter.put('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Booking not found.');
    const merged = {
      ...mapDbBookingToApi(existing),
      ...(req.body ?? {}),
    } as Record<string, unknown>;
    const data = bookingDataFromBody(merged);
    if (!data.bookingNumber || !data.reportingDate) {
      return sendBadRequest(res, 'bookingNumber and reportingDate are required.');
    }
    const row = await prisma.dispatchBooking.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { booking: mapDbBookingToApi(row) });
  } catch (err) {
    console.error('PUT /api/dispatch/bookings/:id:', err);
    return sendError(res, 500, 'Could not update booking.');
  }
});

dispatchRouter.delete('/bookings/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Booking not found.');
    await prisma.dispatchBooking.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/dispatch/bookings/:id:', err);
    return sendError(res, 500, 'Could not delete booking.');
  }
});

dispatchRouter.patch('/bookings/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Booking not found.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = str(body.status);
    const allowed = [
      'scheduled',
      'dispatched',
      'active_enroute',
      'completed',
      'billed',
      'settled',
      'cancelled',
    ];
    if (!allowed.includes(status)) return sendBadRequest(res, 'Invalid duty status.');
    const row = await prisma.dispatchBooking.update({
      where: { id: req.params.id },
      data: { status },
    });
    return sendSuccess(res, { booking: mapDbBookingToApi(row) });
  } catch (err) {
    console.error('PATCH /api/dispatch/bookings/:id/status:', err);
    return sendError(res, 500, 'Could not update booking status.');
  }
});

dispatchRouter.put('/bookings/:id/tariff', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Booking not found.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const tariff = body.tariff && typeof body.tariff === 'object' ? body.tariff : body;
    if (!tariff || typeof tariff !== 'object') {
      return sendBadRequest(res, 'tariff object is required.');
    }
    const row = await prisma.dispatchBooking.update({
      where: { id: req.params.id },
      data: { tariff: asJsonInput(tariff) },
    });
    return sendSuccess(res, { booking: mapDbBookingToApi(row) });
  } catch (err) {
    console.error('PUT /api/dispatch/bookings/:id/tariff:', err);
    return sendError(res, 500, 'Could not update booking tariff.');
  }
});

dispatchRouter.post(
  '/bookings/:id/client-settlement',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
      const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
      if (!existing) return sendNotFound(res, 'Booking not found.');
      const body = (req.body ?? {}) as Record<string, unknown>;
      const clientPaymentStatus = str(body.clientPaymentStatus || body.status, 'invoiced');
      const allowed = ['unbilled', 'invoiced', 'paid', 'overdue'];
      if (!allowed.includes(clientPaymentStatus)) {
        return sendBadRequest(res, 'Invalid clientPaymentStatus.');
      }
      const booking = mapDbBookingToApi(existing);
      const paidAmount =
        body.clientPaidAmount !== undefined && body.clientPaidAmount !== null
          ? num(body.clientPaidAmount)
          : clientPaymentStatus === 'paid'
            ? booking.tariff.netClientBillable
            : existing.clientPaidAmount;
      const row = await prisma.dispatchBooking.update({
        where: { id: req.params.id },
        data: {
          clientPaymentStatus,
          clientInvoiceNumber:
            optStr(body.clientInvoiceNumber) ||
            optStr(body.invoiceNo) ||
            existing.clientInvoiceNumber,
          clientPaidAmount: paidAmount,
          status:
            clientPaymentStatus === 'paid'
              ? 'settled'
              : clientPaymentStatus === 'invoiced'
                ? 'billed'
                : existing.status,
        },
      });
      return sendSuccess(res, { booking: mapDbBookingToApi(row) });
    } catch (err) {
      console.error('POST /api/dispatch/bookings/:id/client-settlement:', err);
      return sendError(res, 500, 'Could not save client settlement.');
    }
  }
);

dispatchRouter.post(
  '/bookings/:id/driver-settlement',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!canEditModule(req, 'fleet_dispatch')) return sendForbidden(res);
      const existing = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
      if (!existing) return sendNotFound(res, 'Booking not found.');
      const body = (req.body ?? {}) as Record<string, unknown>;
      const driverPaymentStatus = str(body.driverPaymentStatus || body.status, 'settled');
      const allowed = ['pending', 'partially_paid', 'settled'];
      if (!allowed.includes(driverPaymentStatus)) {
        return sendBadRequest(res, 'Invalid driverPaymentStatus.');
      }
      const booking = mapDbBookingToApi(existing);
      const paidAmount =
        body.driverPaidAmount !== undefined && body.driverPaidAmount !== null
          ? num(body.driverPaidAmount)
          : driverPaymentStatus === 'settled'
            ? booking.tariff.netDriverPayable
            : existing.driverPaidAmount;
      const row = await prisma.dispatchBooking.update({
        where: { id: req.params.id },
        data: {
          driverPaymentStatus,
          driverPaidAmount: paidAmount,
        },
      });
      return sendSuccess(res, { booking: mapDbBookingToApi(row) });
    } catch (err) {
      console.error('POST /api/dispatch/bookings/:id/driver-settlement:', err);
      return sendError(res, 500, 'Could not save driver settlement.');
    }
  }
);

dispatchRouter.get('/bookings/:id/slip', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fleet_dispatch')) return sendForbidden(res);
    const row = await prisma.dispatchBooking.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Booking not found.');
    const profile = mapDbProfileToApi(await ensureProfile());
    const booking = mapDbBookingToApi(row);
    return sendSuccess(res, { slip: buildSlipPayload(booking, profile), booking });
  } catch (err) {
    console.error('GET /api/dispatch/bookings/:id/slip:', err);
    return sendError(res, 500, 'Could not build slip payload.');
  }
});
