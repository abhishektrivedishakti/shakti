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
  mapDbVendorSettlementToApi,
  vendorSettlementDataFromBody,
} from '../lib/vendorMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { optStr, str } from '../lib/bodyParsers';

export const vendorSettlementsRouter = Router();

vendorSettlementsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'attached_vendors')) return sendForbidden(res);
    const vendorId = typeof req.query.vendorId === 'string' ? req.query.vendorId.trim() : '';
    const monthYear =
      typeof req.query.monthYear === 'string' ? req.query.monthYear.trim() : '';
    const paymentStatus =
      typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim() : '';
    const rows = await prisma.vendorSettlement.findMany({
      where: {
        ...(vendorId ? { vendorId } : {}),
        ...(monthYear ? { monthYear } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      orderBy: [{ monthYear: 'desc' }, { settlementDate: 'desc' }],
    });
    return sendSuccess(res, { settlements: rows.map(mapDbVendorSettlementToApi) });
  } catch (err) {
    console.error('GET /api/vendor-settlements:', err);
    return sendError(res, 500, 'Could not load vendor settlements.');
  }
});

vendorSettlementsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.settlements)
      ? body.settlements
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide settlements array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = vendorSettlementDataFromBody(raw);
        if (!data.vendorId || !data.monthYear) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.vendorSettlement.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbVendorSettlementToApi(row));
        } catch {
          if (id) {
            const existing = await tx.vendorSettlement.findUnique({ where: { id } });
            if (existing) out.push(mapDbVendorSettlementToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { settlements: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/vendor-settlements/bulk-import:', err);
    return sendError(res, 500, 'Vendor settlement bulk import failed.');
  }
});

vendorSettlementsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'attached_vendors')) return sendForbidden(res);
    const row = await prisma.vendorSettlement.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Vendor settlement not found.');
    return sendSuccess(res, { settlement: mapDbVendorSettlementToApi(row) });
  } catch (err) {
    console.error('GET /api/vendor-settlements/:id:', err);
    return sendError(res, 500, 'Could not load vendor settlement.');
  }
});

vendorSettlementsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = vendorSettlementDataFromBody(body);
    if (!data.vendorId) return sendBadRequest(res, 'vendorId is required.');
    if (!data.monthYear || !/^\d{4}-\d{2}$/.test(data.monthYear)) {
      return sendBadRequest(res, 'monthYear is required as YYYY-MM.');
    }
    if (!data.vendorName) {
      const vendor = await prisma.vendor.findUnique({ where: { id: data.vendorId } });
      if (vendor) data.vendorName = vendor.name;
    }
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.vendorSettlement.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { settlement: mapDbVendorSettlementToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/vendor-settlements:', err);
    return sendError(res, 500, 'Could not create vendor settlement.');
  }
});

vendorSettlementsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const existing = await prisma.vendorSettlement.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vendor settlement not found.');
    const data = vendorSettlementDataFromBody({
      ...existing,
      ...(req.body ?? {}),
    } as Record<string, unknown>);
    if (!data.vendorId || !data.monthYear) {
      return sendBadRequest(res, 'vendorId and monthYear are required.');
    }
    const row = await prisma.vendorSettlement.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { settlement: mapDbVendorSettlementToApi(row) });
  } catch (err) {
    console.error('PUT /api/vendor-settlements/:id:', err);
    return sendError(res, 500, 'Could not update vendor settlement.');
  }
});

vendorSettlementsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const existing = await prisma.vendorSettlement.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vendor settlement not found.');
    await prisma.vendorSettlement.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/vendor-settlements/:id:', err);
    return sendError(res, 500, 'Could not delete vendor settlement.');
  }
});

vendorSettlementsRouter.post('/:id/pay', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'attached_vendors')) return sendForbidden(res);
    const existing = await prisma.vendorSettlement.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vendor settlement not found.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const paymentRef =
      str(body.paymentRef) ||
      str(body.referenceNumber) ||
      `VND-TRF-${Date.now().toString().slice(-4)}`;
    const paymentDate =
      optStr(body.paymentDate) || new Date().toISOString().slice(0, 10);
    const row = await prisma.vendorSettlement.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: 'paid',
        paymentDate,
        paymentRef,
      },
    });
    return sendSuccess(res, { settlement: mapDbVendorSettlementToApi(row) });
  } catch (err) {
    console.error('POST /api/vendor-settlements/:id/pay:', err);
    return sendError(res, 500, 'Could not mark settlement paid.');
  }
});
