import { prisma } from '../prisma';
import { clearOperationalTables } from './operationalClear';
import { tenderCreateDataFromBody } from './tenderMapper';
import { companyDocDataFromBody } from './companyDocMapper';
import { officerDataFromBody } from './officerMapper';
import { driverDataFromBody } from './driverMapper';
import { vehicleDataFromBody } from './vehicleMapper';
import {
  driverAllocDataFromBody,
  officerAllocDataFromBody,
  vehicleAllocDataFromBody,
} from './allocationMapper';
import { dailyLogDataFromBody } from './dailyLogMapper';
import { maintenanceDataFromBody } from './maintenanceMapper';
import {
  fuelBillDataFromBody,
  fuelPumpDataFromBody,
  fuelRecordDataFromBody,
  fuelSlipDataFromBody,
} from './fuelMapper';
import { billSeriesDataFromBody, monthlyBillDataFromBody } from './billMapper';
import { vendorDataFromBody, vendorSettlementDataFromBody } from './vendorMapper';
import { khataDataFromBody, leaveDataFromBody } from './khataMapper';
import { dailyPaymentDataFromBody } from './dailyPaymentMapper';
import { statutoryDataFromBody } from './statutoryMapper';
import { pettyCashDataFromBody } from './pettyCashMapper';
import {
  bookingDataFromBody,
  directoryDataFromBody,
  profileDataFromBody,
  tariffPackageDataFromBody,
} from './dispatchMapper';

function asItems(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object') as Record<string, unknown>[];
}

