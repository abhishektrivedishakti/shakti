import type { PettyCashTransaction as DbPetty } from '../generated/prisma';
import type { PettyCashExpenseCategory, PettyCashTransaction } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export const PETTY_CATEGORIES: PettyCashExpenseCategory[] = [
  'fuel_emergency',
  'servicing_puncture',
  'vehicle_accessories',
  'fastag_toll_cash',
  'car_wash_cleaning',
  'driver_refreshments',
  'rto_puc_cash',
  'office_errands',
  'other_misc',
];

export function mapDbPettyCashToApi(row: DbPetty): PettyCashTransaction {
  return {
    id: row.id,
    type: (row.type as PettyCashTransaction['type']) || 'cash_expense',
    staffUserId: row.staffUserId,
    staffUserName: row.staffUserName,
    date: row.date,
    time: row.time ?? undefined,
    amount: row.amount,
    category: (row.category as PettyCashExpenseCategory) ?? undefined,
    vehicleId: row.vehicleId ?? undefined,
    vehicleNumber: row.vehicleNumber ?? undefined,
    payeeOrVendor: row.payeeOrVendor ?? undefined,
    billSlipNumber: row.billSlipNumber ?? undefined,
    billPhotoUrl: row.billPhotoUrl ?? undefined,
    notes: row.notes,
    paymentMode: (row.paymentMode as PettyCashTransaction['paymentMode']) || 'Cash',
    approvalStatus: (row.approvalStatus as PettyCashTransaction['approvalStatus']) || 'pending_verification',
    approvedByAdmin: row.approvedByAdmin ?? undefined,
    approvedAt: row.approvedAt ?? undefined,
    reimbursedToStaff: row.reimbursedToStaff,
  };
}

export function pettyCashDataFromBody(body: Record<string, unknown>) {
  const type = str(body.type, 'cash_expense') || 'cash_expense';
  const category = optStr(body.category);
  const paymentMode = str(body.paymentMode, 'Cash') || 'Cash';
  const approvalStatus = str(body.approvalStatus, 'pending_verification') || 'pending_verification';
  return {
    type: type === 'cash_inflow' ? 'cash_inflow' : 'cash_expense',
    staffUserId: str(body.staffUserId),
    staffUserName: str(body.staffUserName),
    date: str(body.date),
    time: optStr(body.time),
    amount: num(body.amount),
    category:
      category && PETTY_CATEGORIES.includes(category as PettyCashExpenseCategory)
        ? category
        : null,
    vehicleId: optStr(body.vehicleId),
    vehicleNumber: optStr(body.vehicleNumber),
    payeeOrVendor: optStr(body.payeeOrVendor),
    billSlipNumber: optStr(body.billSlipNumber),
    billPhotoUrl: optStr(body.billPhotoUrl),
    notes: str(body.notes),
    paymentMode:
      paymentMode === 'UPI / PhonePe' || paymentMode === 'Card' ? paymentMode : 'Cash',
    approvalStatus:
      approvalStatus === 'approved' || approvalStatus === 'rejected'
        ? approvalStatus
        : 'pending_verification',
    approvedByAdmin: optStr(body.approvedByAdmin),
    approvedAt: optStr(body.approvedAt),
    reimbursedToStaff: Boolean(body.reimbursedToStaff),
  };
}
