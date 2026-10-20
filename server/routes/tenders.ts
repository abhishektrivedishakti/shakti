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
import { asJsonInput } from '../lib/jsonInput';
import { withBulkTransaction } from '../lib/batchWork';
import { mapDbTenderToApi, tenderCreateDataFromBody } from '../lib/tenderMapper';
import type { DocumentAttachment, TenderOnCallDefaults, TenderVehiclePackage } from '../../src/types';

export const tendersRouter = Router();

function canViewTenders(req: Request): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.tenders?.canView);
}

function canEditTenders(req: Request): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.tenders?.canEdit);
}

function asDocArray(raw: unknown): DocumentAttachment[] {
  return Array.isArray(raw) ? (raw as DocumentAttachment[]) : [];
}

function asPackages(raw: unknown): TenderVehiclePackage[] {
  return Array.isArray(raw) ? (raw as TenderVehiclePackage[]) : [];
}

tendersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewTenders(req)) return sendForbidden(res);
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const rows = await prisma.tender.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { tenderNumber: { contains: q } },
                { departmentName: { contains: q } },
                { workOrderNumber: { contains: q } },
                { authorityOffice: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, { tenders: rows.map(mapDbTenderToApi) });
  } catch (err) {
    console.error('GET /api/tenders:', err);
    return sendError(res, 500, 'Could not load tenders.');
  }
});

tendersRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.tenders) ? body.tenders : Array.isArray(body.items) ? body.items : null;
    if (!items || items.length === 0) {
      return sendBadRequest(res, 'Provide tenders array to import.');
    }

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = tenderCreateDataFromBody(raw);
        if (!data.tenderNumber || !data.departmentName) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.tender.create({
            data: id ? { id, ...data } : data,
          });
          out.push(mapDbTenderToApi(row));
        } catch {
          if (id) {
            const existing = await tx.tender.findUnique({ where: { id } });
            if (existing) out.push(mapDbTenderToApi(existing));
          }
        }
      }
      return out;
    });

    return sendSuccess(res, { tenders: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/tenders/bulk-import:', err);
    return sendError(res, 500, 'Bulk import failed.');
  }
});

tendersRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewTenders(req)) return sendForbidden(res);
    const row = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Tender not found.');
    return sendSuccess(res, { tender: mapDbTenderToApi(row) });
  } catch (err) {
    console.error('GET /api/tenders/:id:', err);
    return sendError(res, 500, 'Could not load tender.');
  }
});

tendersRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = tenderCreateDataFromBody(body);
    if (!data.tenderNumber) return sendBadRequest(res, 'Tender number is required.');
    if (!data.departmentName) return sendBadRequest(res, 'Department name is required.');
    if (!data.contractPeriodStart || !data.contractPeriodEnd) {
      return sendBadRequest(res, 'Contract period start and end dates are required.');
    }

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.tender.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Tender with this id already exists. Use PUT to update.');
    }

    const row = await prisma.tender.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { tender: mapDbTenderToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/tenders:', err);
    return sendError(res, 500, 'Could not create tender.');
  }
});

tendersRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = tenderCreateDataFromBody({ ...mapDbTenderToApi(existing), ...body });
    if (!data.tenderNumber) return sendBadRequest(res, 'Tender number is required.');

    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { tender: mapDbTenderToApi(row) });
  } catch (err) {
    console.error('PUT /api/tenders/:id:', err);
    return sendError(res, 500, 'Could not update tender.');
  }
});

tendersRouter.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (!['active', 'completed', 'renewed'].includes(status)) {
      return sendBadRequest(res, 'Status must be active, completed, or renewed.');
    }
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');

    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data: { status },
    });
    return sendSuccess(res, { tender: mapDbTenderToApi(row) });
  } catch (err) {
    console.error('PATCH /api/tenders/:id/status:', err);
    return sendError(res, 500, 'Could not update tender status.');
  }
});

tendersRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');
    await prisma.tender.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/tenders/:id:', err);
    return sendError(res, 500, 'Could not delete tender.');
  }
});

tendersRouter.get('/:id/packages', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewTenders(req)) return sendForbidden(res);
    const row = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Tender not found.');
    return sendSuccess(res, { packages: asPackages(row.packages) });
  } catch (err) {
    console.error('GET /api/tenders/:id/packages:', err);
    return sendError(res, 500, 'Could not load packages.');
  }
});