async function createWithOptionalId(
  create: (data: Record<string, unknown> & { id?: string }) => Promise<unknown>,
  raw: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<boolean> {
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
  try {
    await create(id ? { id, ...data } : data);
    return true;
  } catch {
    return false;
  }
}

export type RestoreResult = {
  cleared: string[];
  restored: Record<string, number>;
};

/**
 * Destructive restore of operational modules from a Shakti backup payload.
 * Staff/auth users are never deleted or overwritten (backup has no password hashes).
 */
export async function restoreOperationalBackup(
  data: Record<string, unknown>
): Promise<RestoreResult> {
  const restored: Record<string, number> = {};

  const cleared = await prisma.$transaction(async (tx) => {
    return clearOperationalTables(tx);
  }, { timeout: 120_000 });

  // Masters first
  let n = 0;
  for (const raw of asItems(data.tenders)) {
    const body = tenderCreateDataFromBody(raw);
    if (await createWithOptionalId((d) => prisma.tender.create({ data: d as any }), raw, body as any))
      n++;
  }
  restored.tenders = n;

  n = 0;
  for (const raw of asItems(data.companyDocuments)) {
    const body = companyDocDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.companyDocument.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.companyDocuments = n;

  n = 0;
  for (const raw of asItems(data.officers)) {
    const body = officerDataFromBody(raw);
    if (await createWithOptionalId((d) => prisma.officer.create({ data: d as any }), raw, body as any))
      n++;
  }
  restored.officers = n;

  n = 0;
  for (const raw of asItems(data.drivers)) {
    const body = driverDataFromBody(raw);
    if (await createWithOptionalId((d) => prisma.driver.create({ data: d as any }), raw, body as any))
      n++;
  }
  restored.drivers = n;

  n = 0;
  for (const raw of asItems(data.vehicles)) {
    const body = vehicleDataFromBody(raw);
    if (await createWithOptionalId((d) => prisma.vehicle.create({ data: d as any }), raw, body as any))
      n++;
  }
  restored.vehicles = n;

  n = 0;
  for (const raw of asItems(data.driverAllocations)) {
    const body = driverAllocDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.driverAllocationHistory.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.driverAllocations = n;

  n = 0;
  for (const raw of asItems(data.vehicleAllocations)) {
    const body = vehicleAllocDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.vehicleAllocationHistory.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.vehicleAllocations = n;

  n = 0;
  for (const raw of asItems(data.officerAllocations)) {
    const body = officerAllocDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.officerAllocationHistory.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.officerAllocations = n;

  n = 0;
  for (const raw of asItems(data.dailyLogs)) {
    const body = dailyLogDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.dailyLogEntry.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.dailyLogs = n;

  n = 0;
  for (const raw of asItems(data.maintenanceRecords)) {
    const body = maintenanceDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.maintenanceRecord.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.maintenanceRecords = n;

  n = 0;
  for (const raw of asItems(data.fuelPumps)) {
    const body = fuelPumpDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.fuelPumpVendor.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.fuelPumps = n;

  n = 0;
  for (const raw of asItems(data.fuelSlips)) {
    const body = fuelSlipDataFromBody(raw);
    if (
      await createWithOptionalId((d) => prisma.fuelSlip.create({ data: d as any }), raw, body as any)
    )
      n++;
  }
  restored.fuelSlips = n;

  n = 0;
  for (const raw of asItems(data.fuelRecords)) {
    const body = fuelRecordDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.fuelRecord.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.fuelRecords = n;

  n = 0;
  for (const raw of asItems(data.fuelVendorBills)) {
    const body = fuelBillDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.fuelVendorMonthlyBill.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.fuelVendorBills = n;

  if (data.billSeries && typeof data.billSeries === 'object') {
    const series = billSeriesDataFromBody(data.billSeries as Record<string, unknown>);
    await prisma.billSeriesConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...series },
      update: series,
    });
    restored.billSeries = 1;
  } else {
    restored.billSeries = 0;
  }

  n = 0;
  for (const raw of asItems(data.bills)) {
    const body = monthlyBillDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.monthlyBill.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.bills = n;

  n = 0;
  for (const raw of asItems(data.vendors)) {
    const body = vendorDataFromBody(raw);
    if (await createWithOptionalId((d) => prisma.vendor.create({ data: d as any }), raw, body as any))
      n++;
  }
  restored.vendors = n;

  n = 0;
  for (const raw of asItems(data.vendorSettlements)) {
    const body = vendorSettlementDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.vendorSettlement.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.vendorSettlements = n;

  n = 0;
  for (const raw of asItems(data.khataTransactions)) {
    const body = khataDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.driverKhataTransaction.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.khataTransactions = n;

  n = 0;
  for (const raw of asItems(data.driverLeaves)) {
    const body = leaveDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.driverLeaveRecord.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.driverLeaves = n;

  n = 0;
  for (const raw of asItems(data.dailyPayments)) {
    const body = dailyPaymentDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.dailyPaymentEntry.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.dailyPayments = n;

  n = 0;
  for (const raw of asItems(data.statutoryPayroll)) {
    const body = statutoryDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.statutoryPayrollEntry.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.statutoryPayroll = n;

  n = 0;
  for (const raw of asItems(data.pettyCashTransactions)) {
    const body = pettyCashDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.pettyCashTransaction.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.pettyCashTransactions = n;

  if (data.dispatchProfile && typeof data.dispatchProfile === 'object') {
    const profile = profileDataFromBody(data.dispatchProfile as Record<string, unknown>);
    await prisma.dispatchProfile.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...profile },
      update: profile,
    });
    restored.dispatchProfile = 1;
  } else {
    restored.dispatchProfile = 0;
  }

  if (data.dispatchDirectory && typeof data.dispatchDirectory === 'object') {
    const directory = directoryDataFromBody(data.dispatchDirectory as Record<string, unknown>);
    await prisma.dispatchDirectory.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...directory },
      update: directory,
    });
    restored.dispatchDirectory = 1;
  } else {
    restored.dispatchDirectory = 0;
  }

  n = 0;
  for (const raw of asItems(data.dispatchTariffs)) {
    const body = tariffPackageDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.dispatchTariffPackage.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.dispatchTariffs = n;

  n = 0;
  for (const raw of asItems(data.dispatchBookings)) {
    const body = bookingDataFromBody(raw);
    if (
      await createWithOptionalId(
        (d) => prisma.dispatchBooking.create({ data: d as any }),
        raw,
        body as any
      )
    )
      n++;
  }
  restored.dispatchBookings = n;

  return { cleared, restored };
}

export function detectBackupCounts(data: Record<string, unknown>) {
  const count = (key: string) => (Array.isArray(data[key]) ? data[key].length : 0);
  return {
    users: count('users'),
    tenders: count('tenders'),
    vehicles: count('vehicles'),
    drivers: count('drivers'),
    officers: count('officers'),
    bills: count('bills'),
    dailyLogs: count('dailyLogs'),
    khataTransactions: count('khataTransactions'),
    dailyPayments: count('dailyPayments'),
    vendors: count('vendors'),
    dispatchBookings: count('dispatchBookings'),
    fuelRecords: count('fuelRecords'),
    pettyCashTransactions: count('pettyCashTransactions'),
  };
}
