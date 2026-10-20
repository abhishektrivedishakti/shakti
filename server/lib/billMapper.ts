import type {
  BillSeriesConfig as DbSeries,
  MonthlyBill as DbBill,
} from '../generated/prisma';
import type { BillSeriesConfig, MonthlyBill, PaymentStatus, Tender } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export const DEFAULT_BILL_SERIES: BillSeriesConfig = {
  prefix: 'ST/BILL/2026-27/',
  startingNumber: 1,
  currentNumber: 1,
  paddingDigits: 3,
  suffix: '',
  includeMonthYear: false,
  useTenderPrefix: true,
};

export const PAYMENT_STATUSES: PaymentStatus[] = [
  'draft',
  'submitted',
  'approved',
  'paid',
  'overdue',
];

export function mapDbBillSeriesToApi(row: DbSeries): BillSeriesConfig {
  return {
    prefix: row.prefix,
    startingNumber: row.startingNumber,
    currentNumber: row.currentNumber,
    paddingDigits: row.paddingDigits,
    suffix: row.suffix,
    includeMonthYear: row.includeMonthYear,
    useTenderPrefix: row.useTenderPrefix,
  };
}

export function billSeriesDataFromBody(body: Record<string, unknown>): BillSeriesConfig {
  return {
    prefix: str(body.prefix, DEFAULT_BILL_SERIES.prefix) || DEFAULT_BILL_SERIES.prefix,
    startingNumber: num(body.startingNumber, 1),
    currentNumber: num(body.currentNumber, num(body.startingNumber, 1)),
    paddingDigits: num(body.paddingDigits, 3),
    suffix: typeof body.suffix === 'string' ? body.suffix : '',
    includeMonthYear: Boolean(body.includeMonthYear),
    useTenderPrefix: body.useTenderPrefix !== false,
  };
}

export function formatBillNumber(
  config: BillSeriesConfig,
  opts?: {
    sequenceNum?: number;
    monthYear?: string;
    tender?: Pick<Tender, 'billSeriesPrefix'> | null;
    overridePrefix?: string;
  }
): string {
  const seq = opts?.sequenceNum !== undefined ? opts.sequenceNum : config.currentNumber;
  const padded = String(seq).padStart(config.paddingDigits || 3, '0');
  let prefix =
    opts?.overridePrefix !== undefined && opts.overridePrefix !== ''
      ? opts.overridePrefix
      : config.prefix;
  if (!opts?.overridePrefix && config.useTenderPrefix && opts?.tender?.billSeriesPrefix) {
    prefix = opts.tender.billSeriesPrefix;
  }
  const monthPart =
    config.includeMonthYear && opts?.monthYear
      ? `${opts.monthYear.replace('-', '')}/`
      : '';
  const suffix = config.suffix || '';
  return `${prefix}${monthPart}${padded}${suffix}`;
}

export function mapDbMonthlyBillToApi(row: DbBill): MonthlyBill {
  return {
    id: row.id,
    billNumber: row.billNumber,
    tenderId: row.tenderId,
    tenderName: row.tenderName,
    departmentName: row.departmentName,
    officerName: row.officerName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    monthYear: row.monthYear,
    billDate: row.billDate,
    dueDate: row.dueDate,
    baseAmount: row.baseAmount,
    totalKmsRun: row.totalKmsRun,
    allowedKms: row.allowedKms,
    extraKms: row.extraKms,
    extraKmRate: row.extraKmRate,
    extraKmAmount: row.extraKmAmount,
    totalHoursRun: row.totalHoursRun,
    allowedHours: row.allowedHours,
    extraHours: row.extraHours,
    extraHourRate: row.extraHourRate,
    extraHourAmount: row.extraHourAmount,
    nightHaltsCount: row.nightHaltsCount,
    nightHaltRate: row.nightHaltRate,
    nightHaltAmount: row.nightHaltAmount,
    tollParkingAmount: row.tollParkingAmount,
    penaltyDeductions: row.penaltyDeductions,
    penaltyRemarks: row.penaltyRemarks ?? undefined,
    grossAmount: row.grossAmount,
    gstPercent: row.gstPercent,
    gstAmount: row.gstAmount,
    tdsPercent: row.tdsPercent,
    tdsAmount: row.tdsAmount,
    netPayableAmount: row.netPayableAmount,
    paymentStatus: (row.paymentStatus as PaymentStatus) || 'draft',
    paymentReceivedDate: row.paymentReceivedDate ?? undefined,
    paymentRemarks: row.paymentRemarks ?? undefined,
    voucherNumber: row.voucherNumber ?? undefined,
    referenceVoucher: row.referenceVoucher ?? undefined,
  };
}

