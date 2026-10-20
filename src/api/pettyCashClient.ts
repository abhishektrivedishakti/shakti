import type {
  DailyPaymentEntry,
  FuelRecord,
  MaintenanceRecord,
  PettyCashTransaction,
} from '../types';
import { apiJson } from './http';

export type PettyCashSideEffects = {
  payment?: DailyPaymentEntry;
  fuelRecord?: FuelRecord;
  maintenance?: MaintenanceRecord;
};

export async function fetchPettyCashTransactions(params?: {
  staffUserId?: string;
}): Promise<PettyCashTransaction[]> {
  const qs = new URLSearchParams();
  if (params?.staffUserId) qs.set('staffUserId', params.staffUserId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const data = await apiJson<{ success: true; transactions: PettyCashTransaction[] }>(
    `/api/petty-cash${suffix}`
  );
  return data.transactions;
}

export async function createPettyCashApi(
  payload: (PettyCashTransaction | (Omit<PettyCashTransaction, 'id'> & { id?: string })) & {
    skipSideEffects?: boolean;
  }
): Promise<{ transaction: PettyCashTransaction; sideEffects: PettyCashSideEffects }> {
  const data = await apiJson<{
    success: true;
    transaction: PettyCashTransaction;
    sideEffects: PettyCashSideEffects;
  }>('/api/petty-cash', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return { transaction: data.transaction, sideEffects: data.sideEffects || {} };
}

export async function updatePettyCashApi(
  id: string,
  payload: Partial<PettyCashTransaction>
): Promise<PettyCashTransaction> {
  const data = await apiJson<{ success: true; transaction: PettyCashTransaction }>(
    `/api/petty-cash/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) }
  );
  return data.transaction;
}

export async function approvePettyCashApi(
  id: string,
  payload: {
    approvalStatus: PettyCashTransaction['approvalStatus'];
    approvedByAdmin?: string;
    reimbursedToStaff?: boolean;
  }
): Promise<PettyCashTransaction> {
  const data = await apiJson<{ success: true; transaction: PettyCashTransaction }>(
    `/api/petty-cash/${id}/approval`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  );
  return data.transaction;
}

export async function deletePettyCashApi(id: string): Promise<void> {
  await apiJson<{ success: true; deleted: boolean }>(`/api/petty-cash/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchPettyCashBalance(staffUserId?: string): Promise<{
  balances: Array<{
    staffUserId: string;
    staffUserName: string;
    inflow: number;
    expense: number;
    balance: number;
  }>;
  balance: {
    staffUserId: string;
    staffUserName: string;
    inflow: number;
    expense: number;
    balance: number;
  } | null;
}> {
  const qs = staffUserId ? `?staffUserId=${encodeURIComponent(staffUserId)}` : '';
  const data = await apiJson<{
    success: true;
    balances: Array<{
      staffUserId: string;
      staffUserName: string;
      inflow: number;
      expense: number;
      balance: number;
    }>;
    balance: {
      staffUserId: string;
      staffUserName: string;
      inflow: number;
      expense: number;
      balance: number;
    } | null;
  }>(`/api/petty-cash/balance${qs}`);
  return { balances: data.balances, balance: data.balance };
}

export async function bulkImportPettyCashApi(
  transactions: PettyCashTransaction[]
): Promise<PettyCashTransaction[]> {
  const data = await apiJson<{ success: true; transactions: PettyCashTransaction[] }>(
    '/api/petty-cash/bulk-import',
    { method: 'POST', body: JSON.stringify({ transactions }) }
  );
  return data.transactions;
}
