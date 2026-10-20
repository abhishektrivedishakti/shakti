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
import { mapDbVehicleToApi, vehicleDataFromBody } from '../lib/vehicleMapper';
import { num, optStr, str } from '../lib/bodyParsers';
import { asJsonInput } from '../lib/jsonInput';
import { withBulkTransaction } from '../lib/batchWork';
import { prismaClientErrorMessage } from '../lib/prismaErrors';
import type { DocumentAttachment } from '../../src/types';

export const vehiclesRouter = Router();

function asDocs(raw: unknown): DocumentAttachment[] {
  return Array.isArray(raw) ? (raw as DocumentAttachment[]) : [];
}

function daysUntil(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

vehiclesRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const tenderId = typeof req.query.tenderId === 'string' ? req.query.tenderId.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const ownership = typeof req.query.ownership === 'string' ? req.query.ownership.trim() : '';
    const ownershipType =
      typeof req.query.ownershipType === 'string' ? req.query.ownershipType.trim() : ownership;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    let ownershipFilter: string | undefined;
    if (ownershipType === 'owned' || ownershipType === 'Company Owned') {
      ownershipFilter = 'Company Owned';
    } else if (ownershipType === 'attached' || ownershipType === 'Attached / Market Hire') {
      ownershipFilter = 'Attached / Market Hire';
    } else if (ownershipType === 'Owner-Driver') {
      ownershipFilter = 'Owner-Driver';
    } else if (ownershipType) {
      ownershipFilter = ownershipType;
    }

    const rows = await prisma.vehicle.findMany({
      where: {
        ...(tenderId ? { tenderId } : {}),
        ...(status ? { status } : {}),
        ...(ownershipFilter ? { ownershipType: ownershipFilter } : {}),
        ...(q
          ? {
              OR: [
                { vehicleNumber: { contains: q } },
                { makeModel: { contains: q } },
                { driverName: { contains: q } },
                { assignedOfficerName: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, { vehicles: rows.map(mapDbVehicleToApi) });
  } catch (err) {
    console.error('GET /api/vehicles:', err);
    return sendError(res, 500, 'Could not load vehicles.');
  }
});

vehiclesRouter.get('/doc-alerts', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const withinDaysRaw = Number(req.query.withinDays ?? 45);
    const withinDays = Number.isFinite(withinDaysRaw) && withinDaysRaw > 0 ? withinDaysRaw : 45;

    const rows = await prisma.vehicle.findMany({
      select: {
        id: true,
        vehicleNumber: true,
        makeModel: true,
        rtoFitnessExpiry: true,
        insuranceExpiry: true,
        pucExpiry: true,
        roadTaxExpiry: true,
        permitExpiry: true,
      },
      orderBy: { vehicleNumber: 'asc' },
    });

    const items: Array<{
      vehicleId: string;
      vehicleNumber: string;
      makeModel: string;
      docType: string;
      expiryDate: string;
      daysLeft: number;
      severity: string;
    }> = [];

    const pushIf = (
      row: (typeof rows)[number],
      docType: string,
      expiryDate: string | null | undefined
    ) => {
      const daysLeft = daysUntil(expiryDate);
      if (daysLeft === null || daysLeft > withinDays) return;
      items.push({
        vehicleId: row.id,
        vehicleNumber: row.vehicleNumber,
        makeModel: row.makeModel,
        docType,
        expiryDate: expiryDate!,
        daysLeft,
        severity: daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'high' : daysLeft <= 30 ? 'medium' : 'low',
      });
    };

    for (const row of rows) {
      pushIf(row, 'fitness', row.rtoFitnessExpiry);
      pushIf(row, 'insurance', row.insuranceExpiry);
      pushIf(row, 'puc', row.pucExpiry);
      pushIf(row, 'road_tax', row.roadTaxExpiry);
      pushIf(row, 'permit', row.permitExpiry);
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    return sendSuccess(res, { items, withinDays });
  } catch (err) {
    console.error('GET /api/vehicles/doc-alerts:', err);
    return sendError(res, 500, 'Could not load vehicle document alerts.');
  }
});

vehiclesRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.vehicles) ? body.vehicles : Array.isArray(body.items) ? body.items : null;
    if (!items?.length) return sendBadRequest(res, 'Provide vehicles array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = vehicleDataFromBody(raw);
        if (!data.vehicleNumber || !data.tenderId) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.vehicle.create({ data: id ? { id, ...data } : data });
          out.push(mapDbVehicleToApi(row));
        } catch {
          if (id) {
            const existing = await tx.vehicle.findUnique({ where: { id } });
            if (existing) out.push(mapDbVehicleToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { vehicles: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/vehicles/bulk-import:', err);
    return sendError(res, 500, 'Vehicle bulk import failed.');
  }
});

vehiclesRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const row = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Vehicle not found.');
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) });
  } catch (err) {
    console.error('GET /api/vehicles/:id:', err);
    return sendError(res, 500, 'Could not load vehicle.');
  }
});

vehiclesRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = vehicleDataFromBody(body);
    if (!data.vehicleNumber) return sendBadRequest(res, 'Vehicle number is required.');
    if (!data.tenderId) return sendBadRequest(res, 'tenderId is required.');

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.vehicle.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Vehicle with this id already exists. Use PUT to update.');
    }

    if (data.tenderId) {
      const tender = await prisma.tender.findUnique({ where: { id: data.tenderId } });
      if (!tender) return sendBadRequest(res, 'Selected tender was not found. Pick a valid tender.');
    }

    const row = await prisma.vehicle.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/vehicles:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not create vehicle.');
  }
});

vehiclesRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = vehicleDataFromBody({ ...mapDbVehicleToApi(existing), ...body });
    if (!data.vehicleNumber) return sendBadRequest(res, 'Vehicle number is required.');

    const row = await prisma.vehicle.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) });
  } catch (err) {
    console.error('PUT /api/vehicles/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not update vehicle.');
  }
});

vehiclesRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');
    await prisma.vehicle.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/vehicles/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not delete vehicle.');
  }
});

vehiclesRouter.get('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const row = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Vehicle not found.');
    return sendSuccess(res, { documents: asDocs(row.documents) });
  } catch (err) {
    console.error('GET /api/vehicles/:id/documents:', err);
    return sendError(res, 500, 'Could not load vehicle documents.');
  }
});

vehiclesRouter.post('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const doc = (body.document ?? body) as Record<string, unknown>;
    const title = str(doc.title);
    const fileName = str(doc.fileName);
    if (!title || !fileName) return sendBadRequest(res, 'Document title and fileName are required.');

    const attachment: DocumentAttachment = {
      id: optStr(doc.id) || `vdoc-${Date.now()}`,
      title,
      category: (optStr(doc.category) || 'other') as DocumentAttachment['category'],
      documentNumber: optStr(doc.documentNumber) ?? undefined,
      issuingAuthority: optStr(doc.issuingAuthority) ?? undefined,
      issueDate: optStr(doc.issueDate) ?? undefined,
      expiryDate: optStr(doc.expiryDate) ?? undefined,
      fileName,
      fileType: (optStr(doc.fileType) || 'pdf') as DocumentAttachment['fileType'],
      fileUrl: optStr(doc.fileUrl) ?? undefined,
      fileSize: optStr(doc.fileSize) ?? undefined,
      uploadedAt: optStr(doc.uploadedAt) || new Date().toISOString().slice(0, 16).replace('T', ' '),
      verified: Boolean(doc.verified),
      notes: optStr(doc.notes) ?? undefined,
    };

    const docs = [...asDocs(existing.documents), attachment];
    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(docs) },
    });
    return sendSuccess(res, { document: attachment, documents: asDocs(row.documents) }, 201);
  } catch (err) {
    console.error('POST /api/vehicles/:id/documents:', err);
    return sendError(res, 500, 'Could not add vehicle document.');
  }
});

