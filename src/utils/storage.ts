import {
  Tender,
  Officer,
  Vehicle,
  Driver,
  DriverAllocationHistory,
  VehicleAllocationHistory,
  OfficerAllocationHistory,
  DailyLogEntry,
  FuelRecord,
  MaintenanceRecord,
  DriverKhataTransaction,
  MonthlyBill,
  Vendor,
  DailyPaymentEntry,
  VendorSettlement,
  StatutoryPayrollEntry,
  BillSeriesConfig,
  StaffUser,
  PettyCashTransaction,
  CompanyDocument,
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  DriverLeaveRecord,
} from '../types';

/**
 * Operational data is API/DB only — do not persist module lists in localStorage.
 * Auth tokens stay in sessionStorage via authClient.
 */

export const STORAGE_KEYS = {
  TENDERS: 'shakti_live_tenders_v8',
  OFFICERS: 'shakti_live_officers_v8',
  VEHICLES: 'shakti_live_vehicles_v8',
  DRIVERS: 'shakti_live_drivers_v8',
  ALLOCATION_HISTORY: 'shakti_live_alloc_hist_v8',
  VEHICLE_ALLOCATION_HISTORY: 'shakti_live_veh_alloc_hist_v8',
  OFFICER_ALLOCATION_HISTORY: 'shakti_live_off_alloc_hist_v8',
  DAILY_LOGS: 'shakti_live_daily_logs_v8',
  FUEL_RECORDS: 'shakti_live_fuel_records_v8',
  MAINTENANCE_RECORDS: 'shakti_live_maint_records_v8',
  KHATA_TRANSACTIONS: 'shakti_live_khata_txns_v8',
  BILLS: 'shakti_live_bills_v8',
  VENDORS: 'shakti_live_vendors_v8',
  DAILY_PAYMENTS: 'shakti_live_daily_pmts_v8',
  VENDOR_SETTLEMENTS: 'shakti_live_vendor_settle_v8',
  STATUTORY_PAYROLL: 'shakti_live_stat_payroll_v8',
  BILL_SERIES: 'shakti_live_bill_series_v8',
  STAFF_USERS: 'shakti_live_staff_users_v8',
  CURRENT_USER_ID: 'shakti_live_current_user_v8',
  PETTY_CASH: 'shakti_live_petty_cash_v8',
  COMPANY_DOCUMENTS: 'shakti_live_company_docs_v8',
  FUEL_PUMP_VENDORS: 'shakti_live_fuel_pump_vendors_v8',
  FUEL_SLIPS: 'shakti_live_fuel_slips_v8',
  FUEL_VENDOR_BILLS: 'shakti_live_fuel_vendor_bills_v8',
  DRIVER_LEAVES: 'shakti_live_driver_leaves_v8',
};

/** Wipe legacy browser caches so stale demo/API mirrors cannot resurface. */
export function purgeLegacyLocalCaches(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        (k.startsWith('sft_') ||
          k.startsWith('shakti_') ||
          k.startsWith('fleetdispatch_') ||
          k.includes('demo'))
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  purgeLegacyLocalCaches();
}

export const DEFAULT_BILL_SERIES_CONFIG: BillSeriesConfig = {
  prefix: 'ST/BILL/2026-27/',
  startingNumber: 1,
  currentNumber: 1,
  paddingDigits: 3,
  suffix: '',
  includeMonthYear: false,
  useTenderPrefix: true,
};

function getFromStorage<T>(_key: string, defaultValue: T): T {
  return defaultValue;
}

function saveToStorage<T>(_key: string, _value: T): void {
  // no-op — React state + API are the source of truth
}

/** Kept for call-site compatibility; nothing is buffered to disk. */
export function flushStorageWrites(): void {
  /* no-op */
}

