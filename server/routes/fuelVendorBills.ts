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
  fuelBillDataFromBody,
  mapDbFuelBillToApi,
  mapDbFuelSlipToApi,
  parseLinkedSlipIds,
} from '../lib/fuelMapper';
import { num, optStr, str } from '../lib/bodyParsers';
import { withBulkTransaction } from '../lib/batchWork';

export const fuelVendorBillsRouter = Router();

fuelVendorBillsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const pumpVendorId =
      typeof req.query.pumpVendorId === 'string' ? req.query.pumpVendorId.trim() : '';
    const monthYear = typeof req.query.monthYear === 'string' ? req.query.monthYear.trim() : '';
    const paymentStatus =
      typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim() : '';

    const rows = await prisma.fuelVendorMonthlyBill.findMany({
      where: {
        ...(pumpVendorId ? { pumpVendorId } : {}),
        ...(monthYear ? { monthYear } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      orderBy: [{ billDate: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { bills: rows.map(mapDbFuelBillToApi) });
  } catch (err) {
    console.error('GET /api/fuel-vendor-bills:', err);
    return sendError(res, 500, 'Could not load fuel vendor bills.');
  }
});

fuelVendorBillsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.bills)
      ? body.bills
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide bills array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = fuelBillDataFromBody(raw);
        if (!data.billNumber || !data.pumpVendorId || !data.monthYear) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.fuelVendorMonthlyBill.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbFuelBillToApi(row));
        } catch {
          if (id) {
            const existing = await tx.fuelVendorMonthlyBill.findUnique({ where: { id } });
            if (existing) out.push(mapDbFuelBillToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { bills: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/fuel-vendor-bills/bulk-import:', err);
    return sendError(res, 500, 'Fuel vendor bill bulk import failed.');
  }
});

fuelVendorBillsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const row = await prisma.fuelVendorMonthlyBill.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Fuel vendor bill not found.');
    return sendSuccess(res, { bill: mapDbFuelBillToApi(row) });
  } catch (err) {
    console.error('GET /api/fuel-vendor-bills/:id:', err);
    return sendError(res, 500, 'Could not load fuel vendor bill.');
  }
});

fuelVendorBillsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelBillDataFromBody(body);
    if (!data.billNumber) return sendBadRequest(res, 'billNumber is required.');
    if (!data.pumpVendorId) return sendBadRequest(res, 'pumpVendorId is required.');
    if (!data.monthYear) return sendBadRequest(res, 'monthYear is required.');
    if (!data.billDate) data.billDate = new Date().toISOString().slice(0, 10);

    const linkedSlipIds = parseLinkedSlipIds(body);
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.fuelVendorMonthlyBill.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Bill with this id already exists. Use PUT to update.');
    }

    if (linkedSlipIds.length > 0 && !data.reconciledSlipsCount) {
      data.reconciledSlipsCount = linkedSlipIds.length;
    }

    const row = await prisma.$transaction(async (tx) => {
      const bill = await tx.fuelVendorMonthlyBill.create({
        data: id ? { id, ...data } : data,
      });

      if (linkedSlipIds.length > 0) {
        await tx.fuelSlip.updateMany({
          where: { id: { in: linkedSlipIds } },
          data: {
            status: 'billed',
            vendorBillId: bill.id,
            vendorBillNumber: bill.billNumber,
          },
        });
      }
      return bill;
    });

    const slips =
      linkedSlipIds.length > 0
        ? (
            await prisma.fuelSlip.findMany({ where: { id: { in: linkedSlipIds } } })
          ).map(mapDbFuelSlipToApi)
        : [];

    return sendSuccess(res, { bill: mapDbFuelBillToApi(row), slips }, 201);
  } catch (err) {
    console.error('POST /api/fuel-vendor-bills:', err);
    return sendError(res, 500, 'Could not create fuel vendor bill.');
  }
});

fuelVendorBillsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelVendorMonthlyBill.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Fuel vendor bill not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelBillDataFromBody({ ...mapDbFuelBillToApi(existing), ...body });
    if (!data.billNumber || !data.pumpVendorId || !data.monthYear) {
      return sendBadRequest(res, 'billNumber, pumpVendorId and monthYear are required.');
    }

    const linkedSlipIds = parseLinkedSlipIds(body);
    const row = await prisma.$transaction(async (tx) => {
      const bill = await tx.fuelVendorMonthlyBill.update({
        where: { id: req.params.id },
        data,
      });
      if (linkedSlipIds.length > 0) {
        await tx.fuelSlip.updateMany({
          where: { id: { in: linkedSlipIds } },
          data: {
            status: 'billed',
            vendorBillId: bill.id,
            vendorBillNumber: bill.billNumber,
          },
        });
      }
      return bill;
    });

    return sendSuccess(res, { bill: mapDbFuelBillToApi(row) });
  } catch (err) {
    console.error('PUT /api/fuel-vendor-bills/:id:', err);
    return sendError(res, 500, 'Could not update fuel vendor bill.');
  }
});

fuelVendorBillsRouter.post('/:id/pay', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelVendorMonthlyBill.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Fuel vendor bill not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const paidAmount = num(body.paidAmount ?? body.amount, existing.netPayable);
    const paidDate =
      optStr(body.paidDate) || optStr(body.date) || new Date().toISOString().slice(0, 10);
    const paymentMode = str(body.paymentMode ?? body.mode, 'bank_transfer') || 'bank_transfer';
    const paymentReference = optStr(body.paymentReference ?? body.ref);

    const fullyPaid = paidAmount >= existing.netPayable - 0.01;
    const paymentStatus = fullyPaid ? 'paid' : paidAmount > 0 ? 'partially_paid' : 'pending';

    const row = await prisma.fuelVendorMonthlyBill.update({
      where: { id: req.params.id },
      data: {
        paidAmount,
        paidDate,
        paymentMode,
        paymentReference,
        paymentStatus,
      },
    });

    return sendSuccess(res, { bill: mapDbFuelBillToApi(row) });
  } catch (err) {
    console.error('POST /api/fuel-vendor-bills/:id/pay:', err);
    return sendError(res, 500, 'Could not record fuel vendor bill payment.');
  }
});

fuelVendorBillsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelVendorMonthlyBill.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Fuel vendor bill not found.');

    await prisma.$transaction(async (tx) => {
      await tx.fuelSlip.updateMany({
        where: { vendorBillId: req.params.id },
        data: {
          status: 'filled',
          vendorBillId: null,
          vendorBillNumber: null,
        },
      });
      await tx.fuelVendorMonthlyBill.delete({ where: { id: req.params.id } });
    });

    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/fuel-vendor-bills/:id:', err);
    return sendError(res, 500, 'Could not delete fuel vendor bill.');
  }
});