vehiclesRouter.put('/:id/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const docs = asDocs(existing.documents);
    const idx = docs.findIndex((d) => d.id === req.params.docId);
    if (idx < 0) return sendNotFound(res, 'Document not found on vehicle.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const patch = (body.document ?? body) as Record<string, unknown>;
    docs[idx] = {
      ...docs[idx],
      ...(typeof patch.title === 'string' ? { title: patch.title.trim() } : {}),
      ...(typeof patch.fileName === 'string' ? { fileName: patch.fileName.trim() } : {}),
      ...(typeof patch.category === 'string' ? { category: patch.category as DocumentAttachment['category'] } : {}),
      ...(typeof patch.expiryDate === 'string' ? { expiryDate: patch.expiryDate } : {}),
      ...(typeof patch.verified === 'boolean' ? { verified: patch.verified } : {}),
      ...(typeof patch.notes === 'string' ? { notes: patch.notes } : {}),
      ...(typeof patch.fileUrl === 'string' ? { fileUrl: patch.fileUrl } : {}),
    };

    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(docs) },
    });
    return sendSuccess(res, { document: docs[idx], documents: asDocs(row.documents) });
  } catch (err) {
    console.error('PUT /api/vehicles/:id/documents/:docId:', err);
    return sendError(res, 500, 'Could not update vehicle document.');
  }
});

vehiclesRouter.delete('/:id/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const docs = asDocs(existing.documents);
    const next = docs.filter((d) => d.id !== req.params.docId);
    if (next.length === docs.length) return sendNotFound(res, 'Document not found on vehicle.');

    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(next) },
    });
    return sendSuccess(res, { deleted: true, documents: asDocs(row.documents) });
  } catch (err) {
    console.error('DELETE /api/vehicles/:id/documents/:docId:', err);
    return sendError(res, 500, 'Could not delete vehicle document.');
  }
});

vehiclesRouter.post('/:id/reactivate', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        status: 'active',
        idleSinceDate: null,
        idleReason: null,
        transferOrderRef: null,
        assignedOfficerId: optStr(body.assignedOfficerId) ?? existing.assignedOfficerId,
        assignedOfficerName: optStr(body.assignedOfficerName) ?? existing.assignedOfficerName,
        currentDriverId: optStr(body.currentDriverId) ?? existing.currentDriverId,
        driverName: optStr(body.driverName) ?? existing.driverName,
        driverPhone: optStr(body.driverPhone) ?? existing.driverPhone,
      },
    });
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) });
  } catch (err) {
    console.error('POST /api/vehicles/:id/reactivate:', err);
    return sendError(res, 500, 'Could not reactivate vehicle.');
  }
});

vehiclesRouter.patch('/:id/odometer', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const odometer = num(body.currentOdometer ?? body.odometer, NaN);
    if (!Number.isFinite(odometer) || odometer < 0) {
      return sendBadRequest(res, 'Provide a valid currentOdometer value.');
    }
    if (odometer < existing.currentOdometer) {
      return sendBadRequest(res, 'Odometer cannot be lower than the current reading.');
    }

    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { currentOdometer: odometer },
    });
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) });
  } catch (err) {
    console.error('PATCH /api/vehicles/:id/odometer:', err);
    return sendError(res, 500, 'Could not update odometer.');
  }
});

vehiclesRouter.patch('/:id/operational-status', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Vehicle not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = str(body.status);
    const allowed = [
      'active',
      'in_service',
      'idle',
      'idle_officer_transferred',
      'surrendered_temporary',
      'standby_pool',
    ];
    if (!allowed.includes(status)) {
      return sendBadRequest(res, `Status must be one of: ${allowed.join(', ')}`);
    }

    const row = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: {
        status,
        idleSinceDate: status.startsWith('idle') || status === 'standby_pool'
          ? optStr(body.idleSinceDate) || existing.idleSinceDate || new Date().toISOString().slice(0, 10)
          : null,
        idleReason:
          status === 'active'
            ? null
            : optStr(body.idleReason) ?? existing.idleReason,
      },
    });
    return sendSuccess(res, { vehicle: mapDbVehicleToApi(row) });
  } catch (err) {
    console.error('PATCH /api/vehicles/:id/operational-status:', err);
    return sendError(res, 500, 'Could not update operational status.');
  }
});
