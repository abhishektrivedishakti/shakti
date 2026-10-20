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
import { leaveDataFromBody, mapDbLeaveToApi } from '../lib/khataMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const driverLeavesRouter = Router();

driverLeavesRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'drivers_khata')) return sendForbidden(res);
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const rows = await prisma.driverLeaveRecord.findMany({
      where: driverId ? { driverId } : undefined,
      orderBy: [{ startDate: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { leaves: rows.map(mapDbLeaveToApi) });
  } catch (err) {
    console.error('GET /api/driver-leaves:', err);
    return sendError(res, 500, 'Could not load driver leaves.');
  }
});

driverLeavesRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.leaves)
      ? body.leaves
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide leaves array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = leaveDataFromBody(raw);
        if (!data.driverId || !data.startDate || !data.endDate) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.driverLeaveRecord.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbLeaveToApi(row));
        } catch {
          if (id) {
            const existing = await tx.driverLeaveRecord.findUnique({ where: { id } });
            if (existing) out.push(mapDbLeaveToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { leaves: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/driver-leaves/bulk-import:', err);
    return sendError(res, 500, 'Driver leave bulk import failed.');
  }
});

driverLeavesRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = leaveDataFromBody(body);
    if (!data.driverId) return sendBadRequest(res, 'driverId is required.');
    if (!data.startDate || !data.endDate) {
      return sendBadRequest(res, 'startDate and endDate are required.');
    }
    if (!data.driverName) {
      const drv = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (drv) data.driverName = drv.name;
    }
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.driverLeaveRecord.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { leave: mapDbLeaveToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/driver-leaves:', err);
    return sendError(res, 500, 'Could not create driver leave.');
  }
});

driverLeavesRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const existing = await prisma.driverLeaveRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver leave not found.');
    const data = leaveDataFromBody({ ...existing, ...(req.body ?? {}) } as Record<string, unknown>);
    if (!data.driverId || !data.startDate || !data.endDate) {
      return sendBadRequest(res, 'driverId, startDate and endDate are required.');
    }
    const row = await prisma.driverLeaveRecord.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { leave: mapDbLeaveToApi(row) });
  } catch (err) {
    console.error('PUT /api/driver-leaves/:id:', err);
    return sendError(res, 500, 'Could not update driver leave.');
  }
});

driverLeavesRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const existing = await prisma.driverLeaveRecord.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver leave not found.');
    await prisma.driverLeaveRecord.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/driver-leaves/:id:', err);
    return sendError(res, 500, 'Could not delete driver leave.');
  }
});
