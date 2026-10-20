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
import { mapDbPettyCashToApi, pettyCashDataFromBody } from '../lib/pettyCashMapper';
import { mapDbDailyPaymentToApi } from '../lib/dailyPaymentMapper';
import { mapDbFuelRecordToApi } from '../lib/fuelMapper';
import { mapDbMaintenanceToApi } from '../lib/maintenanceMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { optStr, str } from '../lib/bodyParsers';

export const pettyCashRouter = Router();

pettyCashRouter.get('/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'petty_cash')) return sendForbidden(res);
    const staffUserId =
      typeof req.query.staffUserId === 'string' ? req.query.staffUserId.trim() : '';
    const rows = await prisma.pettyCashTransaction.findMany({
      where: staffUserId ? { staffUserId } : undefined,
      orderBy: [{ date: 'asc' }],
    });

    const byStaff = new Map<
      string,
      { staffUserId: string; staffUserName: string; inflow: number; expense: number }
    >();
    for (const row of rows) {
      const cur = byStaff.get(row.staffUserId) || {
        staffUserId: row.staffUserId,
        staffUserName: row.staffUserName,
        inflow: 0,
        expense: 0,
      };
      if (row.type === 'cash_inflow') cur.inflow += row.amount;
      else cur.expense += row.amount;
      byStaff.set(row.staffUserId, cur);
    }

    const balances = [...byStaff.values()].map((b) => ({
      ...b,
      balance: b.inflow - b.expense,
    }));

    return sendSuccess(res, {
      balances,
      balance: staffUserId
        ? balances[0] || {
            staffUserId,
            staffUserName: '',
            inflow: 0,
            expense: 0,
            balance: 0,
          }
        : null,
    });
  } catch (err) {
    console.error('GET /api/petty-cash/balance:', err);
    return sendError(res, 500, 'Could not load petty cash balance.');
  }
});

pettyCashRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'petty_cash')) return sendForbidden(res);
    const staffUserId =
      typeof req.query.staffUserId === 'string' ? req.query.staffUserId.trim() : '';
    const rows = await prisma.pettyCashTransaction.findMany({
      where: staffUserId ? { staffUserId } : undefined,
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { transactions: rows.map(mapDbPettyCashToApi) });
  } catch (err) {
    console.error('GET /api/petty-cash:', err);
    return sendError(res, 500, 'Could not load petty cash transactions.');
  }
});

pettyCashRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'petty_cash')) return sendForbidden(res);
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
        const data = pettyCashDataFromBody(raw);
        if (!data.staffUserId || !data.date || !(data.amount > 0)) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.pettyCashTransaction.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbPettyCashToApi(row));
        } catch {
          if (id) {
            const existing = await tx.pettyCashTransaction.findUnique({ where: { id } });
            if (existing) out.push(mapDbPettyCashToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { transactions: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/petty-cash/bulk-import:', err);
    return sendError(res, 500, 'Petty cash bulk import failed.');
  }
});

pettyCashRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'petty_cash')) return sendForbidden(res);
    const row = await prisma.pettyCashTransaction.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Petty cash transaction not found.');
    return sendSuccess(res, { transaction: mapDbPettyCashToApi(row) });
  } catch (err) {
    console.error('GET /api/petty-cash/:id:', err);
    return sendError(res, 500, 'Could not load petty cash transaction.');
  }
});

pettyCashRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'petty_cash')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = pettyCashDataFromBody(body);
    if (!data.staffUserId) return sendBadRequest(res, 'staffUserId is required.');
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!(data.amount > 0)) return sendBadRequest(res, 'amount must be greater than 0.');

    const skipSideEffects = body.skipSideEffects === true;
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const row = await tx.pettyCashTransaction.create({
        data: id ? { id, ...data } : data,
      });
      const transaction = mapDbPettyCashToApi(row);
      const sideEffects: {
        payment?: ReturnType<typeof mapDbDailyPaymentToApi>;
        fuelRecord?: ReturnType<typeof mapDbFuelRecordToApi>;
        maintenance?: ReturnType<typeof mapDbMaintenanceToApi>;
      } = {};

      if (!skipSideEffects) {
        if (transaction.type === 'cash_inflow') {
          const paymentMode =
            transaction.paymentMode === 'UPI / PhonePe'
              ? 'upi'
              : transaction.paymentMode === 'Card'
                ? 'bank_transfer'
                : 'cash';
          const payRow = await tx.dailyPaymentEntry.create({
            data: {
              date: transaction.date,
              category: 'emergency_expense',
              amount: transaction.amount,
              paymentMode,
              payeeName: transaction.staffUserName,
              payeeType: 'other',
              description: `पेटी कैश अग्रिम (Cash Float to ${transaction.staffUserName}) - ${transaction.notes}`,
              autoRoutedTo: 'Petty Cash / Float',
              recordedBy: transaction.staffUserName,
            },
          });
          sideEffects.payment = mapDbDailyPaymentToApi(payRow);
        }

        if (
          transaction.type === 'cash_expense' &&
          transaction.category === 'fuel_emergency' &&
          transaction.vehicleId &&
          transaction.vehicleNumber
        ) {
          const veh = await tx.vehicle.findUnique({ where: { id: transaction.vehicleId } });
          const driver = veh?.currentDriverId
            ? await tx.driver.findUnique({ where: { id: veh.currentDriverId } })
            : null;
          const approxLiters = Math.max(1, Math.round((transaction.amount / 92) * 10) / 10);
          const fuelRow = await tx.fuelRecord.create({
            data: {
              date: transaction.date,
              vehicleId: transaction.vehicleId,
              vehicleNumber: transaction.vehicleNumber,
              driverId: driver?.id || 'dr-gen',
              driverName: driver?.name || transaction.staffUserName,
              mode: 'slip',
              liters: approxLiters,
              ratePerLiter: 92,
              totalAmount: transaction.amount,
              odometerKm: veh?.currentOdometer || 0,
              fuelType: veh?.fuelType || 'Diesel',
              fuelStation: transaction.payeeOrVendor || 'स्थानीय पेट्रोल पंप (नकद)',
              receiptNumber:
                transaction.billSlipNumber ||
                `PC-SLIP-${Math.floor(100 + Math.random() * 900)}`,
              fullTank: false,
              notes: `[पेटी कैश खर्च द्वारा: ${transaction.staffUserName}] ${transaction.notes}`,
              recordedBy: transaction.staffUserName,
            },
          });
          sideEffects.fuelRecord = mapDbFuelRecordToApi(fuelRow);
        }

        if (
          transaction.type === 'cash_expense' &&
          (transaction.category === 'servicing_puncture' ||
            transaction.category === 'vehicle_accessories') &&
          transaction.vehicleId &&
          transaction.vehicleNumber
        ) {
          const veh = await tx.vehicle.findUnique({ where: { id: transaction.vehicleId } });
          const maintRow = await tx.maintenanceRecord.create({
            data: {
              date: transaction.date,
              vehicleId: transaction.vehicleId,
              vehicleNumber: transaction.vehicleNumber,
              serviceType:
                transaction.category === 'servicing_puncture' ? 'scheduled' : 'other',
              odometerKm: veh?.currentOdometer || 0,
              garageName: transaction.payeeOrVendor || 'स्थानीय वर्कशॉप / एक्सेसरीज दुकान',
              cost: transaction.amount,
              partsReplaced:
                transaction.category === 'vehicle_accessories'
                  ? transaction.notes
                  : 'पंचर / आयल / त्वरित रिपेयर',
              description: `[पेटी कैश खर्च द्वारा: ${transaction.staffUserName}] ${transaction.notes}`,
              invoiceNumber: transaction.billSlipNumber ?? null,
              recordedBy: transaction.staffUserName,
            },
          });
          sideEffects.maintenance = mapDbMaintenanceToApi(maintRow);
        }
      }

      return { transaction, sideEffects };
    });

    return sendSuccess(res, result, 201);
  } catch (err) {
    console.error('POST /api/petty-cash:', err);
    return sendError(res, 500, 'Could not create petty cash transaction.');
  }
});

pettyCashRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'petty_cash')) return sendForbidden(res);
    const existing = await prisma.pettyCashTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Petty cash transaction not found.');
    const data = pettyCashDataFromBody({
      ...existing,
      ...(req.body ?? {}),
    } as Record<string, unknown>);
    if (!data.staffUserId || !data.date || !(data.amount > 0)) {
      return sendBadRequest(res, 'staffUserId, date and amount are required.');
    }
    const row = await prisma.pettyCashTransaction.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { transaction: mapDbPettyCashToApi(row) });
  } catch (err) {
    console.error('PUT /api/petty-cash/:id:', err);
    return sendError(res, 500, 'Could not update petty cash transaction.');
  }
});

pettyCashRouter.patch('/:id/approval', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'petty_cash')) return sendForbidden(res);
    const existing = await prisma.pettyCashTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Petty cash transaction not found.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const approvalStatus = str(body.approvalStatus) || str(body.status);
    if (
      approvalStatus !== 'approved' &&
      approvalStatus !== 'rejected' &&
      approvalStatus !== 'pending_verification'
    ) {
      return sendBadRequest(res, 'approvalStatus must be approved, rejected, or pending_verification.');
    }
    const approvedByAdmin = optStr(body.approvedByAdmin) || req.authUser?.name || null;
    const row = await prisma.pettyCashTransaction.update({
      where: { id: req.params.id },
      data: {
        approvalStatus,
        approvedByAdmin: approvalStatus === 'pending_verification' ? null : approvedByAdmin,
        approvedAt:
          approvalStatus === 'pending_verification'
            ? null
            : new Date().toISOString(),
        reimbursedToStaff:
          body.reimbursedToStaff !== undefined
            ? Boolean(body.reimbursedToStaff)
            : existing.reimbursedToStaff,
      },
    });
    return sendSuccess(res, { transaction: mapDbPettyCashToApi(row) });
  } catch (err) {
    console.error('PATCH /api/petty-cash/:id/approval:', err);
    return sendError(res, 500, 'Could not update approval status.');
  }
});

pettyCashRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'petty_cash')) return sendForbidden(res);
    const existing = await prisma.pettyCashTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Petty cash transaction not found.');
    await prisma.pettyCashTransaction.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/petty-cash/:id:', err);
    return sendError(res, 500, 'Could not delete petty cash transaction.');
  }
});