export const StorageService = {
  getTenders: (): Tender[] => getFromStorage(STORAGE_KEYS.TENDERS, []),
  saveTenders: (tenders: Tender[]) => saveToStorage(STORAGE_KEYS.TENDERS, tenders),

  getOfficers: (): Officer[] => getFromStorage(STORAGE_KEYS.OFFICERS, []),
  saveOfficers: (officers: Officer[]) => saveToStorage(STORAGE_KEYS.OFFICERS, officers),

  getVehicles: (): Vehicle[] => getFromStorage(STORAGE_KEYS.VEHICLES, []),
  saveVehicles: (vehicles: Vehicle[]) => saveToStorage(STORAGE_KEYS.VEHICLES, vehicles),

  getDrivers: (): Driver[] => getFromStorage(STORAGE_KEYS.DRIVERS, []),
  saveDrivers: (drivers: Driver[]) => saveToStorage(STORAGE_KEYS.DRIVERS, drivers),

  getAllocationHistory: (): DriverAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.ALLOCATION_HISTORY, []),
  saveAllocationHistory: (history: DriverAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.ALLOCATION_HISTORY, history),

  getVehicleAllocationHistory: (): VehicleAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.VEHICLE_ALLOCATION_HISTORY, []),
  saveVehicleAllocationHistory: (history: VehicleAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.VEHICLE_ALLOCATION_HISTORY, history),

  getOfficerAllocationHistory: (): OfficerAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.OFFICER_ALLOCATION_HISTORY, []),
  saveOfficerAllocationHistory: (history: OfficerAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.OFFICER_ALLOCATION_HISTORY, history),

  getDailyLogs: (): DailyLogEntry[] => getFromStorage(STORAGE_KEYS.DAILY_LOGS, []),
  saveDailyLogs: (logs: DailyLogEntry[]) => saveToStorage(STORAGE_KEYS.DAILY_LOGS, logs),

  getFuelRecords: (): FuelRecord[] => getFromStorage(STORAGE_KEYS.FUEL_RECORDS, []),
  saveFuelRecords: (fuel: FuelRecord[]) => saveToStorage(STORAGE_KEYS.FUEL_RECORDS, fuel),

  getMaintenanceRecords: (): MaintenanceRecord[] =>
    getFromStorage(STORAGE_KEYS.MAINTENANCE_RECORDS, []),
  saveMaintenanceRecords: (maint: MaintenanceRecord[]) =>
    saveToStorage(STORAGE_KEYS.MAINTENANCE_RECORDS, maint),

  getKhataTransactions: (): DriverKhataTransaction[] =>
    getFromStorage(STORAGE_KEYS.KHATA_TRANSACTIONS, []),
  saveKhataTransactions: (khata: DriverKhataTransaction[]) =>
    saveToStorage(STORAGE_KEYS.KHATA_TRANSACTIONS, khata),

  getBills: (): MonthlyBill[] => getFromStorage(STORAGE_KEYS.BILLS, []),
  saveBills: (bills: MonthlyBill[]) => saveToStorage(STORAGE_KEYS.BILLS, bills),

  getVendors: (): Vendor[] => getFromStorage(STORAGE_KEYS.VENDORS, []),
  saveVendors: (vendors: Vendor[]) => saveToStorage(STORAGE_KEYS.VENDORS, vendors),

  getDailyPayments: (): DailyPaymentEntry[] => getFromStorage(STORAGE_KEYS.DAILY_PAYMENTS, []),
  saveDailyPayments: (payments: DailyPaymentEntry[]) =>
    saveToStorage(STORAGE_KEYS.DAILY_PAYMENTS, payments),

  getVendorSettlements: (): VendorSettlement[] =>
    getFromStorage(STORAGE_KEYS.VENDOR_SETTLEMENTS, []),
  saveVendorSettlements: (settlements: VendorSettlement[]) =>
    saveToStorage(STORAGE_KEYS.VENDOR_SETTLEMENTS, settlements),

  getStatutoryPayroll: (): StatutoryPayrollEntry[] =>
    getFromStorage(STORAGE_KEYS.STATUTORY_PAYROLL, []),
  saveStatutoryPayroll: (payroll: StatutoryPayrollEntry[]) =>
    saveToStorage(STORAGE_KEYS.STATUTORY_PAYROLL, payroll),

  getBillSeriesConfig: (): BillSeriesConfig =>
    getFromStorage(STORAGE_KEYS.BILL_SERIES, DEFAULT_BILL_SERIES_CONFIG),
  saveBillSeriesConfig: (config: BillSeriesConfig) =>
    saveToStorage(STORAGE_KEYS.BILL_SERIES, config),

  getStaffUsers: (): StaffUser[] => getFromStorage(STORAGE_KEYS.STAFF_USERS, []),
  saveStaffUsers: (users: StaffUser[]) => saveToStorage(STORAGE_KEYS.STAFF_USERS, users),

  getCurrentUserId: (): string => getFromStorage(STORAGE_KEYS.CURRENT_USER_ID, ''),
  saveCurrentUserId: (id: string) => saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, id),

  getPettyCashTransactions: (): PettyCashTransaction[] =>
    getFromStorage(STORAGE_KEYS.PETTY_CASH, []),
  savePettyCashTransactions: (txns: PettyCashTransaction[]) =>
    saveToStorage(STORAGE_KEYS.PETTY_CASH, txns),

  getCompanyDocuments: (): CompanyDocument[] =>
    getFromStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, []),
  saveCompanyDocuments: (docs: CompanyDocument[]) =>
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, docs),

  getFuelPumpVendors: (): FuelPumpVendor[] =>
    getFromStorage(STORAGE_KEYS.FUEL_PUMP_VENDORS, []),
  saveFuelPumpVendors: (pumps: FuelPumpVendor[]) =>
    saveToStorage(STORAGE_KEYS.FUEL_PUMP_VENDORS, pumps),

  getFuelSlips: (): FuelSlip[] => getFromStorage(STORAGE_KEYS.FUEL_SLIPS, []),
  saveFuelSlips: (slips: FuelSlip[]) => saveToStorage(STORAGE_KEYS.FUEL_SLIPS, slips),

  getFuelVendorBills: (): FuelVendorMonthlyBill[] =>
    getFromStorage(STORAGE_KEYS.FUEL_VENDOR_BILLS, []),
  saveFuelVendorBills: (bills: FuelVendorMonthlyBill[]) =>
    saveToStorage(STORAGE_KEYS.FUEL_VENDOR_BILLS, bills),

  getDriverLeaves: (): DriverLeaveRecord[] => getFromStorage(STORAGE_KEYS.DRIVER_LEAVES, []),
  saveDriverLeaves: (leaves: DriverLeaveRecord[]) =>
    saveToStorage(STORAGE_KEYS.DRIVER_LEAVES, leaves),

  clearAllOperationalData: () => {
    purgeLegacyLocalCaches();
    window.location.reload();
  },

  clearAllData: () => {
    purgeLegacyLocalCaches();
    window.location.reload();
  },

  resetToDefault: () => {
    purgeLegacyLocalCaches();
    window.location.reload();
  },

  exportAllData: () => {
    alert('Export uses the server backup when you are logged in. Local cache export is disabled.');
  },

  importData: (_jsonData: unknown) => {
    alert('Import uses the server restore when you are logged in. Local cache import is disabled.');
  },
};
