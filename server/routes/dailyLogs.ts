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
import { dailyLogDataFromBody, mapDbDailyLogToApi } from '../lib/dailyLogMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { str } from '../lib/bodyParsers';

export const dailyLogsRouter = Router();

dailyLogsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'logbook')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const tenderId = typeof req.query.tenderId === 'string' ? req.query.tenderId.trim() : '';
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const verified =
      typeof req.query.verified === 'string' ? req.query.verified.trim().toLowerCase() : '';

    const rows = await prisma.dailyLogEntry.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(tenderId ? { tenderId } : {}),
        ...(driverId ? { driverId } : {}),
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
        ...(verified === 'true'
          ? { isVerifiedByOfficer: true }
          : verified === 'false'
            ? { isVerifiedByOfficer: false }
            : {}),
      },
      orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { logs: rows.map(mapDbDailyLogToApi) });
  } catch (err) {
    console.error('GET /api/daily-logs:', err);
    return sendError(res, 500, 'Could not load daily logs.');
  }
});

dailyLogsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'logbook')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.logs) ? body.logs : Array.isArray(body.items) ? body.items : null;
    if (!items?.length) return sendBadRequest(res, 'Provide logs array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = dailyLogDataFromBody(raw);
        if (!data.date || !data.vehicleId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.dailyLogEntry.create({ data: id ? { id, ...data } : data });
          out.push(mapDbDailyLogToApi(row));
        } catch {
          if (id) {
            const existing = await tx.dailyLogEntry.findUnique({ where: { id } });
            if (existing) out.push(mapDbDailyLogToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { logs: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/daily-logs/bulk-import:', err);
    return sendError(res, 500, 'Daily log bulk import failed.');
  }
});

dailyLogsRouter.post('/from-range/preview-bill', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'logbook') && !canViewModule(req, 'billing')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const tenderId = str(body.tenderId);
    const vehicleId = str(body.vehicleId);
    const from = str(body.from || body.fromDate);
    const to = str(body.to || body.toDate);
    if (!from || !to) return sendBadRequest(res, 'from and to dates are required (YYYY-MM-DD).');

    const logs = await prisma.dailyLogEntry.findMany({
      where: {
        date: { gte: from, lte: to },
        ...(tenderId ? { tenderId } : {}),
        ...(vehicleId ? { vehicleId } : {}),
      },
      orderBy: { date: 'asc' },
    });

    const mapped = logs.map(mapDbDailyLogToApi);
    const totalKm = mapped.reduce((s, l) => s + (l.totalKm || 0), 0);
    const totalHours = mapped.reduce((s, l) => s + (l.totalHours || 0), 0);
    const totalToll = mapped.reduce((s, l) => s + (l.tollParkingCost || 0), 0);
    const totalDa = mapped.reduce((s, l) => s + (l.driverDaNightHalt || 0), 0);
    const verifiedCount = mapped.filter((l) => l.isVerifiedByOfficer).length;

    const byVehicle = new Map<
      string,
      { vehicleId: string; vehicleNumber: string; days: number; totalKm: number; totalHours: number }
    >();
    for (const l of mapped) {
      const cur = byVehicle.get(l.vehicleId) || {
        vehicleId: l.vehicleId,
        vehicleNumber: l.vehicleNumber,
        days: 0,
        totalKm: 0,
        totalHours: 0,
      };
      cur.days += 1;
      cur.totalKm += l.totalKm || 0;
      cur.totalHours += l.totalHours || 0;
      byVehicle.set(l.vehicleId, cur);
    }

    return sendSuccess(res, {
      preview: {
        from,
        to,
        tenderId: tenderId || null,
        vehicleId: vehicleId || null,
        logCount: mapped.length,
        verifiedCount,
        unverifiedCount: mapped.length - verifiedCount,
        totals: {
          totalKm,
          totalHours,
          tollParkingCost: totalToll,
          driverDaNightHalt: totalDa,
        },
        byVehicle: Array.from(byVehicle.values()),
        note: 'Preview only — use POST /api/bills/generate-from-logs to create a bill.',
      },
      logs: mapped,
    });
  } catch (err) {
    console.error('POST /api/daily-logs/from-range/preview-bill:', err);
    return sendError(res, 500, 'Could not preview bill from logs.');
  }
});

dailyLogsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'logbook')) return sendForbidden(res);
    const row = await prisma.dailyLogEntry.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Daily log not found.');
    return sendSuccess(res, { log: mapDbDailyLogToApi(row) });
  } catch (err) {
    console.error('GET /api/daily-logs/:id:', err);
    return sendError(res, 500, 'Could not load daily log.');
  }
});

dailyLogsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'logbook')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = dailyLogDataFromBody(body);
    if (!data.date) return sendBadRequest(res, 'date is required.');
    if (!data.vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    if (data.closingKm < data.openingKm) {
      return sendBadRequest(res, 'closingKm cannot be less than openingKm.');
    }

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.dailyLogEntry.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Log with this id already exists. Use PUT to update.');
    }

    const row = await prisma.dailyLogEntry.create({ data: id ? { id, ...data } : data });

    let vehicle = null;
    const veh = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (veh && data.closingKm > veh.currentOdometer) {
      vehicle = mapDbVehicleToApi(
        await prisma.vehicle.update({
          where: { id: veh.id },
          data: { currentOdometer: data.closingKm },
        })
      );
    }

    return sendSuccess(res, { log: mapDbDailyLogToApi(row), vehicle }, 201);
  } catch (err) {
    console.error('POST /api/daily-logs:', err);
    return sendError(res, 500, 'Could not create daily log.');
  }
});

dailyLogsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'logbook')) return sendForbidden(res);
    const existing = await prisma.dailyLogEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Daily log not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...mapDbDailyLogToApi(existing), ...body };
    // Recalculate KM when odometer bounds change unless client sent totalKm explicitly
    if (
      (body.openingKm !== undefined || body.closingKm !== undefined) &&
      body.totalKm === undefined
    ) {
      delete merged.totalKm;
    }
    const data = dailyLogDataFromBody(merged);
    if (!data.date || !data.vehicleId) return sendBadRequest(res, 'date and vehicleId are required.');

    const row = await prisma.dailyLogEntry.update({ where: { id: req.params.id }, data });

    let vehicle = null;
    const veh = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (veh && data.closingKm > veh.currentOdometer) {
      vehicle = mapDbVehicleToApi(
        await prisma.vehicle.update({
          where: { id: veh.id },
          data: { currentOdometer: data.closingKm },
        })
      );
    }

    return sendSuccess(res, { log: mapDbDailyLogToApi(row), vehicle });
  } catch (err) {
    console.error('PUT /api/daily-logs/:id:', err);
    return sendError(res, 500, 'Could not update daily log.');
  }
});

dailyLogsRouter.patch('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'logbook')) return sendForbidden(res);
    const existing = await prisma.dailyLogEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Daily log not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const nextVerified =
      typeof body.isVerifiedByOfficer === 'boolean'
        ? body.isVerifiedByOfficer
        : !existing.isVerifiedByOfficer;
    const officerRemarks =
      typeof body.officerRemarks === 'string' ? body.officerRemarks.trim() : existing.officerRemarks;

    const row = await prisma.dailyLogEntry.update({
      where: { id: req.params.id },
      data: {
        isVerifiedByOfficer: nextVerified,
        officerRemarks: officerRemarks || null,
      },
    });
    return sendSuccess(res, { log: mapDbDailyLogToApi(row) });
  } catch (err) {
    console.error('PATCH /api/daily-logs/:id/verify:', err);
    return sendError(res, 500, 'Could not verify daily log.');
  }
});

dailyLogsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'logbook')) return sendForbidden(res);
    const existing = await prisma.dailyLogEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Daily log not found.');
    await prisma.dailyLogEntry.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/daily-logs/:id:', err);
    return sendError(res, 500, 'Could not delete daily log.');
  }
});
