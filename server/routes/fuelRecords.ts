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
import { fuelRecordDataFromBody, mapDbFuelRecordToApi } from '../lib/fuelMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const fuelRecordsRouter = Router();

fuelRecordsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const pumpVendorId =
      typeof req.query.pumpVendorId === 'string' ? req.query.pumpVendorId.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';

    const rows = await prisma.fuelRecord.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(driverId ? { driverId } : {}),
        ...(pumpVendorId ? { pumpVendorId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { records: rows.map(mapDbFuelRecordToApi) });
  } catch (err) {
    console.error('GET /api/fuel-records:', err);
    return sendError(res, 500, 'Could not load fuel records.');
  }
});

fuelRecordsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.records)
      ? body.records
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide records array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = fuelRecordDataFromBody(raw);
        if (!data.date || !data.vehicleId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.fuelRecord.create({ data: id ? { id, ...data } : data });
          out.push(mapDbFuelRecordToApi(row));
        } catch {
          if (id) {
            const existing = await tx.fuelRecord.findUnique({ where: { id } });
            if (existing) out.push(mapDbFuelRecordToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { records: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/fuel-records/bulk-import:', err);
    return sendError(res, 500, 'Fuel record bulk import failed.');
  }
});

fuelRecordsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const row = await prisma.fuelRecord.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Fuel record not found.');
    return sendSuccess(res, { record: mapDbFuelRecordToApi(row) });
  } catch (err) {
    console.error('GET /api/fuel-records/:id:', err);
    return sendError(res, 500, 'Could not load fuel record.');
  }
});

fuelRecordsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelRecordDataFromBody(body);
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!data.vehicleId) return sendBadRequest(res, 'vehicleId is required.');

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.fuelRecord.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Record with this id already exists. Use PUT to update.');
    }

    const row = await prisma.fuelRecord.create({ data: id ? { id, ...data } : data });

    let vehicle = null;
    if (data.odometerKm > 0) {
      const veh = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
      if (veh && data.odometerKm > veh.currentOdometer) {
        vehicle = mapDbVehicleToApi(
          await prisma.vehicle.update({
            where: { id: veh.id },
            data: { currentOdometer: data.odometerKm },
          })
        );
      }
    }

    return sendSuccess(res, { record: mapDbFuelRecordToApi(row), vehicle }, 201);
  } catch (err) {
    console.error('POST /api/fuel-records:', err);
    return sendError(res, 500, 'Could not create fuel record.');
  }
});

fuelRecordsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel record not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelRecordDataFromBody({ ...mapDbFuelRecordToApi(existing), ...body });
    if (!data.date || !data.vehicleId) return sendBadRequest(res, 'date and vehicleId are required.');

    const row = await prisma.fuelRecord.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { record: mapDbFuelRecordToApi(row) });
  } catch (err) {
    console.error('PUT /api/fuel-records/:id:', err);
    return sendError(res, 500, 'Could not update fuel record.');
  }
});

fuelRecordsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel record not found.');
    await prisma.fuelRecord.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/fuel-records/:id:', err);
    return sendError(res, 500, 'Could not delete fuel record.');
  }
});
