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
  buildPayrollEntryForDriver,
  complianceSummaryFromEntries,
  mapDbStatutoryToApi,
  statutoryDataFromBody,
} from '../lib/statutoryMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { str } from '../lib/bodyParsers';

export const statutoryPayrollRouter = Router();

statutoryPayrollRouter.get(
  '/compliance-summary',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!canViewModule(req, 'statutory_payroll')) return sendForbidden(res);
      const monthYear =
        typeof req.query.monthYear === 'string' ? req.query.monthYear.trim() : '';
      const rows = await prisma.statutoryPayrollEntry.findMany({
        where: monthYear ? { monthYear } : undefined,
        orderBy: [{ monthYear: 'desc' }],
      });
      const entries = rows.map(mapDbStatutoryToApi);
      return sendSuccess(res, {
        summary: complianceSummaryFromEntries(entries),
        monthYear: monthYear || null,
      });
    } catch (err) {
      console.error('GET /api/statutory-payroll/compliance-summary:', err);
      return sendError(res, 500, 'Could not load compliance summary.');
    }
  }
);

statutoryPayrollRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'statutory_payroll')) return sendForbidden(res);
    const monthYear =
      typeof req.query.monthYear === 'string' ? req.query.monthYear.trim() : '';
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const rows = await prisma.statutoryPayrollEntry.findMany({
      where: {
        ...(monthYear ? { monthYear } : {}),
        ...(driverId ? { driverId } : {}),
      },
      orderBy: [{ monthYear: 'desc' }, { driverName: 'asc' }],
    });
    return sendSuccess(res, { entries: rows.map(mapDbStatutoryToApi) });
  } catch (err) {
    console.error('GET /api/statutory-payroll:', err);
    return sendError(res, 500, 'Could not load statutory payroll.');
  }
});

statutoryPayrollRouter.post(
  '/generate-month',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (!canEditModule(req, 'statutory_payroll')) return sendForbidden(res);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const monthYear = str(body.monthYear);
      if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
        return sendBadRequest(res, 'monthYear is required as YYYY-MM.');
      }

      const drivers = await prisma.driver.findMany({
        where: {
          OR: [
            { employmentType: 'company_statutory' },
            { isEpfApplicable: true },
            { isEsicApplicable: true },
          ],
          status: { not: 'released' },
        },
      });

      const vehicles = await prisma.vehicle.findMany();
      const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
      const tenders = await prisma.tender.findMany();
      const tenderById = new Map(tenders.map((t) => [t.id, t]));

      const created = [];
      const skipped: string[] = [];

      for (const drv of drivers) {
        const existing = await prisma.statutoryPayrollEntry.findUnique({
          where: { driverId_monthYear: { driverId: drv.id, monthYear } },
        });
        if (existing) {
          skipped.push(drv.id);
          continue;
        }

        const veh = drv.currentVehicleId ? vehicleById.get(drv.currentVehicleId) : undefined;
        const tender = veh?.tenderId ? tenderById.get(veh.tenderId) : undefined;
        const built = buildPayrollEntryForDriver({
          driver: {
            id: drv.id,
            name: drv.name,
            phone: drv.phone,
            uanNumber: drv.uanNumber,
            esicIpNumber: drv.esicIpNumber,
            minimumWageBasic: drv.minimumWageBasic,
            vda: drv.vda,
            hra: drv.hra,
            monthlySalary: drv.monthlySalary,
          },
          monthYear,
          tenderId: tender?.id || veh?.tenderId || '',
          tenderName: tender?.departmentName || tender?.tenderNumber || '',
          vehicleNumber: veh?.vehicleNumber || '',
        });

        const row = await prisma.statutoryPayrollEntry.create({ data: built });
        created.push(mapDbStatutoryToApi(row));
      }

      return sendSuccess(
        res,
        {
          entries: created,
          generated: created.length,
          skipped: skipped.length,
          monthYear,
        },
        201
      );
    } catch (err) {
      console.error('POST /api/statutory-payroll/generate-month:', err);
      return sendError(res, 500, 'Could not generate monthly payroll.');
    }
  }
);

statutoryPayrollRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'statutory_payroll')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.entries)
      ? body.entries
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide entries array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = statutoryDataFromBody(raw);
        if (!data.driverId || !data.monthYear) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.statutoryPayrollEntry.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbStatutoryToApi(row));
        } catch {
          if (id) {
            const existing = await tx.statutoryPayrollEntry.findUnique({ where: { id } });
            if (existing) out.push(mapDbStatutoryToApi(existing));
          } else {
            const existing = await tx.statutoryPayrollEntry.findUnique({
              where: {
                driverId_monthYear: { driverId: data.driverId, monthYear: data.monthYear },
              },
            });
            if (existing) out.push(mapDbStatutoryToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { entries: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/statutory-payroll/bulk-import:', err);
    return sendError(res, 500, 'Statutory payroll bulk import failed.');
  }
});

statutoryPayrollRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'statutory_payroll')) return sendForbidden(res);
    const row = await prisma.statutoryPayrollEntry.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Payroll entry not found.');
    return sendSuccess(res, { entry: mapDbStatutoryToApi(row) });
  } catch (err) {
    console.error('GET /api/statutory-payroll/:id:', err);
    return sendError(res, 500, 'Could not load payroll entry.');
  }
});

statutoryPayrollRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'statutory_payroll')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = statutoryDataFromBody(body);
    if (!data.driverId) return sendBadRequest(res, 'driverId is required.');
    if (!data.monthYear || !/^\d{4}-\d{2}$/.test(data.monthYear)) {
      return sendBadRequest(res, 'monthYear is required as YYYY-MM.');
    }
    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    const row = await prisma.statutoryPayrollEntry.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { entry: mapDbStatutoryToApi(row) }, 201);
  } catch (err: unknown) {
    const code =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: string }).code)
        : '';
    if (code === 'P2002') {
      return sendBadRequest(res, 'Payroll entry already exists for this driver and month.');
    }
    console.error('POST /api/statutory-payroll:', err);
    return sendError(res, 500, 'Could not create payroll entry.');
  }
});

statutoryPayrollRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'statutory_payroll')) return sendForbidden(res);
    const existing = await prisma.statutoryPayrollEntry.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Payroll entry not found.');
    const data = statutoryDataFromBody({
      ...existing,
      ...(req.body ?? {}),
    } as Record<string, unknown>);
    if (!data.driverId || !data.monthYear) {
      return sendBadRequest(res, 'driverId and monthYear are required.');
    }
    const row = await prisma.statutoryPayrollEntry.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { entry: mapDbStatutoryToApi(row) });
  } catch (err) {
    console.error('PUT /api/statutory-payroll/:id:', err);
    return sendError(res, 500, 'Could not update payroll entry.');
  }
});

statutoryPayrollRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'statutory_payroll')) return sendForbidden(res);
    const existing = await prisma.statutoryPayrollEntry.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return sendNotFound(res, 'Payroll entry not found.');
    await prisma.statutoryPayrollEntry.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/statutory-payroll/:id:', err);
    return sendError(res, 500, 'Could not delete payroll entry.');
  }
});
