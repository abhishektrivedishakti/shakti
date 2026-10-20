import type { CompanyDocument } from '../types';
import { apiJson } from './http';

export async function fetchCompanyDocuments(params?: {
  category?: string;
  q?: string;
}): Promise<CompanyDocument[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; documents: CompanyDocument[] }>(
    `/api/company-documents${suffix}`
  );
  return data.documents;
}

export async function fetchCompanyDocumentById(id: string): Promise<CompanyDocument> {
  const data = await apiJson<{ success: true; document: CompanyDocument }>(
    `/api/company-documents/${id}`
  );
  return data.document;
}

export async function createCompanyDocumentApi(
  payload: CompanyDocument | Omit<CompanyDocument, 'id'> & { id?: string }
): Promise<CompanyDocument> {
  const data = await apiJson<{ success: true; document: CompanyDocument }>('/api/company-documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.document;
}

export async function bulkImportCompanyDocumentsApi(
  documents: Array<CompanyDocument | Omit<CompanyDocument, 'id'> & { id?: string }>
): Promise<CompanyDocument[]> {
  const data = await apiJson<{ success: true; documents: CompanyDocument[] }>(
    '/api/company-documents/bulk-import',
    {
      method: 'POST',
      body: JSON.stringify({ documents }),
    }
  );
  return data.documents;
}

export async function updateCompanyDocumentApi(
  id: string,
  payload: Partial<CompanyDocument>
): Promise<CompanyDocument> {
  const data = await apiJson<{ success: true; document: CompanyDocument }>(
    `/api/company-documents/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    }
  );
  return data.document;
}

export async function deleteCompanyDocumentApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/company-documents/${id}`, { method: 'DELETE' });
}

export async function fetchExpiringCompanyDocuments(withinDays = 60): Promise<
  Array<CompanyDocument & { daysLeft: number; severity: string }>
> {
  const data = await apiJson<{
    success: true;
    items: Array<CompanyDocument & { daysLeft: number; severity: string }>;
  }>(`/api/company-documents/expiring?withinDays=${withinDays}`);
  return data.items;
}

export async function verifyCompanyDocumentApi(id: string): Promise<CompanyDocument> {
  const data = await apiJson<{ success: true; document: CompanyDocument }>(
    `/api/company-documents/${id}/verify`,
    { method: 'POST', body: JSON.stringify({}) }
  );
  return data.document;
}
