import {
  Tender,
  Vehicle,
  Driver,
  Officer,
  DailyLogEntry,
  FuelRecord,
  DriverKhataTransaction,
  MonthlyBill,
  ReminderItem,
  CompanyDocument,
} from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getDaysDiff(targetDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export interface DriverKhataSummary {
  totalAdvanceGiven: number;
  totalSalaryPaid: number;
  totalTripExpenseFastag: number;
  currentAdvanceBalance: number; // Net cash driver currently owes to company
  pendingFuelBudgetBalance: number;
}

export function calculateDriverKhata(
  driverId: string,
  transactions: DriverKhataTransaction[]
): DriverKhataSummary {
  const driverTx = transactions.filter((t) => t.driverId === driverId);

  let totalAdvanceGiven = 0;
  let totalSalaryPaid = 0;
  let totalTripExpenseFastag = 0;
  let totalFuelAdvance = 0;

  driverTx.forEach((tx) => {
    if (tx.type === 'advance') {
      totalAdvanceGiven += tx.amount;
    } else if (tx.type === 'salary_payment') {
      totalSalaryPaid += tx.amount;
    } else if (tx.type === 'trip_expense' || tx.type === 'fastag_topup') {
      totalTripExpenseFastag += tx.amount;
    } else if (tx.type === 'fuel_budget_advance') {
      totalFuelAdvance += tx.amount;
    }
  });

  return {
    totalAdvanceGiven,
    totalSalaryPaid,
    totalTripExpenseFastag,
    currentAdvanceBalance: totalAdvanceGiven, // typically direct personal cash advances
    pendingFuelBudgetBalance: totalFuelAdvance,
  };
}

export interface VehicleMonthLogCalculation {
  monthYear: string;
  vehicleId: string;
  vehicleNumber: string;
  tenderId: string;
  totalDaysWorked: number;
  totalKmRun: number;
  allowedKms: number;
  extraKms: number;
  extraKmRate: number;
  extraKmAmount: number;
  totalHoursRun: number;
  allowedHours: number;
  extraHours: number;
  extraHourRate: number;
  extraHourAmount: number;
  nightHaltsCount: number;
  nightHaltRate: number;
  nightHaltAmount: number;
  tollParkingAmount: number;
  baseMonthlyRate: number;
  subTotal: number;
  gstPercent: number;
  gstAmount: number;
  tdsPercent: number;
  tdsAmount: number;
  netPayableAmount: number;
}

export function calculateBillFromLogs(
  vehicle: Vehicle,
  tender: Tender,
  monthYear: string, // "YYYY-MM"
  logs: DailyLogEntry[],
  penaltyDeductions: number = 0,
  gstPercent: number = 12,
  tdsPercent: number = 2
): VehicleMonthLogCalculation {
  const monthLogs = logs.filter(
    (l) => l.vehicleId === vehicle.id && l.date.startsWith(monthYear)
  );

  const totalDaysWorked = monthLogs.length;
  const totalKmRun = monthLogs.reduce((sum, l) => sum + (Number(l.totalKm) || 0), 0);
  const totalHoursRun = monthLogs.reduce((sum, l) => sum + (Number(l.totalHours) || 0), 0);
  const nightHaltsCount = monthLogs.filter((l) => l.dutyType === 'night_halt' || (l.driverDaNightHalt && l.driverDaNightHalt > 0)).length;
  const tollParkingAmount = monthLogs.reduce((sum, l) => sum + (Number(l.tollParkingCost) || 0), 0);

  // Look up specific vehicle package if multi-variant/lot tender
  const pkg =
    (vehicle.tenderPackageId && tender.packages?.find((p) => p.id === vehicle.tenderPackageId)) ||
    tender.packages?.find((p) =>
      p.vehicleCategory?.toLowerCase().includes(vehicle.vehicleType?.toLowerCase() || '')
    ) ||
    (tender.packages && tender.packages.length > 0 ? tender.packages[0] : null);

  const allowedKms = pkg ? pkg.includedKms : tender.includedKms;
  const extraKmRate = pkg ? pkg.extraKmRate : tender.extraKmRate;
  const extraKms = Math.max(0, totalKmRun - allowedKms);
  const extraKmAmount = extraKms * extraKmRate;

  const allowedHours = pkg ? pkg.includedHours : tender.includedHours;
  const extraHourRate = pkg ? pkg.extraHourRate : tender.extraHourRate;
  const extraHours = Math.max(0, Math.round((totalHoursRun - allowedHours) * 10) / 10);
  const extraHourAmount = Math.round(extraHours * extraHourRate);

  const nightHaltRate = pkg ? pkg.nightHaltRate : tender.nightHaltRate;
  const nightHaltAmount = nightHaltsCount * nightHaltRate;
  const baseMonthlyRate = pkg ? pkg.monthlyBaseRate : tender.baseMonthlyRate;
  const effectiveTollTerms = pkg?.tollTerms || tender.tollTerms;

  // Gross = Base + Extra KM + Extra Hours + Night Halts + Toll (if reimbursable) - Penalties
  const grossBeforeTax =
    baseMonthlyRate +
    extraKmAmount +
    extraHourAmount +
    nightHaltAmount +
    (effectiveTollTerms === 'reimbursable_actuals' ? tollParkingAmount : 0) -
    penaltyDeductions;

  const gstAmount = Math.round((grossBeforeTax * gstPercent) / 100);
  const tdsAmount = Math.round((grossBeforeTax * tdsPercent) / 100);
  const netPayableAmount = Math.round(grossBeforeTax + gstAmount - tdsAmount);

  return {
    monthYear,
    vehicleId: vehicle.id,
    vehicleNumber: vehicle.vehicleNumber,
    tenderId: tender.id,
    totalDaysWorked,
    totalKmRun,
    allowedKms,
    extraKms,
    extraKmRate: tender.extraKmRate,
    extraKmAmount,
    totalHoursRun: Math.round(totalHoursRun * 10) / 10,
    allowedHours,
    extraHours,
    extraHourRate: tender.extraHourRate,
    extraHourAmount,
    nightHaltsCount,
    nightHaltRate: tender.nightHaltRate,
    nightHaltAmount,
    tollParkingAmount,
    baseMonthlyRate,
    subTotal: grossBeforeTax,
    gstPercent,
    gstAmount,
    tdsPercent,
    tdsAmount,
    netPayableAmount,
  };
}

export function generateAllReminders(
  tenders: Tender[],
  vehicles: Vehicle[],
  drivers: Driver[],
  bills: MonthlyBill[],
  companyDocuments: CompanyDocument[] = []
): ReminderItem[] {
  const reminders: ReminderItem[] = [];

  // 1. Check Overdue or Submitted Bills
  bills.forEach((bill) => {
    if (bill.paymentStatus === 'overdue') {
      const days = Math.abs(getDaysDiff(bill.dueDate));
      reminders.push({
        id: `rem-bill-overdue-${bill.id}`,
        type: 'bill_overdue',
        title: `Overdue Payment: ${bill.departmentName}`,
        description: `Bill ${bill.billNumber} of ${formatCurrency(bill.netPayableAmount)} is overdue by ${days} days (Due: ${formatDate(bill.dueDate)}).`,
        dueDate: bill.dueDate,
        severity: 'high',
        metadata: {
          billId: bill.id,
          tenderId: bill.tenderId,
          amount: bill.netPayableAmount,
          entityName: bill.departmentName,
        },
      });
    } else if (bill.paymentStatus === 'submitted') {
      const diff = getDaysDiff(bill.dueDate);
      if (diff <= 7) {
        reminders.push({
          id: `rem-bill-due-${bill.id}`,
          type: 'bill_due',
          title: `Payment Due Soon: ${bill.departmentName}`,
          description: `Bill ${bill.billNumber} (${formatCurrency(bill.netPayableAmount)}) expected within ${diff} days.`,
          dueDate: bill.dueDate,
          severity: 'medium',
          metadata: {
            billId: bill.id,
            tenderId: bill.tenderId,
            amount: bill.netPayableAmount,
            entityName: bill.departmentName,
          },
        });
      }
    }
  });

  // 2. Monthly Bill Submission reminders for active tenders
  const today = new Date();
  const currentDay = today.getDate();
  tenders.forEach((tender) => {
    if (tender.status === 'active') {
      // If today is near billing cycle day (e.g. 1st - 7th of month)
      if (currentDay >= 1 && currentDay <= 7) {
        reminders.push({
          id: `rem-tender-bill-sub-${tender.id}`,
          type: 'bill_due',
          title: `Submit Monthly Bill: ${tender.departmentName}`,
          description: `Monthly billing cycle day is ${tender.billingCycleDay}th. Prepare & submit certified logbook and duty slips.`,
          dueDate: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-07`,
          severity: 'medium',
          metadata: {
            tenderId: tender.id,
            phone: tender.contactPhone,
            entityName: tender.departmentName,
          },
        });
      }
    }
  });

  // 3. Vehicle Compliance & Document Expiries (1-Month / 30-Day Early Warning)
  vehicles.forEach((veh) => {
    // Fitness Expiry (1-Month Alert)
    if (veh.rtoFitnessExpiry) {
      const days = getDaysDiff(veh.rtoFitnessExpiry);
      if (days < 0) {
        reminders.push({
          id: `rem-fit-exp-${veh.id}`,
          type: 'doc_expiry',
          title: `Fitness Expired! (${veh.vehicleNumber})`,
          description: `RTO Commercial Fitness expired on ${formatDate(veh.rtoFitnessExpiry)}. Govt vehicle cannot run without valid fitness.`,
          dueDate: veh.rtoFitnessExpiry,
          severity: 'high',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'fitness' },
        });
      } else if (days <= 30) {
        reminders.push({
          id: `rem-fit-due-${veh.id}`,
          type: 'doc_expiry',
          title: `Fitness Expiring in ${days} Days (${veh.vehicleNumber})`,
          description: `⚠️ 1-Month Alert: RTO Fitness expires in ${days} days (${formatDate(veh.rtoFitnessExpiry)}). Book RTO inspection slot.`,
          dueDate: veh.rtoFitnessExpiry,
          severity: days <= 7 ? 'high' : 'medium',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'fitness' },
        });
      }
    }

    // Insurance Expiry (1-Month Alert)
    if (veh.insuranceExpiry) {
      const days = getDaysDiff(veh.insuranceExpiry);
      if (days < 0) {
        reminders.push({
          id: `rem-ins-exp-${veh.id}`,
          type: 'doc_expiry',
          title: `Insurance Expired! (${veh.vehicleNumber})`,
          description: `Vehicle insurance policy expired on ${formatDate(veh.insuranceExpiry)}. Immediate renewal required!`,
          dueDate: veh.insuranceExpiry,
          severity: 'high',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'insurance' },
        });
      } else if (days <= 30) {
        reminders.push({
          id: `rem-ins-due-${veh.id}`,
          type: 'doc_expiry',
          title: `Insurance Expiring in ${days} Days (${veh.vehicleNumber})`,
          description: `⚠️ 1-Month Alert: Vehicle insurance policy expires in ${days} days (${formatDate(veh.insuranceExpiry)}). Contact insurer.`,
          dueDate: veh.insuranceExpiry,
          severity: days <= 7 ? 'high' : 'medium',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'insurance' },
        });
      }
    }

    // PUC Pollution Certificate Expiry (1-Month Alert)
    if (veh.pucExpiry) {
      const days = getDaysDiff(veh.pucExpiry);
      if (days < 0) {
        reminders.push({
          id: `rem-puc-exp-${veh.id}`,
          type: 'doc_expiry',
          title: `PUC Pollution Expired! (${veh.vehicleNumber})`,
          description: `Pollution certificate expired on ${formatDate(veh.pucExpiry)}. ₹10,000 challan risk!`,
          dueDate: veh.pucExpiry,
          severity: 'high',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'puc' },
        });
      } else if (days <= 30) {
        reminders.push({
          id: `rem-puc-due-${veh.id}`,
          type: 'doc_expiry',
          title: `PUC Expiring in ${days} Days (${veh.vehicleNumber})`,
          description: `⚠️ 1-Month Alert: PUC Pollution certificate expires in ${days} days (${formatDate(veh.pucExpiry)}). Get checked at nearest petrol pump.`,
          dueDate: veh.pucExpiry,
          severity: days <= 7 ? 'high' : 'medium',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'puc' },
        });
      }
    }

    // Permit Expiry (1-Month Alert)
    if (veh.permitExpiry) {
      const days = getDaysDiff(veh.permitExpiry);
      if (days < 0) {
        reminders.push({
          id: `rem-permit-exp-${veh.id}`,
          type: 'doc_expiry',
          title: `Commercial Permit Expired! (${veh.vehicleNumber})`,
          description: `RTO commercial carriage permit expired on ${formatDate(veh.permitExpiry)}. Apply for renewal.`,
          dueDate: veh.permitExpiry,
          severity: 'high',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'permit' },
        });
      } else if (days <= 30) {
        reminders.push({
          id: `rem-permit-due-${veh.id}`,
          type: 'doc_expiry',
          title: `Permit Expiring in ${days} Days (${veh.vehicleNumber})`,
          description: `⚠️ 1-Month Alert: Commercial permit expires in ${days} days (${formatDate(veh.permitExpiry)}).`,
          dueDate: veh.permitExpiry,
          severity: days <= 7 ? 'high' : 'medium',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'permit' },
        });
      }
    }

    // Road Tax Expiry (1-Month Alert)
    if (veh.roadTaxExpiry) {
      const days = getDaysDiff(veh.roadTaxExpiry);
      if (days < 0) {
        reminders.push({
          id: `rem-tax-exp-${veh.id}`,
          type: 'doc_expiry',
          title: `RTO Road Tax Overdue! (${veh.vehicleNumber})`,
          description: `Road tax validity expired on ${formatDate(veh.roadTaxExpiry)}. Pay tax online via Parivahan.`,
          dueDate: veh.roadTaxExpiry,
          severity: 'high',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'road_tax' },
        });
      } else if (days <= 30) {
        reminders.push({
          id: `rem-tax-due-${veh.id}`,
          type: 'doc_expiry',
          title: `Road Tax Expiring in ${days} Days (${veh.vehicleNumber})`,
          description: `⚠️ 1-Month Alert: Road tax expires in ${days} days (${formatDate(veh.roadTaxExpiry)}).`,
          dueDate: veh.roadTaxExpiry,
          severity: days <= 7 ? 'high' : 'medium',
          metadata: { vehicleId: veh.id, entityName: veh.vehicleNumber, docType: 'road_tax' },
        });
      }
    }
  });

  // 4. Driver Expiries (Police verification & License)
  drivers.forEach((drv) => {
    if (drv.status === 'active') {
      if (drv.policeVerificationExpiry) {
        const days = getDaysDiff(drv.policeVerificationExpiry);
        if (days <= 20) {
          reminders.push({
            id: `rem-pol-${drv.id}`,
            type: 'police_verification',
            title: `Police Verification Renewal: ${drv.name}`,
            description: days < 0 
              ? `Govt mandate expired on ${formatDate(drv.policeVerificationExpiry)}. Renew character certificate!`
              : `Govt mandate verification expires in ${days} days (${formatDate(drv.policeVerificationExpiry)}).`,
            dueDate: drv.policeVerificationExpiry,
            severity: days < 0 ? 'high' : 'medium',
            metadata: { driverId: drv.id, entityName: drv.name, phone: drv.phone },
          });
        }
      }

      if (drv.licenseExpiry) {
        const days = getDaysDiff(drv.licenseExpiry);
        if (days <= 30) {
          reminders.push({
            id: `rem-lic-${drv.id}`,
            type: 'doc_expiry',
            title: `Commercial Driving License Renewal: ${drv.name}`,
            description: `Commercial driving license expires in ${days} days (${formatDate(drv.licenseExpiry)}).`,
            dueDate: drv.licenseExpiry,
            severity: 'medium',
            metadata: { driverId: drv.id, entityName: drv.name, phone: drv.phone },
          });
        }
      }
    }
  });

  // 5. Company Important Documents Expiry Tracker (कंपनी दस्तावेज़ व एक्सपायरी)
  companyDocuments.forEach((doc) => {
    if (!doc.isLifetime && doc.expiryDate) {
      const days = getDaysDiff(doc.expiryDate);
      const alertThreshold = doc.alertDaysBefore || 30;

      if (days < 0) {
        reminders.push({
          id: `rem-cdoc-exp-${doc.id}`,
          type: 'company_doc_expiry',
          title: `कंपनी दस्तावेज़ समाप्त: ${doc.title}`,
          description: `${doc.title} (${doc.docNumber || 'No.'}) दिनांक ${formatDate(doc.expiryDate)} को समाप्त हो गया है (${Math.abs(days)} दिन पूर्व)। तत्काल रिन्यू कराएं!`,
          dueDate: doc.expiryDate,
          severity: 'high',
          metadata: {
            companyDocId: doc.id,
            entityName: doc.title,
            phone: doc.contactPersonOrAgent,
          },
        });
      } else if (days <= alertThreshold) {
        reminders.push({
          id: `rem-cdoc-due-${doc.id}`,
          type: 'company_doc_expiry',
          title: `कंपनी दस्तावेज़ रिन्यूअल देय: ${doc.title}`,
          description: `${doc.title} (${doc.docNumber || 'No.'}) की मान्यता ${days} दिन में (${formatDate(doc.expiryDate)}) समाप्त हो रही है।`,
          dueDate: doc.expiryDate,
          severity: days <= 15 ? 'high' : 'medium',
          metadata: {
            companyDocId: doc.id,
            entityName: doc.title,
            phone: doc.contactPersonOrAgent,
          },
        });
      }
    }
  });

  // Sort: High severity first, then by earliest due date
  return reminders.sort((a, b) => {
    const sevWeight = { high: 0, medium: 1, info: 2 };
    if (sevWeight[a.severity] !== sevWeight[b.severity]) {
      return sevWeight[a.severity] - sevWeight[b.severity];
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

/**
 * Universal helper to resolve assigned Driver for a Vehicle across all modes:
 * - Direct ID match (veh.currentDriverId === drv.id)
 * - Reverse vehicle link (drv.currentVehicleId === veh.id)
 * - Raw string / name match (veh.driverName, veh.assignedDriver)
 * - Assigned officer's linked driver (officer.currentDriverId)
 */
export const getAssignedDriverForVehicle = (
  veh: Vehicle,
  drivers: Driver[] = [],
  officers: Officer[] = []
): Driver | undefined => {
  if (!veh) return undefined;

  // 1. Direct ID match on veh.currentDriverId
  if (veh.currentDriverId) {
    const byId = drivers.find((drv) => drv.id === veh.currentDriverId);
    if (byId) return byId;
  }

  // 2. Reverse match where driver has currentVehicleId pointing to this vehicle
  const byVehId = drivers.find((drv) => drv.currentVehicleId === veh.id);
  if (byVehId) return byVehId;

  // 3. Match by driverId property if present
  const anyVeh = veh as any;
  if (anyVeh.driverId) {
    const byDrvId = drivers.find((drv) => drv.id === anyVeh.driverId);
    if (byDrvId) return byDrvId;
  }

  // 4. Match by driverName or assignedDriver string
  const nameToMatch = anyVeh.driverName || anyVeh.assignedDriver;
  if (nameToMatch && typeof nameToMatch === 'string' && nameToMatch.trim() !== '') {
    const clean = nameToMatch.trim().toLowerCase();
    const byName = drivers.find(
      (drv) => drv.name.trim().toLowerCase() === clean || drv.id.toLowerCase() === clean
    );
    if (byName) return byName;

    // Check phone number
    const cleanDigits = nameToMatch.replace(/\D/g, '');
    if (cleanDigits.length >= 10) {
      const byPhone = drivers.find((drv) => drv.phone && drv.phone.replace(/\D/g, '').includes(cleanDigits));
      if (byPhone) return byPhone;
    }
  }

  // 5. Match via assigned officer's driver
  const assignedOff = officers.find(
    (o) => o.assignedVehicleId === veh.id || (veh.assignedOfficerId && o.id === veh.assignedOfficerId)
  );
  if (assignedOff && assignedOff.currentDriverId) {
    const byOfficerDrv = drivers.find((drv) => drv.id === assignedOff.currentDriverId);
    if (byOfficerDrv) return byOfficerDrv;
  }

  // 6. Direct fallback from veh.driverName / veh.assignedDriver if specified
  const directName = veh.driverName || anyVeh.assignedDriver;
  if (directName && typeof directName === 'string' && directName.trim() !== '') {
    return {
      id: veh.currentDriverId || `drv-${veh.id}`,
      driverCode: veh.currentDriverId || `DRV-${veh.id}`,
      name: directName.trim(),
      phone: veh.driverPhone || anyVeh.driverMobile || '9839000000',
      alternatePhone: '',
      address: 'Uttar Pradesh',
      licenseNumber: 'DL On Record',
      licenseExpiry: '2030-12-31',
      policeVerificationDate: '2025-01-01',
      policeVerificationExpiry: '2028-12-31',
      aadharNumber: 'Aadhaar on record',
      joiningDate: '2025-01-01',
      monthlySalary: veh.ownershipType === 'Owner-Driver' ? 0 : 16500,
      dailyDaRate: 350,
      status: 'active',
      currentVehicleId: veh.id,
      employmentType: veh.ownershipType === 'Owner-Driver' ? 'owner_driver' : 'contractual_khata',
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFuelBudgetAmount: 12000,
    } as Driver;
  }

  return undefined;
};
