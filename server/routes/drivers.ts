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
import { driverDataFromBody, mapDbDriverToApi } from '../lib/driverMapper';
import { optBool, optNum, optStr, str } from '../lib/bodyParsers';
import { asJsonInput } from '../lib/jsonInput';
import { withBulkTransaction } from '../lib/batchWork';
import { prismaClientErrorMessage } from '../lib/prismaErrors';
import type { DocumentAttachment } from '../../src/types';

function normalizePhone10(raw: string): string | null {
  const digits = raw.replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

export const driversRouter = Router();

function asDocs(raw: unknown): DocumentAttachment[] {
  return Array.isArray(raw) ? (raw as DocumentAttachment[]) : [];
}

driversRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const rows = await prisma.driver.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
                { licenseNumber: { contains: q } },
                { driverCode: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, { drivers: rows.map(mapDbDriverToApi) });
  } catch (err) {
    console.error('GET /api/drivers:', err);
    return sendError(res, 500, 'Could not load drivers.');
  }
});

driversRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.drivers) ? body.drivers : Array.isArray(body.items) ? body.items : null;
    if (!items?.length) return sendBadRequest(res, 'Provide drivers array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = driverDataFromBody(raw);
        if (!data.name) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.driver.create({ data: id ? { id, ...data } : data });
          out.push(mapDbDriverToApi(row));
        } catch {
          if (id) {
            const existing = await tx.driver.findUnique({ where: { id } });
            if (existing) out.push(mapDbDriverToApi(existing));
          }
        }
      }
      return out;
    });
    return sendSuccess(res, { drivers: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/drivers/bulk-import:', err);
    return sendError(res, 500, 'Driver bulk import failed.');
  }
});

driversRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const row = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Driver not found.');
    return sendSuccess(res, { driver: mapDbDriverToApi(row) });
  } catch (err) {
    console.error('GET /api/drivers/:id:', err);
    return sendError(res, 500, 'Could not load driver.');
  }
});

driversRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = driverDataFromBody(body);
    if (!data.name) return sendBadRequest(res, 'Driver name is required.');
    const phone = normalizePhone10(data.phone);
    if (!phone) return sendBadRequest(res, 'Enter a valid 10-digit mobile number.');
    data.phone = phone;

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.driver.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Driver with this id already exists. Use PUT to update.');
    }

    const row = await prisma.driver.create({ data: id ? { id, ...data } : data });
    return sendSuccess(res, { driver: mapDbDriverToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/drivers:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not create driver.');
  }
});

driversRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = driverDataFromBody({ ...mapDbDriverToApi(existing), ...body });
    if (!data.name) return sendBadRequest(res, 'Driver name is required.');
    if (data.phone) {
      const phone = normalizePhone10(data.phone);
      if (!phone) return sendBadRequest(res, 'Enter a valid 10-digit mobile number.');
      data.phone = phone;
    }

    const row = await prisma.driver.update({ where: { id: req.params.id }, data });
    return sendSuccess(res, { driver: mapDbDriverToApi(row) });
  } catch (err) {
    console.error('PUT /api/drivers/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not update driver.');
  }
});

driversRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');
    await prisma.driver.delete({ where: { id: req.params.id } });
    // Clear soft links on vehicles (no FK constraint)
    await prisma.vehicle.updateMany({
      where: { currentDriverId: req.params.id },
      data: { currentDriverId: null },
    });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/drivers/:id:', err);
    return sendError(res, 500, prismaClientErrorMessage(err) || 'Could not delete driver.');
  }
});

driversRouter.get('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const row = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Driver not found.');
    return sendSuccess(res, { documents: asDocs(row.documents) });
  } catch (err) {
    console.error('GET /api/drivers/:id/documents:', err);
    return sendError(res, 500, 'Could not load driver documents.');
  }
});

driversRouter.post('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const doc = (body.document ?? body) as Record<string, unknown>;
    const title = str(doc.title);
    const fileName = str(doc.fileName);
    if (!title || !fileName) return sendBadRequest(res, 'Document title and fileName are required.');

    const attachment: DocumentAttachment = {
      id: optStr(doc.id) || `ddoc-${Date.now()}`,
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
    const row = await prisma.driver.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(docs) },
    });
    return sendSuccess(res, { document: attachment, documents: asDocs(row.documents) }, 201);
  } catch (err) {
    console.error('POST /api/drivers/:id/documents:', err);
    return sendError(res, 500, 'Could not add driver document.');
  }
});

driversRouter.delete('/:id/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');

    const docs = asDocs(existing.documents);
    const next = docs.filter((d) => d.id !== req.params.docId);
    if (next.length === docs.length) return sendNotFound(res, 'Document not found on driver.');

    const row = await prisma.driver.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(next) },
    });
    return sendSuccess(res, { deleted: true, documents: asDocs(row.documents) });
  } catch (err) {
    console.error('DELETE /api/drivers/:id/documents/:docId:', err);
    return sendError(res, 500, 'Could not delete driver document.');
  }
});

driversRouter.post('/:id/enroll-statutory', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers') && !canEditModule(req, 'statutory_payroll')) {
      return sendForbidden(res);
    }
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const row = await prisma.driver.update({
      where: { id: req.params.id },
      data: {
        employmentType: optStr(body.employmentType) || 'company_statutory',
        uanNumber: optStr(body.uanNumber) ?? existing.uanNumber,
        epfMemberId: optStr(body.epfMemberId) ?? existing.epfMemberId,
        esicIpNumber: optStr(body.esicIpNumber) ?? existing.esicIpNumber,
        skillCategory: optStr(body.skillCategory) ?? existing.skillCategory,
        minimumWageBasic: optNum(body.minimumWageBasic) ?? existing.minimumWageBasic,
        vda: optNum(body.vda) ?? existing.vda,
        hra: optNum(body.hra) ?? existing.hra,
        isEpfApplicable: body.isEpfApplicable === undefined ? true : optBool(body.isEpfApplicable),
        isEsicApplicable: body.isEsicApplicable === undefined ? true : optBool(body.isEsicApplicable),
      },
    });
    return sendSuccess(res, { driver: mapDbDriverToApi(row) });
  } catch (err) {
    console.error('POST /api/drivers/:id/enroll-statutory:', err);
    return sendError(res, 500, 'Could not enroll driver for statutory compliance.');
  }
});

driversRouter.get('/:id/balance', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers') && !canViewModule(req, 'drivers_khata')) {
      return sendForbidden(res);
    }
    const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Driver not found.');

    return sendSuccess(res, {
      driverId: existing.id,
      balance: 0,
      currency: 'INR',
      note: 'Khata ledger balance will populate after Drivers Khata is on the database (later phase).',
    });
  } catch (err) {
    console.error('GET /api/drivers/:id/balance:', err);
    return sendError(res, 500, 'Could not load driver balance.');
  }
});
