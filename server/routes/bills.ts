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
  DEFAULT_BILL_SERIES,
  PAYMENT_STATUSES,
  calculateBillAmounts,
  formatBillNumber,
  mapDbBillSeriesToApi,
  mapDbMonthlyBillToApi,
  monthlyBillDataFromBody,
} from '../lib/billMapper';
import { mapDbTenderToApi } from '../lib/tenderMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import { num, optStr, str } from '../lib/bodyParsers';
import { withBulkTransaction } from '../lib/batchWork';

export const billsRouter = Router();

async function ensureBillSeries() {
  const existing = await prisma.billSeriesConfig.findUnique({ where: { id: 'default' } });
  if (existing) return existing;
  return prisma.billSeriesConfig.create({
    data: { id: 'default', ...DEFAULT_BILL_SERIES },
  });
}

billsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'billing')) return sendForbidden(res);
    const tenderId = typeof req.query.tenderId === 'string' ? req.query.tenderId.trim() : '';
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const monthYear = typeof req.query.monthYear === 'string' ? req.query.monthYear.trim() : '';
    const paymentStatus =
      typeof req.query.paymentStatus === 'string' ? req.query.paymentStatus.trim() : '';

    const rows = await prisma.monthlyBill.findMany({
      where: {
        ...(tenderId ? { tenderId } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(monthYear ? { monthYear } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      orderBy: [{ billDate: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { bills: rows.map(mapDbMonthlyBillToApi) });
  } catch (err) {
    console.error('GET /api/bills:', err);
    return sendError(res, 500, 'Could not load bills.');
  }
});

billsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
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
        const data = monthlyBillDataFromBody(raw);
        if (!data.billNumber || !data.tenderId || !data.vehicleId || !data.monthYear) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.monthlyBill.create({ data: id ? { id, ...data } : data });
          out.push(mapDbMonthlyBillToApi(row));
        } catch {
          if (id) {
            const existing = await tx.monthlyBill.findUnique({ where: { id } });
            if (existing) out.push(mapDbMonthlyBillToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { bills: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/bills/bulk-import:', err);
    return sendError(res, 500, 'Bill bulk import failed.');
  }
});

billsRouter.post('/generate-from-logs', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vehicleId = str(body.vehicleId);
    const monthYear = str(body.monthYear);
    if (!vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return sendBadRequest(res, 'monthYear is required as YYYY-MM.');
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return sendNotFound(res, 'Vehicle not found.');
    const tender = await prisma.tender.findUnique({ where: { id: vehicle.tenderId } });
    if (!tender) return sendNotFound(res, 'Tender not found for vehicle.');

    const officer = vehicle.assignedOfficerId
      ? await prisma.officer.findUnique({ where: { id: vehicle.assignedOfficerId } })
      : null;

    const logs = await prisma.dailyLogEntry.findMany({
      where: {
        vehicleId,
        date: { startsWith: monthYear },
      },
      orderBy: { date: 'asc' },
    });

    const amounts = calculateBillAmounts({
      tender: {
        baseMonthlyRate: tender.baseMonthlyRate,
        includedKms: tender.includedKms,
        includedHours: tender.includedHours,
        extraKmRate: tender.extraKmRate,
        extraHourRate: tender.extraHourRate,
        nightHaltRate: tender.nightHaltRate,
        tollTerms: tender.tollTerms,
        packages: tender.packages,
      },
      vehicle: {
        tenderPackageId: vehicle.tenderPackageId,
        vehicleType: vehicle.vehicleType,
      },
      logs,
      penaltyDeductions: num(body.penaltyDeductions),
      gstPercent: body.gstPercent !== undefined ? num(body.gstPercent, 12) : 12,
      tdsPercent: body.tdsPercent !== undefined ? num(body.tdsPercent, 2) : 2,
    });

    const due = new Date();
    due.setDate(due.getDate() + (tender.paymentTermsDays || 30));
    const customBillNumber = optStr(body.billNumber);
    const advanceSeries = body.advanceSeries !== false;

    let billNumber = customBillNumber || '';
    let seriesApi = null;

    if (!billNumber || advanceSeries) {
      const reserved = await prisma.$transaction(async (tx) => {
        let series = await tx.billSeriesConfig.findUnique({ where: { id: 'default' } });
        if (!series) {
          series = await tx.billSeriesConfig.create({
            data: { id: 'default', ...DEFAULT_BILL_SERIES },
          });
        }
        const config = mapDbBillSeriesToApi(series);
        const generated = formatBillNumber(config, {
          sequenceNum: series.currentNumber,
          monthYear,
          tender: { billSeriesPrefix: tender.billSeriesPrefix ?? undefined },
          overridePrefix: optStr(body.overridePrefix) || undefined,
        });
        const updated = await tx.billSeriesConfig.update({
          where: { id: 'default' },
          data: { currentNumber: series.currentNumber + 1 },
        });
        return { generated, series: mapDbBillSeriesToApi(updated) };
      });
      if (!billNumber) billNumber = reserved.generated;
      seriesApi = reserved.series;
    }

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.monthlyBill.create({
      data: {
        ...(id ? { id } : {}),
        billNumber,
        tenderId: tender.id,
        tenderName: tender.departmentName,
        departmentName: tender.departmentName,
        officerName: officer?.name || 'Assigned Officer',
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        monthYear,
        billDate: optStr(body.billDate) || new Date().toISOString().slice(0, 10),
        dueDate: optStr(body.dueDate) || due.toISOString().slice(0, 10),
        ...amounts,
        penaltyRemarks: optStr(body.penaltyRemarks),
        paymentStatus: 'draft',
      },
    });

    return sendSuccess(
      res,
      {
        bill: mapDbMonthlyBillToApi(row),
        series: seriesApi,
        logCount: logs.length,
      },
      201
    );
  } catch (err) {
    console.error('POST /api/bills/generate-from-logs:', err);
    return sendError(res, 500, 'Could not generate bill from logs.');
  }
});

billsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'billing')) return sendForbidden(res);
    const row = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Bill not found.');
    return sendSuccess(res, { bill: mapDbMonthlyBillToApi(row) });
  } catch (err) {
    console.error('GET /api/bills/:id:', err);
    return sendError(res, 500, 'Could not load bill.');
  }
});

