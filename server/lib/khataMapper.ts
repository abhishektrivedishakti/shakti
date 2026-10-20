import type {
  DriverKhataTransaction as DbKhata,
  DriverLeaveRecord as DbLeave,
} from '../generated/prisma';
import type {
  DriverKhataTransaction,
  DriverKhataTransactionType,
  DriverLeaveRecord,
} from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export const KHATA_TYPES: DriverKhataTransactionType[] = [
  'advance',
  'salary_payment',
  'trip_expense',
  'fastag_topup',
  'penalty_deduction',
  'fuel_budget_advance',
  'da_food_expense',
  'bonus',
  'leave_deduction',
  'other',
];

export function mapDbKhataToApi(row: DbKhata): DriverKhataTransaction {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    date: row.date,
    type: (row.type as DriverKhataTransactionType) || 'other',
    amount: row.amount,
    description: row.description,
    paymentMode: (row.paymentMode as DriverKhataTransaction['paymentMode']) || 'cash',
    referenceNumber: row.referenceNumber ?? undefined,
    tenderId: row.tenderId ?? undefined,
    vehicleId: row.vehicleId ?? undefined,
    vehicleNumber: row.vehicleNumber ?? undefined,
    officerId: row.officerId ?? undefined,
    recordedBy: row.recordedBy ?? undefined,
  };
}

export function khataDataFromBody(body: Record<string, unknown>) {
  const type = str(body.type, 'other') || 'other';
  const paymentMode = str(body.paymentMode, 'cash') || 'cash';
  return {
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    date: str(body.date),
    type: KHATA_TYPES.includes(type as DriverKhataTransactionType) ? type : 'other',
    amount: num(body.amount),
    description: str(body.description),
    paymentMode:
      paymentMode === 'upi' || paymentMode === 'bank_transfer' ? paymentMode : 'cash',
    referenceNumber: optStr(body.referenceNumber),
    tenderId: optStr(body.tenderId),
    vehicleId: optStr(body.vehicleId),
    vehicleNumber: optStr(body.vehicleNumber),
    officerId: optStr(body.officerId),
    recordedBy: optStr(body.recordedBy),
  };
}

export function mapDbLeaveToApi(row: DbLeave): DriverLeaveRecord {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    tenderId: row.tenderId,
    tenderName: row.tenderName ?? undefined,
    officerId: row.officerId ?? undefined,
    officerName: row.officerName ?? undefined,
    startDate: row.startDate,
    endDate: row.endDate,
    totalDays: row.totalDays,
    leaveReason: row.leaveReason,
    hasSubstitute: row.hasSubstitute,
    substituteDriverType: (row.substituteDriverType as DriverLeaveRecord['substituteDriverType']) ?? undefined,
    substituteDriverId: row.substituteDriverId ?? undefined,
    substituteDriverName: row.substituteDriverName ?? undefined,
    substituteDriverPhone: row.substituteDriverPhone ?? undefined,
    dailySubstitutePay: row.dailySubstitutePay,
    totalSubstitutePaid: row.totalSubstitutePaid,
    substitutePaymentMode: (row.substitutePaymentMode as DriverLeaveRecord['substitutePaymentMode']) ?? undefined,
    deductFromMainDriverSalary: row.deductFromMainDriverSalary,
    deductionAmount: row.deductionAmount,
    notes: row.notes ?? undefined,
    recordedBy: row.recordedBy ?? undefined,
    createdAt: row.createdAt || new Date().toISOString(),
  };
}

export function leaveDataFromBody(body: Record<string, unknown>) {
  return {
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    tenderId: str(body.tenderId),
    tenderName: optStr(body.tenderName),
    officerId: optStr(body.officerId),
    officerName: optStr(body.officerName),
    startDate: str(body.startDate),
    endDate: str(body.endDate),
    totalDays: Math.max(0, Math.round(num(body.totalDays))),
    leaveReason: str(body.leaveReason),
    hasSubstitute: Boolean(body.hasSubstitute),
    substituteDriverType: optStr(body.substituteDriverType),
    substituteDriverId: optStr(body.substituteDriverId),
    substituteDriverName: optStr(body.substituteDriverName),
    substituteDriverPhone: optStr(body.substituteDriverPhone),
    dailySubstitutePay: num(body.dailySubstitutePay),
    totalSubstitutePaid: num(body.totalSubstitutePaid),
    substitutePaymentMode: optStr(body.substitutePaymentMode),
    deductFromMainDriverSalary: Boolean(body.deductFromMainDriverSalary),
    deductionAmount: num(body.deductionAmount),
    notes: optStr(body.notes),
    recordedBy: optStr(body.recordedBy),
    createdAt: str(body.createdAt, new Date().toISOString()) || new Date().toISOString(),
  };
}

export function summarizeKhataForDriver(
  driverId: string,
  driverName: string,
  transactions: DriverKhataTransaction[]
) {
  const driverTx = transactions.filter((t) => t.driverId === driverId);
  let totalAdvanceGiven = 0;
  let totalSalaryPaid = 0;
  let totalTripExpenseFastag = 0;
  let totalFuelAdvance = 0;

  for (const tx of driverTx) {
    if (tx.type === 'advance') totalAdvanceGiven += tx.amount;
    else if (tx.type === 'salary_payment') totalSalaryPaid += tx.amount;
    else if (tx.type === 'trip_expense' || tx.type === 'fastag_topup') {
      totalTripExpenseFastag += tx.amount;
    } else if (tx.type === 'fuel_budget_advance') totalFuelAdvance += tx.amount;
  }

  return {
    driverId,
    driverName,
    totalAdvanceGiven,
    totalSalaryPaid,
    totalTripExpenseFastag,
    currentAdvanceBalance: totalAdvanceGiven,
    pendingFuelBudgetBalance: totalFuelAdvance,
    transactionCount: driverTx.length,
  };
}
