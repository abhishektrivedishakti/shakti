import type { StatutoryPayrollEntry as DbPayroll } from '../generated/prisma';
import type { StatutoryPayrollEntry } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export function mapDbStatutoryToApi(row: DbPayroll): StatutoryPayrollEntry {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    phone: row.phone,
    uanNumber: row.uanNumber,
    esicIpNumber: row.esicIpNumber,
    tenderId: row.tenderId,
    tenderName: row.tenderName,
    vehicleNumber: row.vehicleNumber,
    monthYear: row.monthYear,
    totalMonthDays: row.totalMonthDays,
    daysWorked: row.daysWorked,
    weeklyOffs: row.weeklyOffs,
    paidLeave: row.paidLeave,
    payableDays: row.payableDays,
    basicWage: row.basicWage,
    vdaWage: row.vdaWage,
    hraWage: row.hraWage,
    grossEarned: row.grossEarned,
    epfEmployee12: row.epfEmployee12,
    esicEmployee075: row.esicEmployee075,
    advancesDeduction: row.advancesDeduction,
    totalEmployeeDeductions: row.totalEmployeeDeductions,
    netInHandSalary: row.netInHandSalary,
    epfEmployer13: row.epfEmployer13,
    esicEmployer325: row.esicEmployer325,
    statutoryBonus833: row.statutoryBonus833,
    totalCtcOutflow: row.totalCtcOutflow,
    paymentStatus: (row.paymentStatus as StatutoryPayrollEntry['paymentStatus']) || 'draft',
    salaryPaidDate: row.salaryPaidDate ?? undefined,
    bankUtr: row.bankUtr ?? undefined,
    epfTrrnChallan: row.epfTrrnChallan ?? undefined,
    esicChallanNo: row.esicChallanNo ?? undefined,
  };
}

export function statutoryDataFromBody(body: Record<string, unknown>) {
  const paymentStatus = str(body.paymentStatus, 'draft') || 'draft';
  return {
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    phone: str(body.phone),
    uanNumber: str(body.uanNumber),
    esicIpNumber: str(body.esicIpNumber),
    tenderId: str(body.tenderId),
    tenderName: str(body.tenderName),
    vehicleNumber: str(body.vehicleNumber),
    monthYear: str(body.monthYear),
    totalMonthDays: Math.max(0, Math.round(num(body.totalMonthDays, 30))),
    daysWorked: Math.max(0, Math.round(num(body.daysWorked))),
    weeklyOffs: Math.max(0, Math.round(num(body.weeklyOffs))),
    paidLeave: Math.max(0, Math.round(num(body.paidLeave))),
    payableDays: Math.max(0, Math.round(num(body.payableDays))),
    basicWage: num(body.basicWage),
    vdaWage: num(body.vdaWage),
    hraWage: num(body.hraWage),
    grossEarned: num(body.grossEarned),
    epfEmployee12: num(body.epfEmployee12),
    esicEmployee075: num(body.esicEmployee075),
    advancesDeduction: num(body.advancesDeduction),
    totalEmployeeDeductions: num(body.totalEmployeeDeductions),
    netInHandSalary: num(body.netInHandSalary),
    epfEmployer13: num(body.epfEmployer13),
    esicEmployer325: num(body.esicEmployer325),
    statutoryBonus833: num(body.statutoryBonus833),
    totalCtcOutflow: num(body.totalCtcOutflow),
    paymentStatus:
      paymentStatus === 'processed' || paymentStatus === 'deposited' ? paymentStatus : 'draft',
    salaryPaidDate: optStr(body.salaryPaidDate),
    bankUtr: optStr(body.bankUtr),
    epfTrrnChallan: optStr(body.epfTrrnChallan),
    esicChallanNo: optStr(body.esicChallanNo),
  };
}