export function monthlyBillDataFromBody(body: Record<string, unknown>) {
  return {
    billNumber: str(body.billNumber),
    tenderId: str(body.tenderId),
    tenderName: str(body.tenderName),
    departmentName: str(body.departmentName),
    officerName: str(body.officerName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    monthYear: str(body.monthYear),
    billDate: str(body.billDate) || new Date().toISOString().slice(0, 10),
    dueDate: str(body.dueDate),
    baseAmount: num(body.baseAmount),
    totalKmsRun: num(body.totalKmsRun),
    allowedKms: num(body.allowedKms),
    extraKms: num(body.extraKms),
    extraKmRate: num(body.extraKmRate),
    extraKmAmount: num(body.extraKmAmount),
    totalHoursRun: num(body.totalHoursRun),
    allowedHours: num(body.allowedHours),
    extraHours: num(body.extraHours),
    extraHourRate: num(body.extraHourRate),
    extraHourAmount: num(body.extraHourAmount),
    nightHaltsCount: Math.round(num(body.nightHaltsCount)),
    nightHaltRate: num(body.nightHaltRate),
    nightHaltAmount: num(body.nightHaltAmount),
    tollParkingAmount: num(body.tollParkingAmount),
    penaltyDeductions: num(body.penaltyDeductions),
    penaltyRemarks: optStr(body.penaltyRemarks),
    grossAmount: num(body.grossAmount),
    gstPercent: num(body.gstPercent, 12),
    gstAmount: num(body.gstAmount),
    tdsPercent: num(body.tdsPercent, 2),
    tdsAmount: num(body.tdsAmount),
    netPayableAmount: num(body.netPayableAmount),
    paymentStatus: str(body.paymentStatus, 'draft') || 'draft',
    paymentReceivedDate: optStr(body.paymentReceivedDate),
    paymentRemarks: optStr(body.paymentRemarks),
    voucherNumber: optStr(body.voucherNumber),
    referenceVoucher: optStr(body.referenceVoucher),
  };
}

/** Server-side bill calc from tender + month logs (mirrors frontend calculateBillFromLogs). */
export function calculateBillAmounts(input: {
  tender: {
    baseMonthlyRate: number;
    includedKms: number;
    includedHours: number;
    extraKmRate: number;
    extraHourRate: number;
    nightHaltRate: number;
    tollTerms: string;
    packages?: unknown;
  };
  vehicle: { tenderPackageId?: string | null; vehicleType?: string | null };
  logs: Array<{
    totalKm: number;
    totalHours: number;
    dutyType: string;
    driverDaNightHalt: number;
    tollParkingCost: number;
  }>;
  penaltyDeductions?: number;
  gstPercent?: number;
  tdsPercent?: number;
}) {
  const penaltyDeductions = input.penaltyDeductions ?? 0;
  const gstPercent = input.gstPercent ?? 12;
  const tdsPercent = input.tdsPercent ?? 2;
  const tender = input.tender;

  const packages = Array.isArray(tender.packages)
    ? (tender.packages as Array<Record<string, unknown>>)
    : [];
  const pkg =
    (input.vehicle.tenderPackageId &&
      packages.find((p) => p.id === input.vehicle.tenderPackageId)) ||
    packages.find((p) =>
      String(p.vehicleCategory || '')
        .toLowerCase()
        .includes(String(input.vehicle.vehicleType || '').toLowerCase())
    ) ||
    (packages.length > 0 ? packages[0] : null);

  const totalKmRun = input.logs.reduce((s, l) => s + (Number(l.totalKm) || 0), 0);
  const totalHoursRun = input.logs.reduce((s, l) => s + (Number(l.totalHours) || 0), 0);
  const nightHaltsCount = input.logs.filter(
    (l) => l.dutyType === 'night_halt' || (l.driverDaNightHalt && l.driverDaNightHalt > 0)
  ).length;
  const tollParkingAmount = input.logs.reduce(
    (s, l) => s + (Number(l.tollParkingCost) || 0),
    0
  );

  const allowedKms = pkg ? num(pkg.includedKms) : tender.includedKms;
  const extraKmRate = pkg ? num(pkg.extraKmRate) : tender.extraKmRate;
  const extraKms = Math.max(0, totalKmRun - allowedKms);
  const extraKmAmount = extraKms * extraKmRate;

  const allowedHours = pkg ? num(pkg.includedHours) : tender.includedHours;
  const extraHourRate = pkg ? num(pkg.extraHourRate) : tender.extraHourRate;
  const extraHours = Math.max(0, Math.round((totalHoursRun - allowedHours) * 10) / 10);
  const extraHourAmount = Math.round(extraHours * extraHourRate);

  const nightHaltRate = pkg ? num(pkg.nightHaltRate) : tender.nightHaltRate;
  const nightHaltAmount = nightHaltsCount * nightHaltRate;
  const baseAmount = pkg ? num(pkg.monthlyBaseRate) : tender.baseMonthlyRate;
  const effectiveTollTerms = (pkg?.tollTerms as string) || tender.tollTerms;

  const grossAmount =
    baseAmount +
    extraKmAmount +
    extraHourAmount +
    nightHaltAmount +
    (effectiveTollTerms === 'reimbursable_actuals' ? tollParkingAmount : 0) -
    penaltyDeductions;

  const gstAmount = Math.round((grossAmount * gstPercent) / 100);
  const tdsAmount = Math.round((grossAmount * tdsPercent) / 100);
  const netPayableAmount = Math.round(grossAmount + gstAmount - tdsAmount);

  return {
    baseAmount,
    totalKmsRun: totalKmRun,
    allowedKms,
    extraKms,
    extraKmRate,
    extraKmAmount,
    totalHoursRun: Math.round(totalHoursRun * 10) / 10,
    allowedHours,
    extraHours,
    extraHourRate,
    extraHourAmount,
    nightHaltsCount,
    nightHaltRate,
    nightHaltAmount,
    tollParkingAmount,
    penaltyDeductions,
    grossAmount,
    gstPercent,
    gstAmount,
    tdsPercent,
    tdsAmount,
    netPayableAmount,
  };
}
