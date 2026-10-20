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
import { mapDbOfficerToApi, officerDataFromBody } from '../lib/officerMapper';
import { withBulkTransaction } from '../lib/batchWork';
import { prismaClientErrorMessage } from '../lib/prismaErrors';
import { optStr, str } from '../lib/bodyParsers';

function normalizePhone10(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

export const officersRouter = Router();

officersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const tenderId = typeof req.query.tenderId === 'string' ? req.query.tenderId.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const rows = await prisma.officer.findMany({
      where: {
        ...(tenderId ? { tenderId } : {}),
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { department: { contains: q } },
                { mobile: { contains: q } },
                { officerCode: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, { officers: rows.map(mapDbOfficerToApi) });
  } catch (err) {
    console.error('GET /api/officers:', err);
    return sendError(res, 500, 'Could not load officers.');
  }
});

officersRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.officers) ? body.officers : Array.isArray(body.items) ? body.items : null;
    if (!items?.length) return sendBadRequest(res, 'Provide officers array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = officerDataFromBody(raw);
        if (!data.name || !data.tenderId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.officer.create({ data: id ? { id, ...data } : data });
          out.push(mapDbOfficerToApi(row));
        } catch {
          if (id) {
            const existing = await tx.officer.findUnique({ where: { id } });
            if (existing) out.push(mapDbOfficerToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { officers: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/officers/bulk-import:', err);
    return sendError(res, 500, 'Officer bulk import failed.');
  }
});

officersRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const row = await prisma.officer.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Officer not found.');
    return sendSuccess(res, { officer: mapDbOfficerToApi(row) });
  } catch (err) {
    console.error('GET /api/officers/:id:', err);
    return sendError(res, 500, 'Could not load officer.');
  }
});

officersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = officerDataFromBody(body);
    if (!data.name) return sendBadRequest(res, 'Officer name is required.');
    if (!data.tenderId) return sendBadRequest(res, 'tenderId is required. Create a tender first.');
    const mobile = normalizePhone10(data.mobile || '');
    if (!mobile) return sendBadRequest(res, 'Enter a valid 10-digit mobile number.');
    data.mobile = mobile;

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.officer.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Officer with this id already exists. Use PUT to update.');
    }

    const tender = await prisma.tender.findUnique({ where: { id: data.tenderId } });
    if (!tender) return sendBadRequest(res, 'Selected tender was not found. Pick a valid tender.');

    const row = await prisma.officer.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { officer: mapDbOfficerToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/officers:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not create officer.');
  }
});

officersRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.officer.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Officer not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = officerDataFromBody({ ...mapDbOfficerToApi(existing), ...body });
    if (!data.name) return sendBadRequest(res, 'Officer name is required.');
    if (data.mobile) {
      const mobile = normalizePhone10(data.mobile);
      if (!mobile) return sendBadRequest(res, 'Enter a valid 10-digit mobile number.');
      data.mobile = mobile;
    }

    const row = await prisma.officer.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { officer: mapDbOfficerToApi(row) });
  } catch (err) {
    console.error('PUT /api/officers/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not update officer.');
  }
});

officersRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.officer.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Officer not found.');
    await prisma.officer.delete({ where: { id: req.params.id } });
    await prisma.vehicle.updateMany({
      where: { assignedOfficerId: req.params.id },
      data: { assignedOfficerId: null, assignedOfficerName: null },
    });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/officers/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not delete officer.');
  }
});

officersRouter.post('/:id/transfer', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.officer.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Officer not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const transferDestination = str(body.transferDestination);
    if (!transferDestination) return sendBadRequest(res, 'transferDestination is required.');

    const transferDate =
      optStr(body.transferDate) || new Date().toISOString().slice(0, 10);
    const transferOrderNumber = optStr(body.transferOrderNumber);

    const row = await prisma.officer.update({
      where: { id: req.params.id },
      data: {
        status: 'transferred',
        transferDate,
        transferOrderNumber,
        transferDestination,
        assignedVehicleId: null,
      },
    });

    if (existing.assignedVehicleId) {
      await prisma.vehicle.updateMany({
        where: { id: existing.assignedVehicleId },
        data: {
          status: 'idle_officer_transferred',
          idleSinceDate: transferDate,
          idleReason: `Officer ${existing.name} transferred to ${transferDestination}`,
          transferOrderRef: transferOrderNumber,
          assignedOfficerId: null,
          assignedOfficerName: null,
        },
      });
    }

    return sendSuccess(res, { officer: mapDbOfficerToApi(row) });
  } catch (err) {
    console.error('POST /api/officers/:id/transfer:', err);
    return sendError(res, 500, 'Could not transfer officer.');
  }
});

officersRouter.post('/:id/relieve', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.officer.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Officer not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const relieveDate = optStr(body.relieveDate) || new Date().toISOString().slice(0, 10);
    const reason = optStr(body.reason);

    const row = await prisma.officer.update({
      where: { id: req.params.id },
      data: {
        status: 'relieved',
        transferDate: relieveDate,
        transferDestination: reason || existing.transferDestination || 'Relieved from posting',
        assignedVehicleId: null,
        currentDriverId: null,
      },
    });

    if (existing.assignedVehicleId) {
      await prisma.vehicle.updateMany({
        where: { id: existing.assignedVehicleId },
        data: {
          status: 'idle',
          idleSinceDate: relieveDate,
          idleReason: reason || `Officer ${existing.name} relieved`,
          assignedOfficerId: null,
          assignedOfficerName: null,
        },
      });
    }

    return sendSuccess(res, { officer: mapDbOfficerToApi(row) });
  } catch (err) {
    console.error('POST /api/officers/:id/relieve:', err);
    return sendError(res, 500, 'Could not relieve officer.');
  }
});