billsRouter.get('/:id/print', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'billing')) return sendForbidden(res);
    const row = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Bill not found.');

    const bill = mapDbMonthlyBillToApi(row);
    const [tender, vehicle, officer] = await Promise.all([
      prisma.tender.findUnique({ where: { id: row.tenderId } }),
      prisma.vehicle.findUnique({ where: { id: row.vehicleId } }),
      row.officerName
        ? prisma.officer.findFirst({
            where: {
              OR: [
                { name: row.officerName, tenderId: row.tenderId },
                { assignedVehicleId: row.vehicleId },
              ],
            },
          })
        : null,
    ]);

    return sendSuccess(res, {
      print: {
        bill,
        tender: tender ? mapDbTenderToApi(tender) : null,
        vehicle: vehicle ? mapDbVehicleToApi(vehicle) : null,
        officer: officer
          ? {
              id: officer.id,
              name: officer.name,
              designation: officer.designation,
              department: officer.department,
              mobile: officer.mobile,
            }
          : null,
        companyName: 'Shakti Travels and Tours',
        printedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('GET /api/bills/:id/print:', err);
    return sendError(res, 500, 'Could not build printable bill.');
  }
});

billsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = monthlyBillDataFromBody(body);
    if (!data.billNumber) return sendBadRequest(res, 'billNumber is required.');
    if (!data.tenderId) return sendBadRequest(res, 'tenderId is required.');
    if (!data.vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    if (!data.monthYear) return sendBadRequest(res, 'monthYear is required.');

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.monthlyBill.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Bill with this id already exists. Use PUT to update.');
    }

    const advanceSeries = body.advanceSeries === true;
    let seriesApi = null;
    if (advanceSeries) {
      await ensureBillSeries();
      const updated = await prisma.billSeriesConfig.update({
        where: { id: 'default' },
        data: { currentNumber: { increment: 1 } },
      });
      seriesApi = mapDbBillSeriesToApi(updated);
    }

    const row = await prisma.monthlyBill.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { bill: mapDbMonthlyBillToApi(row), series: seriesApi }, 201);
  } catch (err) {
    console.error('POST /api/bills:', err);
    return sendError(res, 500, 'Could not create bill.');
  }
});

billsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const existing = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Bill not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = monthlyBillDataFromBody({ ...mapDbMonthlyBillToApi(existing), ...body });
    if (!data.billNumber || !data.tenderId || !data.vehicleId || !data.monthYear) {
      return sendBadRequest(res, 'billNumber, tenderId, vehicleId and monthYear are required.');
    }

    const row = await prisma.monthlyBill.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { bill: mapDbMonthlyBillToApi(row) });
  } catch (err) {
    console.error('PUT /api/bills/:id:', err);
    return sendError(res, 500, 'Could not update bill.');
  }
});

billsRouter.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const existing = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Bill not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = str(body.status || body.paymentStatus);
    if (!PAYMENT_STATUSES.includes(status as (typeof PAYMENT_STATUSES)[number])) {
      return sendBadRequest(
        res,
        `status must be one of: ${PAYMENT_STATUSES.join(', ')}`
      );
    }

    const billNumber = optStr(body.billNumber);
    const paymentRemarks =
      body.paymentRemarks !== undefined
        ? optStr(body.paymentRemarks) ?? optStr(body.remarks)
        : undefined;
    const voucherNumber =
      body.voucherNumber !== undefined
        ? optStr(body.voucherNumber) ?? optStr(body.voucher)
        : undefined;

    const row = await prisma.monthlyBill.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: status,
        ...(billNumber ? { billNumber } : {}),
        ...(paymentRemarks !== undefined ? { paymentRemarks } : {}),
        ...(voucherNumber !== undefined ? { voucherNumber } : {}),
        ...(status === 'paid' && !existing.paymentReceivedDate
          ? {
              paymentReceivedDate:
                optStr(body.paymentReceivedDate) || new Date().toISOString().slice(0, 10),
            }
          : {}),
      },
    });
    return sendSuccess(res, { bill: mapDbMonthlyBillToApi(row) });
  } catch (err) {
    console.error('PATCH /api/bills/:id/status:', err);
    return sendError(res, 500, 'Could not update bill status.');
  }
});

billsRouter.post('/:id/mark-paid', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const existing = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Bill not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const row = await prisma.monthlyBill.update({
      where: { id: req.params.id },
      data: {
        paymentStatus: 'paid',
        paymentReceivedDate:
          optStr(body.paymentReceivedDate) ||
          optStr(body.date) ||
          existing.paymentReceivedDate ||
          new Date().toISOString().slice(0, 10),
        paymentRemarks: optStr(body.paymentRemarks) ?? optStr(body.remarks) ?? existing.paymentRemarks,
        voucherNumber: optStr(body.voucherNumber) ?? optStr(body.voucher) ?? existing.voucherNumber,
        referenceVoucher:
          optStr(body.referenceVoucher) ?? optStr(body.reference) ?? existing.referenceVoucher,
      },
    });
    return sendSuccess(res, { bill: mapDbMonthlyBillToApi(row) });
  } catch (err) {
    console.error('POST /api/bills/:id/mark-paid:', err);
    return sendError(res, 500, 'Could not mark bill paid.');
  }
});

billsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const existing = await prisma.monthlyBill.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Bill not found.');
    await prisma.monthlyBill.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/bills/:id:', err);
    return sendError(res, 500, 'Could not delete bill.');
  }
});
