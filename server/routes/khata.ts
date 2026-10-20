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
  khataDataFromBody,
  mapDbKhataToApi,
  summarizeKhataForDriver,
} from '../lib/khataMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const khataRouter = Router();

khataRouter.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'drivers_khata')) return sendForbidden(res);
    const rows = await prisma.driverKhataTransaction.findMany({
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
    const txs = rows.map(mapDbKhataToApi);
    const byDriver = new Map<string, { driverId: string; driverName: string }>();
    for (const tx of txs) {
      if (!byDriver.has(tx.driverId)) {
        byDriver.set(tx.driverId, { driverId: tx.driverId, driverName: tx.driverName });
      }
    }
    const summaries = [...byDriver.values()].map((d) =>
      summarizeKhataForDriver(d.driverId, d.driverName, txs)
    );
    return sendSuccess(res, { summaries });
  } catch (err) {
    console.error('GET /api/khata/summary:', err);
    return sendError(res, 500, 'Could not load khata summary.');
  }
});

khataRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'drivers_khata')) return sendForbidden(res);
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const rows = await prisma.driverKhataTransaction.findMany({
      where: driverId ? { driverId } : undefined,
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { transactions: rows.map(mapDbKhataToApi) });
  } catch (err) {
    console.error('GET /api/khata:', err);
    return sendError(res, 500, 'Could not load khata transactions.');
  }
});

khataRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.transactions)
      ? body.transactions
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide transactions array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = khataDataFromBody(raw);
        if (!data.driverId || !data.date || !data.amount) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.driverKhataTransaction.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbKhataToApi(row));
        } catch {
          if (id) {
            const existing = await tx.driverKhataTransaction.findUnique({ where: { id } });
            if (existing) out.push(mapDbKhataToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { transactions: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/khata/bulk-import:', err);
    return sendError(res, 500, 'Khata bulk import failed.');
  }
});

khataRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'drivers_khata')) return sendForbidden(res);
    const row = await prisma.driverKhataTransaction.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Khata transaction not found.');
    return sendSuccess(res, { transaction: mapDbKhataToApi(row) });
  } catch (err) {
    console.error('GET /api/khata/:id:', err);
    return sendError(res, 500, 'Could not load khata transaction.');
  }
});

khataRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = khataDataFromBody(body);
    if (!data.driverId) return sendBadRequest(res, 'driverId is required.');
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!(data.amount > 0)) return sendBadRequest(res, 'amount must be greater than 0.');

    if (!data.driverName) {
      const drv = await prisma.driver.findUnique({ where: { id: data.driverId } });
      if (drv) data.driverName = drv.name;
    }

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.driverKhataTransaction.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { transaction: mapDbKhataToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/khata:', err);
    return sendError(res, 500, 'Could not create khata transaction.');
  }
});

khataRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const existing = await prisma.driverKhataTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Khata transaction not found.');
    const data = khataDataFromBody({ ...existing, ...(req.body ?? {}) } as Record<string, unknown>);
    if (!data.driverId) return sendBadRequest(res, 'driverId is required.');
    if (!data.date) return sendBadRequest(res, 'date is required.');
    const row = await prisma.driverKhataTransaction.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { transaction: mapDbKhataToApi(row) });
  } catch (err) {
    console.error('PUT /api/khata/:id:', err);
    return sendError(res, 500, 'Could not update khata transaction.');
  }
});

khataRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'drivers_khata')) return sendForbidden(res);
    const existing = await prisma.driverKhataTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Khata transaction not found.');
    await prisma.driverKhataTransaction.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/khata/:id:', err);
    return sendError(res, 500, 'Could not delete khata transaction.');
  }
});
