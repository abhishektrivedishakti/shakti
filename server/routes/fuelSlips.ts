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
  fuelRecordDataFromBody,
  fuelSlipDataFromBody,
  mapDbFuelRecordToApi,
  mapDbFuelSlipToApi,
  markFilledPatchFromBody,
} from '../lib/fuelMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const fuelSlipsRouter = Router();

fuelSlipsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const pumpVendorId =
      typeof req.query.pumpVendorId === 'string' ? req.query.pumpVendorId.trim() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';

    const rows = await prisma.fuelSlip.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(vehicleId ? { vehicleId } : {}),
        ...(pumpVendorId ? { pumpVendorId } : {}),
        ...(from || to
          ? {
              issueDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ issueDate: 'desc' }, { updatedAt: 'desc' }],
    });
    return sendSuccess(res, { slips: rows.map(mapDbFuelSlipToApi) });
  } catch (err) {
    console.error('GET /api/fuel-slips:', err);
    return sendError(res, 500, 'Could not load fuel slips.');
  }
});

fuelSlipsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.slips)
      ? body.slips
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide slips array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = fuelSlipDataFromBody(raw);
        if (!data.slipNumber || !data.vehicleId || !data.pumpVendorId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.fuelSlip.create({ data: id ? { id, ...data } : data });
          out.push(mapDbFuelSlipToApi(row));
        } catch {
          if (id) {
            const existing = await tx.fuelSlip.findUnique({ where: { id } });
            if (existing) out.push(mapDbFuelSlipToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { slips: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/fuel-slips/bulk-import:', err);
    return sendError(res, 500, 'Fuel slip bulk import failed.');
  }
});

fuelSlipsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager')) return sendForbidden(res);
    const row = await prisma.fuelSlip.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Fuel slip not found.');
    return sendSuccess(res, { slip: mapDbFuelSlipToApi(row) });
  } catch (err) {
    console.error('GET /api/fuel-slips/:id:', err);
    return sendError(res, 500, 'Could not load fuel slip.');
  }
});

fuelSlipsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelSlipDataFromBody(body);
    if (!data.slipNumber) return sendBadRequest(res, 'slipNumber is required.');
    if (!data.vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    if (!data.pumpVendorId) return sendBadRequest(res, 'pumpVendorId is required.');
    if (!data.issueDate) data.issueDate = new Date().toISOString().slice(0, 10);
    if (!data.status) data.status = 'issued';

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.fuelSlip.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Slip with this id already exists. Use PUT to update.');
    }

    const row = await prisma.fuelSlip.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { slip: mapDbFuelSlipToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/fuel-slips:', err);
    return sendError(res, 500, 'Could not issue fuel slip.');
  }
});

fuelSlipsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelSlip.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel slip not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = fuelSlipDataFromBody({ ...mapDbFuelSlipToApi(existing), ...body });
    if (!data.slipNumber || !data.vehicleId || !data.pumpVendorId) {
      return sendBadRequest(res, 'slipNumber, vehicleId and pumpVendorId are required.');
    }

    const row = await prisma.fuelSlip.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { slip: mapDbFuelSlipToApi(row) });
  } catch (err) {
    console.error('PUT /api/fuel-slips/:id:', err);
    return sendError(res, 500, 'Could not update fuel slip.');
  }
});

fuelSlipsRouter.patch('/:id/mark-filled', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelSlip.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel slip not found.');
    if (existing.status === 'cancelled') {
      return sendBadRequest(res, 'Cancelled slips cannot be marked filled.');
    }
    if (existing.status === 'billed') {
      return sendBadRequest(res, 'Billed slips cannot be re-filled.');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch = markFilledPatchFromBody(body);
    const liters = patch.actualLiters ?? existing.actualLiters ?? 0;
    const rate = patch.ratePerLiter ?? existing.ratePerLiter ?? 0;
    const total =
      patch.totalAmount ??
      existing.totalAmount ??
      Math.round(liters * rate * 100) / 100;

    const row = await prisma.fuelSlip.update({
      where: { id: req.params.id },
      data: {
        status: 'filled',
        fillDate: patch.fillDate,
        fillTime: patch.fillTime,
        actualLiters: liters,
        ratePerLiter: rate,
        totalAmount: total,
        closingOdometerKm: patch.closingOdometerKm,
        pumpReceiptNumber: patch.pumpReceiptNumber,
        notes: patch.notes ?? existing.notes,
      },
    });

    let fuelRecord = null;
    let vehicle = null;
    if (patch.createFuelRecord) {
      const recordBody = {
        date: patch.fillDate,
        vehicleId: row.vehicleId,
        vehicleNumber: row.vehicleNumber,
        driverId: row.driverId,
        driverName: row.driverName,
        mode: 'slip',
        liters,
        ratePerLiter: rate,
        totalAmount: total,
        odometerKm: patch.closingOdometerKm ?? row.openingOdometerKm ?? 0,
        fuelType: row.fuelType,
        fuelStation: row.pumpVendorName,
        receiptNumber: patch.pumpReceiptNumber || row.slipNumber,
        fullTank: row.authorizedQuantityType === 'full_tank',
        notes: patch.notes || `From slip ${row.slipNumber}`,
        fuelSlipId: row.id,
        pumpVendorId: row.pumpVendorId,
        recordedBy: req.authUser?.name,
      };
      const data = fuelRecordDataFromBody(recordBody);
      const created = await prisma.fuelRecord.create({ data });
      fuelRecord = mapDbFuelRecordToApi(created);

      if (data.odometerKm > 0) {
        const veh = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
        if (veh && data.odometerKm > veh.currentOdometer) {
          vehicle = mapDbVehicleToApi(
            await prisma.vehicle.update({
              where: { id: veh.id },
              data: { currentOdometer: data.odometerKm },
            })
          );
        }
      }
    }

    return sendSuccess(res, {
      slip: mapDbFuelSlipToApi(row),
      fuelRecord,
      vehicle,
    });
  } catch (err) {
    console.error('PATCH /api/fuel-slips/:id/mark-filled:', err);
    return sendError(res, 500, 'Could not mark fuel slip filled.');
  }
});

fuelSlipsRouter.patch('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelSlip.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel slip not found.');
    if (existing.status === 'billed') {
      return sendBadRequest(res, 'Billed slips cannot be cancelled.');
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const notes =
      typeof body.notes === 'string' && body.notes.trim()
        ? body.notes.trim()
        : existing.notes || 'Cancelled';

    const row = await prisma.fuelSlip.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', notes },
    });
    return sendSuccess(res, { slip: mapDbFuelSlipToApi(row) });
  } catch (err) {
    console.error('PATCH /api/fuel-slips/:id/cancel:', err);
    return sendError(res, 500, 'Could not cancel fuel slip.');
  }
});

fuelSlipsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'fuel_manager')) return sendForbidden(res);
    const existing = await prisma.fuelSlip.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Fuel slip not found.');
    if (existing.status === 'billed') {
      return sendBadRequest(res, 'Billed slips cannot be deleted. Cancel the vendor bill first.');
    }
    await prisma.fuelSlip.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/fuel-slips/:id:', err);
    return sendError(res, 500, 'Could not delete fuel slip.');
  }
});
