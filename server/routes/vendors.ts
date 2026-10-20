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
import { mapDbVendorToApi, vendorDataFromBody } from '../lib/vendorMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const vendorsRouter = Router();

vendorsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'attached_vendors')) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const vendorType =
      typeof req.query.vendorType === 'string' ? req.query.vendorType.trim() : '';
    const rows = await prisma.vendor.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(vendorType ? { vendorType } : {}),
      },
      orderBy: [{ name: 'asc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { vendors: rows.map(mapDbVendorToApi) });
  } catch (err) {
    console.error('GET /api/vendors:', err);
    return sendError(res, 500, 'Could not load vendors.');
  }
});

vendorsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.vendors)
      ? body.vendors
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide vendors array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = vendorDataFromBody(raw);
        if (!data.name || !data.phone) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.vendor.create({ data: id ? { id, ...data } : data });
          out.push(mapDbVendorToApi(row));
        } catch {
          if (id) {
            const existing = await tx.vendor.findUnique({ where: { id } });
            if (existing) out.push(mapDbVendorToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { vendors: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/vendors/bulk-import:', err);
    return sendError(res, 500, 'Vendor bulk import failed.');
  }
});

vendorsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'attached_vendors')) return sendForbidden(res);
    const row = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Vendor not found.');
    return sendSuccess(res, { vendor: mapDbVendorToApi(row) });
  } catch (err) {
    console.error('GET /api/vendors/:id:', err);
    return sendError(res, 500, 'Could not load vendor.');
  }
});

vendorsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = vendorDataFromBody(body);
    if (!data.name) return sendBadRequest(res, 'name is required.');
    if (!data.phone) return sendBadRequest(res, 'phone is required.');
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.vendor.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { vendor: mapDbVendorToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/vendors:', err);
    return sendError(res, 500, 'Could not create vendor.');
  }
});

vendorsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vendor not found.');
    const data = vendorDataFromBody({ ...existing, ...(req.body ?? {}) } as Record<string, unknown>);
    if (!data.name || !data.phone) return sendBadRequest(res, 'name and phone are required.');
    const row = await prisma.vendor.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { vendor: mapDbVendorToApi(row) });
  } catch (err) {
    console.error('PUT /api/vendors/:id:', err);
    return sendError(res, 500, 'Could not update vendor.');
  }
});

vendorsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const existing = await prisma.vendor.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vendor not found.');
    await prisma.vendor.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/vendors/:id:', err);
    return sendError(res, 500, 'Could not delete vendor.');
  }
});
