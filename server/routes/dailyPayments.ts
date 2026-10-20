import { Router, type Request, type Response } from 'express';
import type { Prisma } from '../generated/prisma';
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
  dailyPaymentDataFromBody,
  mapDbDailyPaymentToApi,
  resolveAutoRoutedTo,
} from '../lib/dailyPaymentMapper';
import { mapDbKhataToApi } from '../lib/khataMapper';
import { mapDbFuelRecordToApi } from '../lib/fuelMapper';
import { mapDbMaintenanceToApi } from '../lib/maintenanceMapper';
import { mapDbVendorSettlementToApi } from '../lib/vendorMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const dailyPaymentsRouter = Router();

type TxClient = Prisma.TransactionClient;

async function applyDailyPaymentRouting(
  tx: TxClient,
  payment: ReturnType<typeof mapDbDailyPaymentToApi>
) {
  const routed: {
    khata?: ReturnType<typeof mapDbKhataToApi>;
    fuelRecord?: ReturnType<typeof mapDbFuelRecordToApi>;
    maintenance?: ReturnType<typeof mapDbMaintenanceToApi>;
    settlement?: ReturnType<typeof mapDbVendorSettlementToApi>;
  } = {};

  const khataMode =
    payment.paymentMode === 'cheque' ? 'bank_transfer' : payment.paymentMode;

  if (
    (payment.category === 'driver_advance' ||
      payment.category === 'driver_salary' ||
      payment.category === 'fastag_toll') &&
    payment.driverId
  ) {
    let driverName = payment.payeeName;
    const drv = await tx.driver.findUnique({ where: { id: payment.driverId } });
    if (drv) driverName = drv.name;

    const type =
      payment.category === 'driver_advance'
        ? 'advance'
        : payment.category === 'driver_salary'
          ? 'salary_payment'
          : 'fastag_topup';

    const description =
      payment.description ||
      (type === 'advance'
        ? `Daily advance via ${payment.paymentMode.toUpperCase()}`
        : type === 'salary_payment'
          ? `Salary payment via ${payment.paymentMode.toUpperCase()}`
          : `FASTag recharge for ${payment.vehicleNumber || 'Vehicle'}`);

    const row = await tx.driverKhataTransaction.create({
      data: {
        driverId: payment.driverId,
        driverName,
        date: payment.date,
        type,
        amount: payment.amount,
        description,
        paymentMode: khataMode,
        referenceNumber: payment.referenceNumber ?? null,
        vehicleId: payment.vehicleId ?? null,
        vehicleNumber: payment.vehicleNumber ?? null,
        recordedBy: payment.recordedBy ?? null,
      },
    });
    routed.khata = mapDbKhataToApi(row);
  } else if (payment.category === 'fuel' && payment.vehicleId) {
    const veh = await tx.vehicle.findUnique({ where: { id: payment.vehicleId } });
    const driverId = payment.driverId || veh?.currentDriverId || 'd-generic';
    let driverName = payment.payeeName || 'Driver';
    if (payment.driverId || veh?.currentDriverId) {
      const drv = await tx.driver.findUnique({
        where: { id: payment.driverId || veh!.currentDriverId! },
      });
      if (drv) driverName = drv.name;
    }
    const liters = Math.max(1, Math.round(payment.amount / 92));
    const row = await tx.fuelRecord.create({
      data: {
        date: payment.date,
        vehicleId: payment.vehicleId,
        vehicleNumber: payment.vehicleNumber || veh?.vehicleNumber || '',
        driverId,
        driverName,
        mode: 'slip',
        liters,
        ratePerLiter: 92,
        totalAmount: payment.amount,
        odometerKm: veh?.currentOdometer || 50000,
        fuelType: veh?.fuelType || 'Diesel',
        fuelStation: payment.payeeName || 'Authorized Fuel Station',
        receiptNumber: payment.referenceNumber || `RCP-${Date.now().toString().slice(-5)}`,
        fullTank: false,
        notes: payment.description || 'Auto-created from Daily Payments Journal',
        recordedBy: payment.recordedBy ?? null,
      },
    });
    routed.fuelRecord = mapDbFuelRecordToApi(row);
  } else if (payment.category === 'maintenance' && payment.vehicleId) {
    const veh = await tx.vehicle.findUnique({ where: { id: payment.vehicleId } });
    const row = await tx.maintenanceRecord.create({
      data: {
        date: payment.date,
        vehicleId: payment.vehicleId,
        vehicleNumber: payment.vehicleNumber || veh?.vehicleNumber || '',
        serviceType: 'other',
        odometerKm: veh?.currentOdometer || 50000,
        garageName: payment.payeeName || 'Authorized Workshop',
        cost: payment.amount,
        description: payment.description || 'Maintenance repair expense',
        invoiceNumber: payment.referenceNumber || `INV-${Date.now().toString().slice(-4)}`,
        recordedBy: payment.recordedBy ?? null,
      },
    });
    routed.maintenance = mapDbMaintenanceToApi(row);
  } else if (payment.category === 'vendor_rent' && payment.vendorId) {
    const pending = await tx.vendorSettlement.findFirst({
      where: { vendorId: payment.vendorId, paymentStatus: { not: 'paid' } },
      orderBy: [{ monthYear: 'desc' }, { updatedAt: 'desc' }],
    });
    if (pending) {
      const row = await tx.vendorSettlement.update({
        where: { id: pending.id },
        data: {
          paymentStatus: 'paid',
          paymentDate: new Date().toISOString().slice(0, 10),
          paymentRef:
            payment.referenceNumber || `VND-TRF-${Date.now().toString().slice(-4)}`,
        },
      });
      routed.settlement = mapDbVendorSettlementToApi(row);
    }
  }

  return routed;
}

