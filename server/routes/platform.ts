import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { mapDbUserToStaffUser } from '../lib/userMapper';
import { sendBadRequest, sendError, sendForbidden, sendSuccess } from '../lib/apiResponse';
import { canViewModule } from '../lib/moduleAccess';
import { mapDbTenderToApi } from '../lib/tenderMapper';
import { mapDbCompanyDocToApi } from '../lib/companyDocMapper';
import { mapDbOfficerToApi } from '../lib/officerMapper';
import { mapDbDriverToApi } from '../lib/driverMapper';
import { mapDbVehicleToApi } from '../lib/vehicleMapper';
import {
  mapDbDriverAllocToApi,
  mapDbOfficerAllocToApi,
  mapDbVehicleAllocToApi,
} from '../lib/allocationMapper';
import { mapDbDailyLogToApi } from '../lib/dailyLogMapper';
import { mapDbMaintenanceToApi } from '../lib/maintenanceMapper';
import {
  mapDbFuelBillToApi,
  mapDbFuelPumpToApi,
  mapDbFuelRecordToApi,
  mapDbFuelSlipToApi,
} from '../lib/fuelMapper';
import { mapDbBillSeriesToApi, mapDbMonthlyBillToApi } from '../lib/billMapper';
import { mapDbKhataToApi, mapDbLeaveToApi } from '../lib/khataMapper';
import { mapDbDailyPaymentToApi } from '../lib/dailyPaymentMapper';
import { mapDbVendorSettlementToApi, mapDbVendorToApi } from '../lib/vendorMapper';
import { mapDbStatutoryToApi } from '../lib/statutoryMapper';
import { mapDbPettyCashToApi } from '../lib/pettyCashMapper';
import {
  mapDbBookingToApi,
  mapDbDirectoryToApi,
  mapDbProfileToApi,
  mapDbTariffToApi,
} from '../lib/dispatchMapper';
import { clearOperationalTables } from '../lib/operationalClear';
import { detectBackupCounts, restoreOperationalBackup } from '../lib/backupRestore';
import { getStorageMode } from '../lib/fileStorage';

export const platformRouter = Router();

/** Shared lookups for dropdowns / UX helpers. */
platformRouter.get('/lookups/fuel-pumps', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'fuel_manager') && !canViewModule(req, 'dashboard')) {
      return sendForbidden(res);
    }
    const rows = await prisma.fuelPumpVendor.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, { pumps: rows.map(mapDbFuelPumpToApi) });
  } catch (err) {
    console.error('GET /api/lookups/fuel-pumps:', err);
    return sendError(res, 500, 'Could not load fuel pump lookups.');
  }
});

platformRouter.get('/lookups/vendors', requireAuth, async (req: Request, res: Response) => {
  try {
    if (
      !canViewModule(req, 'attached_vendors') &&
      !canViewModule(req, 'daily_payments') &&
      !canViewModule(req, 'dashboard')
    ) {
      return sendForbidden(res);
    }
    const rows = await prisma.vendor.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, { vendors: rows.map(mapDbVendorToApi) });
  } catch (err) {
    console.error('GET /api/lookups/vendors:', err);
    return sendError(res, 500, 'Could not load vendor lookups.');
  }
});

platformRouter.get('/lookups/vehicles', requireAuth, async (req: Request, res: Response) => {
  try {
    if (
      !canViewModule(req, 'vehicles_officers') &&
      !canViewModule(req, 'fleet_dispatch') &&
      !canViewModule(req, 'logbook') &&
      !canViewModule(req, 'dashboard')
    ) {
      return sendForbidden(res);
    }
    const rows = await prisma.vehicle.findMany({
      orderBy: { vehicleNumber: 'asc' },
      select: {
        id: true,
        vehicleNumber: true,
        makeModel: true,
        vehicleType: true,
        status: true,
        currentDriverId: true,
        assignedOfficerId: true,
        tenderId: true,
      },
    });
    return sendSuccess(res, { vehicles: rows });
  } catch (err) {
    console.error('GET /api/lookups/vehicles:', err);
    return sendError(res, 500, 'Could not load vehicle lookups.');
  }
});

platformRouter.get('/lookups/drivers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (
      !canViewModule(req, 'vehicles_officers') &&
      !canViewModule(req, 'fleet_dispatch') &&
      !canViewModule(req, 'drivers_khata') &&
      !canViewModule(req, 'dashboard')
    ) {
      return sendForbidden(res);
    }
    const rows = await prisma.driver.findMany({
      where: { status: { not: 'released' } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        currentVehicleId: true,
        driverCode: true,
      },
    });
    return sendSuccess(res, { drivers: rows });
  } catch (err) {
    console.error('GET /api/lookups/drivers:', err);
    return sendError(res, 500, 'Could not load driver lookups.');
  }
});