function daysInMonth(monthYear: string): number {
  const [y, m] = monthYear.split('-').map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

export function buildPayrollEntryForDriver(opts: {
  driver: {
    id: string;
    name: string;
    phone: string;
    uanNumber?: string | null;
    esicIpNumber?: string | null;
    minimumWageBasic?: number | null;
    vda?: number | null;
    hra?: number | null;
    monthlySalary?: number | null;
  };
  monthYear: string;
  tenderId?: string;
  tenderName?: string;
  vehicleNumber?: string;
  daysWorked?: number;
  weeklyOffs?: number;
  paidLeave?: number;
  advancesDeduction?: number;
}): Omit<StatutoryPayrollEntry, 'id'> {
  const totalMonthDays = daysInMonth(opts.monthYear);
  const weeklyOffs = opts.weeklyOffs ?? 4;
  const paidLeave = opts.paidLeave ?? 0;
  const daysWorked =
    opts.daysWorked ?? Math.max(0, totalMonthDays - weeklyOffs - paidLeave);
  const payableDays = daysWorked + paidLeave;

  const basicWage = opts.driver.minimumWageBasic ?? 15600;
  const vdaWage = opts.driver.vda ?? 1820;
  const hraWage = opts.driver.hra ?? 1500;
  const monthlyGross = basicWage + vdaWage + hraWage;
  const proRate = totalMonthDays > 0 ? payableDays / totalMonthDays : 1;
  const grossEarned = Math.round(monthlyGross * proRate);

  const epfWageBase = Math.min(15000, basicWage + vdaWage);
  const epfEmployee12 = Math.round(epfWageBase * 0.12 * proRate);
  const esicEmployee075 = Math.round(grossEarned * 0.0075);
  const advancesDeduction = opts.advancesDeduction ?? 0;
  const totalEmployeeDeductions = epfEmployee12 + esicEmployee075 + advancesDeduction;
  const netInHandSalary = grossEarned - totalEmployeeDeductions;

  const epfEmployer13 = Math.round(epfWageBase * 0.13 * proRate);
  const esicEmployer325 = Math.round(grossEarned * 0.0325);
  const statutoryBonus833 = Math.round(grossEarned * 0.0833);
  const totalCtcOutflow =
    grossEarned + epfEmployer13 + esicEmployer325 + statutoryBonus833;

  return {
    driverId: opts.driver.id,
    driverName: opts.driver.name,
    phone: opts.driver.phone,
    uanNumber: opts.driver.uanNumber || '',
    esicIpNumber: opts.driver.esicIpNumber || '',
    tenderId: opts.tenderId || '',
    tenderName: opts.tenderName || '',
    vehicleNumber: opts.vehicleNumber || '',
    monthYear: opts.monthYear,
    totalMonthDays,
    daysWorked,
    weeklyOffs,
    paidLeave,
    payableDays,
    basicWage,
    vdaWage,
    hraWage,
    grossEarned,
    epfEmployee12,
    esicEmployee075,
    advancesDeduction,
    totalEmployeeDeductions,
    netInHandSalary,
    epfEmployer13,
    esicEmployer325,
    statutoryBonus833,
    totalCtcOutflow,
    paymentStatus: 'draft',
  };
}

export function complianceSummaryFromEntries(entries: StatutoryPayrollEntry[]) {
  const driverCount = new Set(entries.map((e) => e.driverId)).size;
  return {
    entryCount: entries.length,
    driverCount,
    totalGrossEarned: entries.reduce((s, e) => s + e.grossEarned, 0),
    totalEpfEmployee: entries.reduce((s, e) => s + e.epfEmployee12, 0),
    totalEsicEmployee: entries.reduce((s, e) => s + e.esicEmployee075, 0),
    totalEpfEmployer: entries.reduce((s, e) => s + e.epfEmployer13, 0),
    totalEsicEmployer: entries.reduce((s, e) => s + e.esicEmployer325, 0),
    totalBonus: entries.reduce((s, e) => s + e.statutoryBonus833, 0),
    totalNetInHand: entries.reduce((s, e) => s + e.netInHandSalary, 0),
    totalCtcOutflow: entries.reduce((s, e) => s + e.totalCtcOutflow, 0),
    draftCount: entries.filter((e) => e.paymentStatus === 'draft').length,
    processedCount: entries.filter((e) => e.paymentStatus === 'processed').length,
    depositedCount: entries.filter((e) => e.paymentStatus === 'deposited').length,
  };
}
