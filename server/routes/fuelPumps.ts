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
import { fuelPumpDataFromBody, mapDbFuelPumpToApi } from '../lib/fuelMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const fuelPumpsRouter = Router();

fuelPumpsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const rows = await prisma.fuelPumpVendor.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { location: { contains: q } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });
    return sendSuccess(res, { pumps: rows.map(mapDbFuelPumpToApi) });
  } catch (err) {
    console.error('GET /api/fuel-pumps:', err);
    return sendError(res, 500, 'Could not load fuel pumps.');
  }
});

fuelPumpsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.pumps)
      ? body.pumps
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide pumps array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = fuelPumpDataFromBody(raw);
        if (!data.name) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.fuelPumpVendor.create({ data: id ? { id, ...data } : data });
          out.push(mapDbFuelPumpToApi(row));
        } catch {
          if (id) {
            const existing = await tx.fuelPumpVendor.findUnique({ where: { id } });
            if (existing) out.push(mapDbFuelPumpToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { pumps: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/fuel-pumps/bulk-import:', err);
    return sendError(res, 500, 'Fuel pump bulk import failed.');
  }
});

fuelPumpsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const row = await prisma.fuelPumpVendor.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Fuel pump not found.');
    return sendSuccess(res, { pump: mapDbFuelPumpToApi(row) });
  } catch (err) {
    console.error('GET /api/fuel-pumps/:id:', err);
    return sendError(res, 500, 'Could not load fuel pump.');
  }
});

fuelPumpsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelPumpDataFromBody(body);
    if (!data.name) return sendBadRequest(res, 'Pump name is required.');

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.fuelPumpVendor.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Pump with this id already exists. Use PUT to update.');
    }

    const row = await prisma.fuelPumpVendor.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { pump: mapDbFuelPumpToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/fuel-pumps:', err);
    return sendError(res, 500, 'Could not create fuel pump.');
  }
});

fuelPumpsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelPumpVendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel pump not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelPumpDataFromBody({ ...mapDbFuelPumpToApi(existing), ...body });
    if (!data.name) return sendBadRequest(res, 'Pump name is required.');

    const row = await prisma.fuelPumpVendor.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { pump: mapDbFuelPumpToApi(row) });
  } catch (err) {
    console.error('PUT /api/fuel-pumps/:id:', err);
    return sendError(res, 500, 'Could not update fuel pump.');
  }
});

fuelPumpsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelPumpVendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel pump not found.');
    await prisma.fuelPumpVendor.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/fuel-pumps/:id:', err);
    return sendError(res, 500, 'Could not delete fuel pump.');
  }
});
