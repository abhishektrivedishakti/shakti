import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import { canViewModule } from '../lib/moduleAccess';
import { sendForbidden } from '../lib/apiResponse';
import { sendError, sendSuccess } from '../lib/apiResponse';
import type { ReminderItem } from '../../src/types';

export const dashboardRouter = Router();

function daysUntil(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null;
  const end = new Date(`${expiryDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Phase 7: staff + fleet + ops + fuel + govt bills on DB.
 * Khata/petty/vendor settlement fields stay pending until later phases.
 */
dashboardRouter.get('/summary', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'dashboard')) return sendForbidden(res);
    const [
      staffTotal,
      staffActive,
      staffInactive,
      admins,
      activeTenders,
      companyDocTotal,
      expiringDocs,
      totalVehicles,
      activeVehicles,
      officerTotal,
      driverTotal,
      vehicleRows,
      pendingBills,
      openFuelSlips,
      unpaidFuelBills,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { status: 'inactive' } }),
      prisma.user.count({ where: { role: 'admin', status: 'active' } }),
      prisma.tender.count({ where: { status: 'active' } }),
      prisma.companyDocument.count(),
      prisma.companyDocument.findMany({
        where: { isLifetime: false, expiryDate: { not: null } },
        select: { id: true, expiryDate: true, alertDaysBefore: true },
      }),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: 'active' } }),
      prisma.officer.count(),
      prisma.driver.count(),
      prisma.vehicle.findMany({
        select: {
          insuranceExpiry: true,
          rtoFitnessExpiry: true,
          pucExpiry: true,
          roadTaxExpiry: true,
          permitExpiry: true,
        },
      }),
      prisma.monthlyBill.findMany({
        where: { paymentStatus: { in: ['draft', 'submitted', 'approved', 'overdue'] } },
        select: { netPayableAmount: true, paymentStatus: true, dueDate: true },
      }),
      prisma.fuelSlip.count({ where: { status: { in: ['issued', 'filled'] } } }),
      prisma.fuelVendorMonthlyBill.count({
        where: { paymentStatus: { in: ['pending', 'partially_paid'] } },
      }),
    ]);

    const docReminders = expiringDocs.filter((d) => {
      const days = daysUntil(d.expiryDate);
      if (days === null) return false;
      return days <= (d.alertDaysBefore || 30);
    }).length;

    let vehicleDocReminders = 0;
    for (const v of vehicleRows) {
      for (const exp of [
        v.insuranceExpiry,
        v.rtoFitnessExpiry,
        v.pucExpiry,
        v.roadTaxExpiry,
        v.permitExpiry,
      ]) {
        const days = daysUntil(exp);
        if (days !== null && days <= 30) vehicleDocReminders += 1;
      }
    }

    const billReminders = pendingBills.filter((b) => {
      if (b.paymentStatus === 'overdue') return true;
      const days = daysUntil(b.dueDate);
      return days !== null && days <= 15;
    }).length;

    const pendingBillsAmount = pendingBills.reduce(
      (sum, b) => sum + (Number(b.netPayableAmount) || 0),
      0
    );
    const openReminders = docReminders + vehicleDocReminders + billReminders;

    return sendSuccess(res, {
      phase: 10,
      generatedAt: new Date().toISOString(),
      sources: {
        staff: 'database',
        tenders: 'database',
        vehicles: 'database',
        officers: 'database',
        drivers: 'database',
        allocations: 'database',
        dailyLogs: 'database',
        maintenance: 'database',
        fuel: 'database',
        bills: 'database',
        companyDocuments: 'database',
      },
      staff: {
        total: staffTotal,
        active: staffActive,
        inactive: staffInactive,
        admins,
      },
      fleet: {
        totalVehicles,
        activeVehicles,
        officers: officerTotal,
        drivers: driverTotal,
        activeTenders,
        pendingBillsAmount: Math.round(pendingBillsAmount),
        openReminders,
        openFuelSlips,
        unpaidFuelVendorBills: unpaidFuelBills,
      },
      companyDocuments: {
        total: companyDocTotal,
        expiringSoon: docReminders,
      },
    });
  } catch (err) {
    console.error('GET /api/dashboard/summary:', err);
    return sendError(res, 500, 'Could not load dashboard summary.');
  }
});

dashboardRouter.get('/kpis', requireAuth, async (req: Request, res: Response) => {
  if (!canViewModule(req, 'dashboard')) return sendForbidden(res);
  try {
    const [
      activeStaff,
      activeTenders,
      companyDocs,
      fleetSize,
      officers,
      drivers,
      pendingBills,
      openFuelSlips,
    ] = await Promise.all([
      prisma.user.count({ where: { status: 'active' } }),
      prisma.tender.count({ where: { status: 'active' } }),
      prisma.companyDocument.count(),
      prisma.vehicle.count(),
      prisma.officer.count({ where: { status: 'active' } }),
      prisma.driver.count({ where: { status: 'active' } }),
      prisma.monthlyBill.findMany({
        where: { paymentStatus: { in: ['draft', 'submitted', 'approved', 'overdue'] } },
        select: { netPayableAmount: true },
      }),
      prisma.fuelSlip.count({ where: { status: { in: ['issued', 'filled'] } } }),
    ]);

    const pendingBillsAmount = Math.round(
      pendingBills.reduce((sum, b) => sum + (Number(b.netPayableAmount) || 0), 0)
    );

    return sendSuccess(res, {
      phase: 10,
      kpis: [
        { id: 'active_staff', label: 'Active staff', value: activeStaff, unit: 'count' },
        { id: 'active_tenders', label: 'Active tenders', value: activeTenders, unit: 'count' },
        { id: 'fleet_size', label: 'Fleet size', value: fleetSize, unit: 'count' },
        { id: 'active_officers', label: 'Active officers', value: officers, unit: 'count' },
        { id: 'active_drivers', label: 'Active drivers', value: drivers, unit: 'count' },
        { id: 'company_documents', label: 'Company documents', value: companyDocs, unit: 'count' },
        { id: 'pending_bills', label: 'Pending bills', value: pendingBillsAmount, unit: 'inr' },
        { id: 'open_fuel_slips', label: 'Open fuel slips', value: openFuelSlips, unit: 'count' },
      ],
    });
  } catch (err) {
    console.error('GET /api/dashboard/kpis:', err);
    return sendError(res, 500, 'Could not load KPIs.');
  }
});

dashboardRouter.get('/expiry-strip', requireAuth, async (req: Request, res: Response) => {
  if (!canViewModule(req, 'dashboard')) return sendForbidden(res);
  try {
    const [docs, vehicles] = await Promise.all([
      prisma.companyDocument.findMany({
        where: { isLifetime: false, expiryDate: { not: null } },
        orderBy: { expiryDate: 'asc' },
        take: 40,
      }),
      prisma.vehicle.findMany({
        select: {
          id: true,
          vehicleNumber: true,
          insuranceExpiry: true,
          rtoFitnessExpiry: true,
          pucExpiry: true,
          roadTaxExpiry: true,
          permitExpiry: true,
        },
      }),
    ]);

    const items: Array<{
      id: string;
      label: string;
      dueDate: string;
      daysLeft: number;
      kind: string;
    }> = [];

    for (const d of docs) {
      const days = daysUntil(d.expiryDate);
      if (days === null || days > (d.alertDaysBefore || 30)) continue;
      items.push({
        id: `cdoc-${d.id}`,
        label: d.title,
        dueDate: d.expiryDate!,
        daysLeft: days,
        kind: 'company_document',
      });
    }

    for (const v of vehicles) {
      const checks: Array<[string, string]> = [
        ['insurance', v.insuranceExpiry],
        ['fitness', v.rtoFitnessExpiry],
        ['puc', v.pucExpiry],
        ['road_tax', v.roadTaxExpiry],
        ['permit', v.permitExpiry],
      ];
      for (const [kind, exp] of checks) {
        const days = daysUntil(exp);
        if (days === null || days > 30) continue;
        items.push({
          id: `veh-${v.id}-${kind}`,
          label: `${v.vehicleNumber} ${kind}`,
          dueDate: exp,
          daysLeft: days,
          kind,
        });
      }
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);

    return sendSuccess(res, {
      phase: 10,
      items: items.slice(0, 50),
      note: 'Company + vehicle document expiries. Bill due alerts are on /api/reminders.',
    });
  } catch (err) {
    console.error('GET /api/dashboard/expiry-strip:', err);
    return sendError(res, 500, 'Could not load expiry strip.');
  }
});

export const remindersRouter = Router();

remindersRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  if (!canViewModule(req, 'reminders') && !canViewModule(req, 'dashboard')) {
    return sendForbidden(res);
  }
  try {
    const [tenders, docs, vehicles, drivers, bills] = await Promise.all([
      prisma.tender.findMany({
        where: { status: 'active' },
        select: {
          id: true,
          tenderNumber: true,
          departmentName: true,
          contractPeriodEnd: true,
        },
      }),
      prisma.companyDocument.findMany({
        where: { isLifetime: false, expiryDate: { not: null } },
      }),
      prisma.vehicle.findMany({
        select: {
          id: true,
          vehicleNumber: true,
          insuranceExpiry: true,
          rtoFitnessExpiry: true,
          pucExpiry: true,
          roadTaxExpiry: true,
          permitExpiry: true,
        },
      }),
      prisma.driver.findMany({
        select: {
          id: true,
          name: true,
          licenseExpiry: true,
          policeVerificationExpiry: true,
        },
      }),
      prisma.monthlyBill.findMany({
        where: { paymentStatus: { in: ['draft', 'submitted', 'approved', 'overdue'] } },
        select: {
          id: true,
          billNumber: true,
          departmentName: true,
          dueDate: true,
          paymentStatus: true,
          netPayableAmount: true,
          tenderId: true,
          vehicleId: true,
        },
      }),
    ]);

    const reminders: ReminderItem[] = [];

    for (const t of tenders) {
      const days = daysUntil(t.contractPeriodEnd);
      if (days === null || days > 45) continue;
      reminders.push({
        id: `tender-end-${t.id}`,
        type: 'doc_expiry',
        title: `Tender ending: ${t.tenderNumber}`,
        description: `${t.departmentName} contract ends ${t.contractPeriodEnd}`,
        dueDate: t.contractPeriodEnd,
        severity: days < 0 || days <= 15 ? 'high' : 'medium',
        metadata: {
          tenderId: t.id,
          entityName: t.departmentName,
          docType: 'tender_contract_end',
        },
      });
    }

    for (const d of docs) {
      const days = daysUntil(d.expiryDate);
      if (days === null || days > (d.alertDaysBefore || 30)) continue;
      reminders.push({
        id: `cdoc-${d.id}`,
        type: 'company_doc_expiry',
        title: `Doc expiry: ${d.title}`,
        description: `${d.docNumber || '—'} · ${d.expiryDate}`,
        dueDate: d.expiryDate!,
        severity: days < 0 || days <= 7 ? 'high' : days <= 15 ? 'medium' : 'info',
        metadata: {
          companyDocId: d.id,
          entityName: d.title,
          docType: d.category,
        },
      });
    }

    for (const v of vehicles) {
      const checks: Array<[string, string]> = [
        ['insurance', v.insuranceExpiry],
        ['fitness', v.rtoFitnessExpiry],
        ['puc', v.pucExpiry],
        ['road_tax', v.roadTaxExpiry],
        ['permit', v.permitExpiry],
      ];
      for (const [docType, exp] of checks) {
        const days = daysUntil(exp);
        if (days === null || days > 30) continue;
        reminders.push({
          id: `veh-${v.id}-${docType}`,
          type: 'doc_expiry',
          title: `${v.vehicleNumber} ${docType} expiry`,
          description: `Expires ${exp}`,
          dueDate: exp,
          severity: days < 0 || days <= 7 ? 'high' : days <= 15 ? 'medium' : 'info',
          metadata: {
            vehicleId: v.id,
            entityName: v.vehicleNumber,
            docType,
          },
        });
      }
    }

    for (const d of drivers) {
      for (const [docType, exp] of [
        ['license', d.licenseExpiry],
        ['police_verification', d.policeVerificationExpiry],
      ] as const) {
        const days = daysUntil(exp);
        if (days === null || days > 30) continue;
        reminders.push({
          id: `drv-${d.id}-${docType}`,
          type: docType === 'police_verification' ? 'police_verification' : 'doc_expiry',
          title: `${d.name} ${docType} expiry`,
          description: `Expires ${exp}`,
          dueDate: exp,
          severity: days < 0 || days <= 7 ? 'high' : days <= 15 ? 'medium' : 'info',
          metadata: {
            driverId: d.id,
            entityName: d.name,
            docType,
          },
        });
      }
    }

    for (const b of bills) {
      const days = daysUntil(b.dueDate);
      const isOverdue = b.paymentStatus === 'overdue' || (days !== null && days < 0);
      if (!isOverdue && (days === null || days > 15)) continue;
      reminders.push({
        id: `bill-${b.id}`,
        type: isOverdue ? 'bill_overdue' : 'bill_due',
        title: isOverdue ? `Overdue bill: ${b.billNumber}` : `Bill due: ${b.billNumber}`,
        description: `${b.departmentName} · ₹${Math.round(b.netPayableAmount || 0)} · due ${b.dueDate}`,
        dueDate: b.dueDate,
        severity: isOverdue || (days !== null && days <= 7) ? 'high' : 'medium',
        metadata: {
          billId: b.id,
          tenderId: b.tenderId,
          vehicleId: b.vehicleId,
          entityName: b.billNumber,
          docType: 'govt_bill',
        },
      });
    }

    reminders.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

    return sendSuccess(res, {
      phase: 10,
      reminders,
      note: 'Includes company docs, fleet docs, driver docs, tender ends, and unpaid/overdue govt bills.',
    });
  } catch (err) {
    console.error('GET /api/reminders:', err);
    return sendError(res, 500, 'Could not load reminders.');
  }
});

remindersRouter.get('/counts', requireAuth, async (req: Request, res: Response) => {
  if (!canViewModule(req, 'reminders') && !canViewModule(req, 'dashboard')) {
    return sendForbidden(res);
  }
  try {
    const [docs, tenders, vehicles, drivers, bills] = await Promise.all([
      prisma.companyDocument.findMany({
        where: { isLifetime: false, expiryDate: { not: null } },
        select: { expiryDate: true, alertDaysBefore: true },
      }),
      prisma.tender.findMany({
        where: { status: 'active' },
        select: { contractPeriodEnd: true },
      }),
      prisma.vehicle.findMany({
        select: {
          insuranceExpiry: true,
          rtoFitnessExpiry: true,
          pucExpiry: true,
          roadTaxExpiry: true,
          permitExpiry: true,
        },
      }),
      prisma.driver.findMany({
        select: { licenseExpiry: true, policeVerificationExpiry: true },
      }),
      prisma.monthlyBill.findMany({
        where: { paymentStatus: { in: ['draft', 'submitted', 'approved', 'overdue'] } },
        select: { dueDate: true, paymentStatus: true },
      }),
    ]);

    let high = 0;
    let medium = 0;
    let low = 0;

    const bump = (days: number | null, window: number) => {
      if (days === null || days > window) return;
      if (days < 0 || days <= 7) high += 1;
      else if (days <= 15) medium += 1;
      else low += 1;
    };

    for (const d of docs) bump(daysUntil(d.expiryDate), d.alertDaysBefore || 30);
    for (const t of tenders) bump(daysUntil(t.contractPeriodEnd), 45);
    for (const v of vehicles) {
      for (const exp of [
        v.insuranceExpiry,
        v.rtoFitnessExpiry,
        v.pucExpiry,
        v.roadTaxExpiry,
        v.permitExpiry,
      ]) {
        bump(daysUntil(exp), 30);
      }
    }
    for (const d of drivers) {
      bump(daysUntil(d.licenseExpiry), 30);
      bump(daysUntil(d.policeVerificationExpiry), 30);
    }
    for (const b of bills) {
      if (b.paymentStatus === 'overdue') {
        high += 1;
        continue;
      }
      bump(daysUntil(b.dueDate), 15);
    }

    return sendSuccess(res, {
      phase: 10,
      counts: {
        total: high + medium + low,
        high,
        medium,
        low,
      },
    });
  } catch (err) {
    console.error('GET /api/reminders/counts:', err);
    return sendError(res, 500, 'Could not load reminder counts.');
  }
});