dailyPaymentsRouter.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'daily_payments')) return sendForbidden(res);
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const rows = await prisma.dailyPaymentEntry.findMany({
      where:
        from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : undefined,
      orderBy: [{ date: 'desc' }],
    });
    const payments = rows.map(mapDbDailyPaymentToApi);
    const byDate = new Map<string, number>();
    const byCategory = new Map<string, number>();
    let total = 0;
    for (const p of payments) {
      total += p.amount;
      byDate.set(p.date, (byDate.get(p.date) || 0) + p.amount);
      byCategory.set(p.category, (byCategory.get(p.category) || 0) + p.amount);
    }
    return sendSuccess(res, {
      summary: {
        total,
        count: payments.length,
        byDate: [...byDate.entries()].map(([date, amount]) => ({ date, amount })),
        byCategory: [...byCategory.entries()].map(([category, amount]) => ({
          category,
          amount,
        })),
      },
    });
  } catch (err) {
    console.error('GET /api/daily-payments/summary:', err);
    return sendError(res, 500, 'Could not load daily payments summary.');
  }
});

dailyPaymentsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'daily_payments')) return sendForbidden(res);
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const rows = await prisma.dailyPaymentEntry.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(driverId ? { driverId } : {}),
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
    return sendSuccess(res, { payments: rows.map(mapDbDailyPaymentToApi) });
  } catch (err) {
    console.error('GET /api/daily-payments:', err);
    return sendError(res, 500, 'Could not load daily payments.');
  }
});

dailyPaymentsRouter.post('/batch', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'daily_payments')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.payments)
      ? body.payments
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide payments array.');

    const result = await prisma.$transaction(async (tx) => {
      const payments = [];
      const routedAll = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = dailyPaymentDataFromBody(raw);
        if (!data.date || !(data.amount > 0) || !data.payeeName) continue;
        if (!data.autoRoutedTo) data.autoRoutedTo = resolveAutoRoutedTo(data.category);
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        const row = await tx.dailyPaymentEntry.create({
          data: id ? { id, ...data } : data,
        });
        const payment = mapDbDailyPaymentToApi(row);
        const routed = await applyDailyPaymentRouting(tx, payment);
        payments.push(payment);
        routedAll.push(routed);
      }
      return { payments, routed: routedAll };
    });

    return sendSuccess(
      res,
      { payments: result.payments, routed: result.routed, created: result.payments.length },
      201
    );
  } catch (err) {
    console.error('POST /api/daily-payments/batch:', err);
    return sendError(res, 500, 'Daily payment batch failed.');
  }
});

dailyPaymentsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'daily_payments')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.payments)
      ? body.payments
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide payments array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = dailyPaymentDataFromBody(raw);
        if (!data.date || !(data.amount > 0)) continue;
        if (!data.autoRoutedTo) data.autoRoutedTo = resolveAutoRoutedTo(data.category);
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.dailyPaymentEntry.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbDailyPaymentToApi(row));
        } catch {
          if (id) {
            const existing = await tx.dailyPaymentEntry.findUnique({ where: { id } });
            if (existing) out.push(mapDbDailyPaymentToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { payments: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/daily-payments/bulk-import:', err);
    return sendError(res, 500, 'Daily payment bulk import failed.');
  }
});

dailyPaymentsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'daily_payments')) return sendForbidden(res);
    const row = await prisma.dailyPaymentEntry.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Daily payment not found.');
    return sendSuccess(res, { payment: mapDbDailyPaymentToApi(row) });
  } catch (err) {
    console.error('GET /api/daily-payments/:id:', err);
    return sendError(res, 500, 'Could not load daily payment.');
  }
});

dailyPaymentsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'daily_payments')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = dailyPaymentDataFromBody(body);
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!(data.amount > 0)) return sendBadRequest(res, 'amount must be greater than 0.');
    if (!data.payeeName) return sendBadRequest(res, 'payeeName is required.');
    if (!data.autoRoutedTo) data.autoRoutedTo = resolveAutoRoutedTo(data.category);

    const skipRouting = body.skipRouting === true;
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.dailyPaymentEntry.create({
        data: id ? { id, ...data } : data,
      });
      const payment = mapDbDailyPaymentToApi(row);
      const routed = skipRouting ? {} : await applyDailyPaymentRouting(tx, payment);
      return { payment, routed };
    });

    return sendSuccess(res, result, 201);
  } catch (err) {
    console.error('POST /api/daily-payments:', err);
    return sendError(res, 500, 'Could not create daily payment.');
  }
});

dailyPaymentsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'daily_payments')) return sendForbidden(res);
    const existing = await prisma.dailyPaymentEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Daily payment not found.');
    const data = dailyPaymentDataFromBody({
      ...existing,
      ...(req.body ?? {}),
    } as Record<string, unknown>);
    if (!data.date || !(data.amount > 0) || !data.payeeName) {
      return sendBadRequest(res, 'date, amount and payeeName are required.');
    }
    if (!data.autoRoutedTo) data.autoRoutedTo = resolveAutoRoutedTo(data.category);
    const row = await prisma.dailyPaymentEntry.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { payment: mapDbDailyPaymentToApi(row) });
  } catch (err) {
    console.error('PUT /api/daily-payments/:id:', err);
    return sendError(res, 500, 'Could not update daily payment.');
  }
});

dailyPaymentsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'daily_payments')) return sendForbidden(res);
    const existing = await prisma.dailyPaymentEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Daily payment not found.');
    await prisma.dailyPaymentEntry.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/daily-payments/:id:', err);
    return sendError(res, 500, 'Could not delete daily payment.');
  }
});
