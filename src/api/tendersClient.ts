import type { DocumentAttachment, Tender, TenderOnCallDefaults, TenderVehiclePackage } from '../types';
import { apiJson } from './http';

export async function fetchTenders(params?: { status?: string; q?: string }): Promise<Tender[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; tenders: Tender[] }>(`/api/tenders${suffix}`);
  return data.tenders;
}

export async function fetchTenderById(id: string): Promise<Tender> {
  const data = await apiJson<{ success: true; tender: Tender }>(`/api/tenders/${id}`);
  return data.tender;
}

export async function createTenderApi(payload: Tender | Omit<Tender, 'id'> & { id?: string }): Promise<Tender> {
  const data = await apiJson<{ success: true; tender: Tender }>('/api/tenders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.tender;
}

export async function updateTenderApi(id: string, payload: Partial<Tender>): Promise<Tender> {
  const data = await apiJson<{ success: true; tender: Tender }>(`/api/tenders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.tender;
}

export async function deleteTenderApi(id: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/tenders/${id}`, { method: 'DELETE' });
}

export async function patchTenderStatusApi(
  id: string,
  status: Tender['status']
): Promise<Tender> {
  const data = await apiJson<{ success: true; tender: Tender }>(`/api/tenders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return data.tender;
}

export async function bulkImportTendersApi(tenders: Tender[]): Promise<Tender[]> {
  const data = await apiJson<{ success: true; tenders: Tender[] }>('/api/tenders/bulk-import', {
    method: 'POST',
    body: JSON.stringify({ tenders }),
  });
  return data.tenders;
}

export async function fetchTenderPackages(id: string): Promise<TenderVehiclePackage[]> {
  const data = await apiJson<{ success: true; packages: TenderVehiclePackage[] }>(
    `/api/tenders/${id}/packages`
  );
  return data.packages;
}

export async function updateTenderPackagesApi(
  id: string,
  packages: TenderVehiclePackage[]
): Promise<TenderVehiclePackage[]> {
  const data = await apiJson<{ success: true; packages: TenderVehiclePackage[] }>(
    `/api/tenders/${id}/packages`,
    {
      method: 'PUT',
      body: JSON.stringify({ packages }),
    }
  );
  return data.packages;
}

export async function fetchTenderDocuments(id: string): Promise<DocumentAttachment[]> {
  const data = await apiJson<{ success: true; documents: DocumentAttachment[] }>(
    `/api/tenders/${id}/documents`
  );
  return data.documents;
}

export async function addTenderDocumentApi(
  id: string,
  document: DocumentAttachment
): Promise<DocumentAttachment> {
  const data = await apiJson<{ success: true; document: DocumentAttachment }>(
    `/api/tenders/${id}/documents`,
    {
      method: 'POST',
      body: JSON.stringify({ document }),
    }
  );
  return data.document;
}

export async function deleteTenderDocumentApi(id: string, docId: string): Promise<void> {
  await apiJson<{ success: true }>(`/api/tenders/${id}/documents/${docId}`, {
    method: 'DELETE',
  });
}

export async function fetchOnCallDefaults(id: string): Promise<TenderOnCallDefaults | null> {
  const data = await apiJson<{ success: true; onCallDefaults: TenderOnCallDefaults | null }>(
    `/api/tenders/${id}/on-call-defaults`
  );
  return data.onCallDefaults;
}

export async function updateOnCallDefaultsApi(
  id: string,
  onCallDefaults: TenderOnCallDefaults | null
): Promise<TenderOnCallDefaults | null> {
  const data = await apiJson<{ success: true; onCallDefaults: TenderOnCallDefaults | null }>(
    `/api/tenders/${id}/on-call-defaults`,
    {
      method: 'PUT',
      body: JSON.stringify({ onCallDefaults }),
    }
  );
  return data.onCallDefaults;
}
