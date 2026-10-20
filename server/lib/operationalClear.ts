import type { Prisma } from '../generated/prisma';

/** Clears all operational tables. Never touches staff/auth users. */
export async function clearOperationalTables(
  tx: Prisma.TransactionClient
): Promise<string[]> {
  const ops: Array<[string, () => Promise<unknown>]> = [
    ['dispatchBooking', () => tx.dispatchBooking.deleteMany()],
    ['dispatchTariffPackage', () => tx.dispatchTariffPackage.deleteMany()],
    ['dispatchDirectory', () => tx.dispatchDirectory.deleteMany()],
    ['dispatchProfile', () => tx.dispatchProfile.deleteMany()],
    ['pettyCashTransaction', () => tx.pettyCashTransaction.deleteMany()],
    ['statutoryPayrollEntry', () => tx.statutoryPayrollEntry.deleteMany()],
    ['vendorSettlement', () => tx.vendorSettlement.deleteMany()],
    ['dailyPaymentEntry', () => tx.dailyPaymentEntry.deleteMany()],
    ['driverKhataTransaction', () => tx.driverKhataTransaction.deleteMany()],
    ['driverLeaveRecord', () => tx.driverLeaveRecord.deleteMany()],
    ['vendor', () => tx.vendor.deleteMany()],
    ['monthlyBill', () => tx.monthlyBill.deleteMany()],
    ['billSeriesConfig', () => tx.billSeriesConfig.deleteMany()],
    ['fuelVendorMonthlyBill', () => tx.fuelVendorMonthlyBill.deleteMany()],
    ['fuelSlip', () => tx.fuelSlip.deleteMany()],
    ['fuelRecord', () => tx.fuelRecord.deleteMany()],
    ['fuelPumpVendor', () => tx.fuelPumpVendor.deleteMany()],
    ['maintenanceRecord', () => tx.maintenanceRecord.deleteMany()],
    ['dailyLogEntry', () => tx.dailyLogEntry.deleteMany()],
    ['driverAllocationHistory', () => tx.driverAllocationHistory.deleteMany()],
    ['vehicleAllocationHistory', () => tx.vehicleAllocationHistory.deleteMany()],
    ['officerAllocationHistory', () => tx.officerAllocationHistory.deleteMany()],
    ['vehicle', () => tx.vehicle.deleteMany()],
    ['driver', () => tx.driver.deleteMany()],
    ['officer', () => tx.officer.deleteMany()],
    ['companyDocument', () => tx.companyDocument.deleteMany()],
    ['tender', () => tx.tender.deleteMany()],
  ];
  const cleared: string[] = [];
  for (const [name, run] of ops) {
    await run();
    cleared.push(name);
  }
  return cleared;
}
