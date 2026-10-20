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
import { companyDocDataFromBody, mapDbCompanyDocToApi } from '../lib/companyDocMapper';
import { withBulkTransaction } from '../lib/batchWork';

export const companyDocumentsRouter = Router();

function canViewDocs(req: Request): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.company_documents?.canView);
}

function canEditDocs(req: Request): boolean {
  const u = req.authUser;
  if (!u) return false;
  if (u.role === 'admin') return true;
  return Boolean(u.permissions?.company_documents?.canEdit);
}

function daysUntil(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

companyDocumentsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewDocs(req)) return sendForbidden(res);
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

    const rows = await prisma.companyDocument.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q } },
                { docNumber: { contains: q } },
                { issuingAuthority: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return sendSuccess(res, { documents: rows.map(mapDbCompanyDocToApi) });
  } catch (err) {
    console.error('GET /api/company-documents:', err);
    return sendError(res, 500, 'Could not load company documents.');
  }
});

companyDocumentsRouter.get('/expiring', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewDocs(req)) return sendForbidden(res);
    const withinDaysRaw = Number(req.query.withinDays ?? 60);
    const withinDays = Number.isFinite(withinDaysRaw) && withinDaysRaw > 0 ? withinDaysRaw : 60;

    const rows = await prisma.companyDocument.findMany({
      where: {
        isLifetime: false,
        expiryDate: { not: null },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const items = rows
      .map((row) => {
        const daysLeft = daysUntil(row.expiryDate);
        if (daysLeft === null || daysLeft > withinDays) return null;
        return {
          ...mapDbCompanyDocToApi(row),
          daysLeft,
          severity: daysLeft < 0 ? 'overdue' : daysLeft <= 7 ? 'high' : daysLeft <= 30 ? 'medium' : 'low',
        };
      })
      .filter(Boolean);

    return sendSuccess(res, { items, withinDays });
  } catch (err) {
    console.error('GET /api/company-documents/expiring:', err);
    return sendError(res, 500, 'Could not load expiring documents.');
  }
});

companyDocumentsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditDocs(req)) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const items = Array.isArray(body.documents)
      ? body.documents
      : Array.isArray(body.items)
        ? body.items
        : null;
    if (!items?.length) return sendBadRequest(res, 'Provide documents array to import.');

    const created = await withBulkTransaction(async (tx) => {
      const out = [];
      for (const item of items) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const data = companyDocDataFromBody(raw);
        if (!data.title || !data.issueDate) continue;
        if (!data.isLifetime && !data.expiryDate) continue;
        const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
        try {
          const row = await tx.companyDocument.create({ data: id ? { id, ...data } : data });
          out.push(mapDbCompanyDocToApi(row));
        } catch {
          if (id) {
            const existing = await tx.companyDocument.findUnique({ where: { id } });
            if (existing) out.push(mapDbCompanyDocToApi(existing));
          }
        }
      }
      return out;
    });

    return sendSuccess(res, { documents: created, imported: created.length }, 201);
  } catch (err) {
    console.error('POST /api/company-documents/bulk-import:', err);
    return sendError(res, 500, 'Company document bulk import failed.');
  }
});

companyDocumentsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewDocs(req)) return sendForbidden(res);
    const row = await prisma.companyDocument.findUnique({ where: { id: req.params.id } });
    if (!row) return sendNotFound(res, 'Company document not found.');
    return sendSuccess(res, { document: mapDbCompanyDocToApi(row) });
  } catch (err) {
    console.error('GET /api/company-documents/:id:', err);
    return sendError(res, 500, 'Could not load company document.');
  }
});

companyDocumentsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditDocs(req)) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = companyDocDataFromBody(body);
    if (!data.title) return sendBadRequest(res, 'Document title is required.');
    if (!data.issueDate) return sendBadRequest(res, 'Issue date is required.');
    if (!data.isLifetime && !data.expiryDate) {
      return sendBadRequest(res, 'Provide expiryDate or mark as lifetime.');
    }

    const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : undefined;
    if (id) {
      const existing = await prisma.companyDocument.findUnique({ where: { id } });
      if (existing) return sendBadRequest(res, 'Document with this id already exists. Use PUT to update.');
    }

    const row = await prisma.companyDocument.create({
      data: id ? { id, ...data } : data,
    });
    return sendSuccess(res, { document: mapDbCompanyDocToApi(row) }, 201);
  } catch (err) {
    console.error('POST /api/company-documents:', err);
    return sendError(res, 500, 'Could not create company document.');
  }
});

companyDocumentsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditDocs(req)) return sendForbidden(res);
    const existing = await prisma.companyDocument.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Company document not found.');

    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = companyDocDataFromBody({ ...mapDbCompanyDocToApi(existing), ...body });
    if (!data.title) return sendBadRequest(res, 'Document title is required.');

    const row = await prisma.companyDocument.update({
      where: { id: req.params.id },
      data,
    });
    return sendSuccess(res, { document: mapDbCompanyDocToApi(row) });
  } catch (err) {
    console.error('PUT /api/company-documents/:id:', err);
    return sendError(res, 500, 'Could not update company document.');
  }
});

companyDocumentsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditDocs(req)) return sendForbidden(res);
    const existing = await prisma.companyDocument.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Company document not found.');
    await prisma.companyDocument.delete({ where: { id: req.params.id } });
    return sendSuccess(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('DELETE /api/company-documents/:id:', err);
    return sendError(res, 500, 'Could not delete company document.');
  }
});

companyDocumentsRouter.post('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditDocs(req)) return sendForbidden(res);
    const existing = await prisma.companyDocument.findUnique({ where: { id: req.params.id } });
    if (!existing) return sendNotFound(res, 'Company document not found.');

    const noteSuffix = ' [verified]';
    const notes =
      existing.notes && existing.notes.includes('[verified]')
        ? existing.notes
        : `${existing.notes || ''}${noteSuffix}`.trim();

    const row = await prisma.companyDocument.update({
      where: { id: req.params.id },
      data: { notes },
    });
    return sendSuccess(res, { document: mapDbCompanyDocToApi(row), verified: true });
  } catch (err) {
    console.error('POST /api/company-documents/:id/verify:', err);
    return sendError(res, 500, 'Could not verify company document.');
  }
});
