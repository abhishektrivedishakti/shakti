import type { CompanyDocument as DbDoc } from '../generated/prisma';
import type { CompanyDocCategory, CompanyDocument } from '../../src/types';

export function mapDbCompanyDocToApi(row: DbDoc): CompanyDocument {
  return {
    id: row.id,
    title: row.title,
    category: row.category as CompanyDocCategory,
    docNumber: row.docNumber,
    issuingAuthority: row.issuingAuthority,
    issueDate: row.issueDate,
    expiryDate: row.expiryDate ?? undefined,
    isLifetime: row.isLifetime,
    alertDaysBefore: row.alertDaysBefore,
    custodyLocation: row.custodyLocation ?? undefined,
    contactPersonOrAgent: row.contactPersonOrAgent ?? undefined,
    fileUrl: row.fileUrl ?? undefined,
    fileName: row.fileName ?? undefined,
    fileType: (row.fileType as CompanyDocument['fileType']) ?? undefined,
    fileSize: row.fileSize ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

export function companyDocDataFromBody(body: Record<string, unknown>) {
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);
  const num = (v: unknown, fallback = 30) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    title: str(body.title),
    category: str(body.category, 'other') || 'other',
    docNumber: str(body.docNumber),
    issuingAuthority: str(body.issuingAuthority),
    issueDate: str(body.issueDate),
    expiryDate:
      typeof body.expiryDate === 'string' && body.expiryDate.trim() ? body.expiryDate.trim() : null,
    isLifetime: Boolean(body.isLifetime),
    alertDaysBefore: num(body.alertDaysBefore, 30),
    custodyLocation:
      typeof body.custodyLocation === 'string' && body.custodyLocation.trim()
        ? body.custodyLocation.trim()
        : null,
    contactPersonOrAgent:
      typeof body.contactPersonOrAgent === 'string' && body.contactPersonOrAgent.trim()
        ? body.contactPersonOrAgent.trim()
        : null,
    fileUrl: typeof body.fileUrl === 'string' && body.fileUrl.trim() ? body.fileUrl.trim() : null,
    fileName: typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : null,
    fileType: typeof body.fileType === 'string' && body.fileType.trim() ? body.fileType.trim() : null,
    fileSize: typeof body.fileSize === 'string' && body.fileSize.trim() ? body.fileSize.trim() : null,
    notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null,
  };
}