platformRouter.get('/lookups/officers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (
      !canViewModule(req, 'vehicles_officers') &&
      !canViewModule(req, 'fleet_dispatch') &&
      !canViewModule(req, 'dashboard')
    ) {
      return sendForbidden(res);
    }
    const rows = await prisma.officer.findMany({
      where: { status: { not: 'transferred' } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        designation: true,
        mobile: true,
        status: true,
        assignedVehicleId: true,
        department: true,
      },
    });
    return sendSuccess(res, { officers: rows });
  } catch (err) {
    console.error('GET /api/lookups/officers:', err);
    return sendError(res, 500, 'Could not load officer lookups.');
  }
});

platformRouter.get('/lookups/tenders', requireAuth, async (req: Request, res: Response) => {
  try {
    if (
      !canViewModule(req, 'tenders') &&
      !canViewModule(req, 'billing') &&
      !canViewModule(req, 'vehicles_officers') &&
      !canViewModule(req, 'dashboard')
    ) {
      return sendForbidden(res);
    }
    const rows = await prisma.tender.findMany({
      where: { status: 'active' },
      orderBy: { departmentName: 'asc' },
      select: {
        id: true,
        tenderNumber: true,
        workOrderNumber: true,
        departmentName: true,
        status: true,
        billSeriesPrefix: true,
      },
    });
    return sendSuccess(res, { tenders: rows });
  } catch (err) {
    console.error('GET /api/lookups/tenders:', err);
    return sendError(res, 500, 'Could not load tender lookups.');
  }
});

/**
 * Phase 10 backup: full operational export through Fleet Dispatch Pro.
 * Never includes password hashes.
 */
platformRouter.get('/export/backup', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      users,
      tenders,
      companyDocuments,
      officers,
      drivers,
      vehicles,
      driverAllocations,
      vehicleAllocations,
      officerAllocations,
      dailyLogs,
      maintenanceRecords,
      fuelPumps,
      fuelRecords,
      fuelSlips,
      fuelVendorBills,
      bills,
      billSeries,
      khataTransactions,
      driverLeaves,
      dailyPayments,
      vendors,
      vendorSettlements,
      statutoryPayroll,
      pettyCashTransactions,
      dispatchProfile,
      dispatchDirectory,
      dispatchTariffs,
      dispatchBookings,
    ] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.tender.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.companyDocument.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.officer.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.driver.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.vehicle.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.driverAllocationHistory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.vehicleAllocationHistory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.officerAllocationHistory.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.dailyLogEntry.findMany({ orderBy: { date: 'asc' } }),
      prisma.maintenanceRecord.findMany({ orderBy: { date: 'asc' } }),
      prisma.fuelPumpVendor.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.fuelRecord.findMany({ orderBy: { date: 'asc' } }),
      prisma.fuelSlip.findMany({ orderBy: { issueDate: 'asc' } }),
      prisma.fuelVendorMonthlyBill.findMany({ orderBy: { billDate: 'asc' } }),
      prisma.monthlyBill.findMany({ orderBy: { billDate: 'asc' } }),
      prisma.billSeriesConfig.findUnique({ where: { id: 'default' } }),
      prisma.driverKhataTransaction.findMany({ orderBy: { date: 'asc' } }),
      prisma.driverLeaveRecord.findMany({ orderBy: { startDate: 'asc' } }),
      prisma.dailyPaymentEntry.findMany({ orderBy: { date: 'asc' } }),
      prisma.vendor.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.vendorSettlement.findMany({ orderBy: { settlementDate: 'asc' } }),
      prisma.statutoryPayrollEntry.findMany({ orderBy: { monthYear: 'asc' } }),
      prisma.pettyCashTransaction.findMany({ orderBy: { date: 'asc' } }),
      prisma.dispatchProfile.findUnique({ where: { id: 'default' } }),
      prisma.dispatchDirectory.findUnique({ where: { id: 'default' } }),
      prisma.dispatchTariffPackage.findMany({ orderBy: { packageName: 'asc' } }),
      prisma.dispatchBooking.findMany({ orderBy: { reportingDate: 'asc' } }),
    ]);

    const payload = {
      companyName: 'Shakti Travels and Tours',
      version: 2,
      phase: 10,
      exportDate: new Date().toISOString(),
      storageMode: getStorageMode(),
      users: users.map((u) => mapDbUserToStaffUser(u)),
      tenders: tenders.map(mapDbTenderToApi),
      companyDocuments: companyDocuments.map(mapDbCompanyDocToApi),
      officers: officers.map(mapDbOfficerToApi),
      drivers: drivers.map(mapDbDriverToApi),
      vehicles: vehicles.map(mapDbVehicleToApi),
      driverAllocations: driverAllocations.map(mapDbDriverAllocToApi),
      vehicleAllocations: vehicleAllocations.map(mapDbVehicleAllocToApi),
      officerAllocations: officerAllocations.map(mapDbOfficerAllocToApi),
      dailyLogs: dailyLogs.map(mapDbDailyLogToApi),
      maintenanceRecords: maintenanceRecords.map(mapDbMaintenanceToApi),
      fuelPumps: fuelPumps.map(mapDbFuelPumpToApi),
      fuelRecords: fuelRecords.map(mapDbFuelRecordToApi),
      fuelSlips: fuelSlips.map(mapDbFuelSlipToApi),
      fuelVendorBills: fuelVendorBills.map(mapDbFuelBillToApi),
      bills: bills.map(mapDbMonthlyBillToApi),
      billSeries: billSeries ? mapDbBillSeriesToApi(billSeries) : null,
      khataTransactions: khataTransactions.map(mapDbKhataToApi),
      driverLeaves: driverLeaves.map(mapDbLeaveToApi),
      dailyPayments: dailyPayments.map(mapDbDailyPaymentToApi),
      vendors: vendors.map(mapDbVendorToApi),
      vendorSettlements: vendorSettlements.map(mapDbVendorSettlementToApi),
      statutoryPayroll: statutoryPayroll.map(mapDbStatutoryToApi),
      pettyCashTransactions: pettyCashTransactions.map(mapDbPettyCashToApi),
      dispatchProfile: dispatchProfile ? mapDbProfileToApi(dispatchProfile) : null,
      dispatchDirectory: dispatchDirectory ? mapDbDirectoryToApi(dispatchDirectory) : null,
      dispatchTariffs: dispatchTariffs.map(mapDbTariffToApi),
      dispatchBookings: dispatchBookings.map(mapDbBookingToApi),
      note: 'Phase 10 backup includes staff profiles (no password hashes) and all operational modules through Fleet Dispatch Pro.',
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shakti-backup-phase10-${new Date().toISOString().slice(0, 10)}.json"`
    );
    return res.status(200).json({ success: true, data: payload });
  } catch (err: unknown) {
    console.error('GET /api/export/backup:', err);
    return sendError(res, 500, 'Backup export failed.');
  }
});

