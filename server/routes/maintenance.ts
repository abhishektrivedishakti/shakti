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
import { maintenanceDataFromBody, mapDbMaintenanceToApi } from '../lib/maintenanceMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'maintenance')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const serviceType =
      typeof req.query.serviceType === 'string' ? req.query.serviceType.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';

    const rows = await prisma.maintenanceRecord.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(serviceType ? { serviceType } : {}),
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
    return sendSuccess(res, { records: rows.map(mapDbMaintenanceToApi) });
  } catch (err) {
    console.error('GET /api/maintenance:', err);
    return sendError(res, 500, 'Could not load maintenance records.');
  }
});

maintenanceRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'maintenance')) return sendForbidden(res);
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
        const data = maintenanceDataFromBody(raw);
        if (!data.date || !data.vehicleId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.maintenanceRecord.create({ data: id ? { id, ...data } : data });
          out.push(mapDbMaintenanceToApi(row));
        } catch {
          if (id) {
            const existing = await tx.maintenanceRecord.findUnique({ where: { id } });
            if (existing) out.push(mapDbMaintenanceToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { records: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/maintenance/bulk-import:', err);
    return sendError(res, 500, 'Maintenance bulk import failed.');
  }
});

maintenanceRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'maintenance')) return sendForbidden(res);
    const row = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Maintenance record not found.');
    return sendSuccess(res, { record: mapDbMaintenanceToApi(row) });
  } catch (err) {
    console.error('GET /api/maintenance/:id:', err);
    return sendError(res, 500, 'Could not load maintenance record.');
  }
});

maintenanceRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'maintenance')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = maintenanceDataFromBody(body);
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!data.vehicleId) return sendBadRequest(res, 'vehicleId is required.');

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Record with this id already exists. Use PUT to update.');
    }

    const row = await prisma.maintenanceRecord.create({ data: id ? { id, ...data } : data });

    let vehicle = null;
    const veh = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (veh) {
      vehicle = mapDbVehicleToApi(
        await prisma.vehicle.update({
          where: { id: veh.id },
          data: {
            lastServiceDate: data.date,
            lastServiceKm: data.odometerKm,
            ...(data.nextServiceDueKm != null ? { nextServiceDueKm: data.nextServiceDueKm } : {}),
            ...(data.nextServiceDueDate
              ? { nextServiceDueDate: data.nextServiceDueDate }
              : {}),
            ...(data.odometerKm > veh.currentOdometer
              ? { currentOdometer: data.odometerKm }
              : {}),
          },
        })
      );
    }

    return sendSuccess(res, { record: mapDbMaintenanceToApi(row), vehicle }, 201);
  } catch (err) {
    console.error('POST /api/maintenance:', err);
    return sendError(res, 500, 'Could not create maintenance record.');
  }
});

maintenanceRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'maintenance')) return sendForbidden(res);
    const existing = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Maintenance record not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = maintenanceDataFromBody({ ...mapDbMaintenanceToApi(existing), ...body });
    if (!data.date || !data.vehicleId) return sendBadRequest(res, 'date and vehicleId are required.');

    const row = await prisma.maintenanceRecord.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { record: mapDbMaintenanceToApi(row) });
  } catch (err) {
    console.error('PUT /api/maintenance/:id:', err);
    return sendError(res, 500, 'Could not update maintenance record.');
  }
});

maintenanceRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'maintenance')) return sendForbidden(res);
    const existing = await prisma.maintenanceRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Maintenance record not found.');
    await prisma.maintenanceRecord.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/maintenance/:id:', err);
    return sendError(res, 500, 'Could not delete maintenance record.');
  }
});
