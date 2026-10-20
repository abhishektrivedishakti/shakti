import type { DailyPaymentEntry as DbPayment } from '../generated/prisma';
import type { DailyPaymentEntry, PaymentCategory } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export const PAYMENT_CATEGORIES: PaymentCategory[] = [
  'driver_advance',
  'driver_salary',
  'vendor_rent',
  'fuel',
  'maintenance',
  'fastag_toll',
  'police_challan',
  'emergency_expense',
  'other',
];

export const PAYEE_TYPES = [
  'driver',
  'vendor',
  'fuel_pump',
  'workshop',
  'toll',
  'other',
] as const;

export function mapDbDailyPaymentToApi(row: DbPayment): DailyPaymentEntry {
  return {
    id: row.id,
    date: row.date,
    category: (row.category as PaymentCategory) || 'other',
    amount: row.amount,
    paymentMode: (row.paymentMode as DailyPaymentEntry['paymentMode']) || 'cash',
    referenceNumber: row.referenceNumber ?? undefined,
    payeeName: row.payeeName,
    payeeType: (row.payeeType as DailyPaymentEntry['payeeType']) || 'other',
    driverId: row.driverId ?? undefined,
    vendorId: row.vendorId ?? undefined,
    vehicleId: row.vehicleId ?? undefined,
    vehicleNumber: row.vehicleNumber ?? undefined,
    description: row.description,
    autoRoutedTo: row.autoRoutedTo,
    recordedBy: row.recordedBy ?? undefined,
  };
}

export function dailyPaymentDataFromBody(body: Record<string, unknown>) {
  const category = str(body.category, 'other') || 'other';
  const paymentMode = str(body.paymentMode, 'cash') || 'cash';
  const payeeType = str(body.payeeType, 'other') || 'other';
  const modeOk =
    paymentMode === 'cash' ||
    paymentMode === 'upi' ||
    paymentMode === 'bank_transfer' ||
    paymentMode === 'cheque'
      ? paymentMode
      : 'cash';
  return {
    date: str(body.date),
    category: PAYMENT_CATEGORIES.includes(category as PaymentCategory) ? category : 'other',
    amount: num(body.amount),
    paymentMode: modeOk,
    referenceNumber: optStr(body.referenceNumber),
    payeeName: str(body.payeeName),
    payeeType: (PAYEE_TYPES as readonly string[]).includes(payeeType) ? payeeType : 'other',
    driverId: optStr(body.driverId),
    vendorId: optStr(body.vendorId),
    vehicleId: optStr(body.vehicleId),
    vehicleNumber: optStr(body.vehicleNumber),
    description: str(body.description),
    autoRoutedTo: str(body.autoRoutedTo),
    recordedBy: optStr(body.recordedBy),
  };
}

export function resolveAutoRoutedTo(category: string): string {
  switch (category) {
    case 'driver_advance':
      return 'Driver Advance Khata';
    case 'driver_salary':
      return 'Driver Salary Khata';
    case 'fastag_toll':
      return 'Driver FASTag Khata';
    case 'fuel':
      return 'Fuel Records';
    case 'maintenance':
      return 'Vehicle Maintenance';
    case 'vendor_rent':
      return 'Vendor Settlement Ledger';
    case 'emergency_expense':
      return 'Emergency / Misc Outflow';
    default:
      return 'Daily Payments Journal';
  }
}