/**
 * Validate backup, or fully restore operational data when confirmRestore=true.
 * Staff/auth users are never deleted (backup does not include password hashes).
 */
platformRouter.post('/import/backup', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return sendBadRequest(res, 'Invalid backup payload.');
    }

    const data =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : body;

    const detected = detectBackupCounts(data);
    const hasOps =
      detected.tenders +
        detected.vehicles +
        detected.bills +
        detected.dailyLogs +
        detected.khataTransactions +
        detected.dailyPayments +
        detected.vendors +
        detected.dispatchBookings +
        detected.fuelRecords +
        detected.drivers +
        detected.officers >
      0;

    if (!detected.users && !hasOps) {
      return sendBadRequest(res, 'Backup JSON does not look like a Shakti export.');
    }

    const confirmRestore =
      body.confirmRestore === true ||
      body.confirmRestore === 'yes' ||
      body.confirm === true ||
      body.confirm === 'yes';

    if (!confirmRestore) {
      return sendSuccess(res, {
        message:
          'Backup validated. Pass confirmRestore: true to replace operational data from this backup. Staff logins are never overwritten.',
        accepted: true,
        restored: false,
        phase: 10,
        detected,
      });
    }

    const result = await restoreOperationalBackup(data);
    return sendSuccess(res, {
      message:
        'Operational data restored from backup. Staff/auth users were left untouched (re-seed admin if needed).',
      accepted: true,
      restored: true,
      phase: 10,
      detected,
      cleared: result.cleared,
      counts: result.restored,
    });
  } catch (err: unknown) {
    console.error('POST /api/import/backup:', err);
    return sendError(res, 500, 'Backup import failed.');
  }
});

/**
 * Clears operational tables. Never deletes staff/auth users.
 */
platformRouter.post(
  '/admin/reset-operational-data',
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as Record<string, unknown>;
      if (body.confirm !== true && body.confirm !== 'yes') {
        return sendBadRequest(res, 'Pass { "confirm": true } to acknowledge this destructive action.');
      }

      const cleared = await prisma.$transaction(async (tx) => clearOperationalTables(tx), {
        timeout: 120_000,
      });

      return sendSuccess(res, {
        message: 'Operational data cleared. Staff/auth users were left untouched.',
        cleared,
        phase: 10,
      });
    } catch (err: unknown) {
      console.error('POST /api/admin/reset-operational-data:', err);
      return sendError(res, 500, 'Reset failed.');
    }
  }
);