tendersRouter.put('/:id/packages', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');
    const body = (req.body ?? {}) as Record<string, unknown>;
    const packages = Array.isArray(body.packages) ? body.packages : null;
    if (!packages) return sendBadRequest(res, 'Provide packages array.');

    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data: { packages: asJsonInput(packages) },
    });
    return sendSuccess(res, { packages: asPackages(row.packages), tender: mapDbTenderToApi(row) });
  } catch (err) {
    console.error('PUT /api/tenders/:id/packages:', err);
    return sendError(res, 500, 'Could not update packages.');
  }
});

tendersRouter.get('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewTenders(req)) return sendForbidden(res);
    const row = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Tender not found.');
    return sendSuccess(res, { documents: asDocArray(row.documents) });
  } catch (err) {
    console.error('GET /api/tenders/:id/documents:', err);
    return sendError(res, 500, 'Could not load tender documents.');
  }
});

tendersRouter.post('/:id/documents', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const doc = (body.document ?? body) as Record<string, unknown>;
    const title = typeof doc.title === 'string' ? doc.title.trim() : '';
    const fileName = typeof doc.fileName === 'string' ? doc.fileName.trim() : '';
    if (!title || !fileName) return sendBadRequest(res, 'Document title and fileName are required.');

    const attachment: DocumentAttachment = {
      id: typeof doc.id === 'string' && doc.id.trim() ? doc.id.trim() : `tdoc-${Date.now()}`,
      title,
      category: (typeof doc.category === 'string' ? doc.category : 'other') as DocumentAttachment['category'],
      documentNumber: typeof doc.documentNumber === 'string' ? doc.documentNumber : undefined,
      issuingAuthority: typeof doc.issuingAuthority === 'string' ? doc.issuingAuthority : undefined,
      issueDate: typeof doc.issueDate === 'string' ? doc.issueDate : undefined,
      expiryDate: typeof doc.expiryDate === 'string' ? doc.expiryDate : undefined,
      fileName,
      fileType: (typeof doc.fileType === 'string' ? doc.fileType : 'pdf') as DocumentAttachment['fileType'],
      fileUrl: typeof doc.fileUrl === 'string' ? doc.fileUrl : undefined,
      fileSize: typeof doc.fileSize === 'string' ? doc.fileSize : undefined,
      uploadedAt:
        typeof doc.uploadedAt === 'string' && doc.uploadedAt
          ? doc.uploadedAt
          : new Date().toISOString().slice(0, 16).replace('T', ' '),
      verified: Boolean(doc.verified),
      notes: typeof doc.notes === 'string' ? doc.notes : undefined,
    };

    const docs = [...asDocArray(existing.documents), attachment];
    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(docs) },
    });
    return sendSuccess(res, { document: attachment, documents: asDocArray(row.documents) }, 201);
  } catch (err) {
    console.error('POST /api/tenders/:id/documents:', err);
    return sendError(res, 500, 'Could not add tender document.');
  }
});

tendersRouter.delete('/:id/documents/:docId', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');

    const docs = asDocArray(existing.documents);
    const next = docs.filter((d) => d.id !== req.params.docId);
    if (next.length === docs.length) return sendNotFound(res, 'Document not found on tender.');

    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data: { documents: asJsonInput(next) },
    });
    return sendSuccess(res, { deleted: true, documents: asDocArray(row.documents) });
  } catch (err) {
    console.error('DELETE /api/tenders/:id/documents/:docId:', err);
    return sendError(res, 500, 'Could not delete tender document.');
  }
});

tendersRouter.get('/:id/on-call-defaults', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewTenders(req)) return sendForbidden(res);
    const row = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Tender not found.');
    return sendSuccess(res, {
      onCallDefaults: (row.onCallDefaults as TenderOnCallDefaults | null) ?? null,
    });
  } catch (err) {
    console.error('GET /api/tenders/:id/on-call-defaults:', err);
    return sendError(res, 500, 'Could not load on-call defaults.');
  }
});

tendersRouter.put('/:id/on-call-defaults', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditTenders(req)) return sendForbidden(res);
    const existing = await prisma.tender.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Tender not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const onCallDefaults = body.onCallDefaults !== undefined ? body.onCallDefaults : body;
    const row = await prisma.tender.update({
      where: { id: req.params.id },
      data: { onCallDefaults: asJsonInput(onCallDefaults ?? null) },
    });
    return sendSuccess(res, {
      onCallDefaults: (row.onCallDefaults as TenderOnCallDefaults | null) ?? null,
      tender: mapDbTenderToApi(row),
    });
  } catch (err) {
    console.error('PUT /api/tenders/:id/on-call-defaults:', err);
    return sendError(res, 500, 'Could not update on-call defaults.');
  }
});
