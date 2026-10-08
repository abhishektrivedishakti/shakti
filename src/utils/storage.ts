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
  ModulePermissionKey,
  CompanyDocument,
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  DriverLeaveRecord,
} from '../types';

import {
  INITIAL_TENDERS,
  INITIAL_OFFICERS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_ALLOCATION_HISTORY,
  INITIAL_VEHICLE_ALLOCATION_HISTORY,
  INITIAL_OFFICER_ALLOCATION_HISTORY,
  INITIAL_DAILY_LOGS,
  INITIAL_FUEL_RECORDS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_KHATA_TRANSACTIONS,
  INITIAL_BILLS,
  INITIAL_VENDORS,
  INITIAL_DAILY_PAYMENTS,
  INITIAL_VENDOR_SETTLEMENTS,
  INITIAL_STATUTORY_PAYROLL,
  INITIAL_FUEL_PUMP_VENDORS,
  INITIAL_FUEL_SLIPS,
  INITIAL_FUEL_VENDOR_BILLS,
  INITIAL_COMPANY_DOCUMENTS,
  INITIAL_PETTY_CASH_TRANSACTIONS,
  INITIAL_DRIVER_LEAVES,
  INITIAL_STAFF_USERS,
  getDemoFleetData,
} from '../data/seedData';

// Storage keys for Shakti Travels and Tours
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

// Automatic one-time population: Load comprehensive, multi-category dataset across all features (June - October 2026)
try {
  if (typeof window !== 'undefined' && localStorage.getItem('shakti_loaded_full_dataset_v8') !== 'true') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sft_') || k.startsWith('shakti_') || k.includes('demo') || k.includes('v4') || k.includes('v5') || k.includes('v6') || k.includes('v7'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('shakti_loaded_full_dataset_v8', 'true');
  }
} catch (e) {
  // ignore storage errors
}

const ALL_MODULE_KEYS: ModulePermissionKey[] = [
  'dashboard',
  'company_documents',
  'tenders',
  'vehicles_officers',
  'logbook',
  'billing',
  'drivers_khata',
  'fuel_manager',
  'maintenance',
  'daily_payments',
  'attached_vendors',
  'statutory_payroll',
  'petty_cash',
  'reminders',
  'staff_management',
];

export const DEFAULT_BILL_SERIES_CONFIG: BillSeriesConfig = {
  prefix: 'ST/BILL/2026-27/',
  startingNumber: 1,
  currentNumber: 1,
  paddingDigits: 3,
  suffix: '',
  includeMonthYear: false,
  useTenderPrefix: true,
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export const StorageService = {
  getTenders: (): Tender[] => getFromStorage(STORAGE_KEYS.TENDERS, INITIAL_TENDERS),
  saveTenders: (tenders: Tender[]) => saveToStorage(STORAGE_KEYS.TENDERS, tenders),

  getOfficers: (): Officer[] => getFromStorage(STORAGE_KEYS.OFFICERS, INITIAL_OFFICERS),
  saveOfficers: (officers: Officer[]) => saveToStorage(STORAGE_KEYS.OFFICERS, officers),

  getVehicles: (): Vehicle[] => getFromStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES),
  saveVehicles: (vehicles: Vehicle[]) => saveToStorage(STORAGE_KEYS.VEHICLES, vehicles),

  getDrivers: (): Driver[] => getFromStorage(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS),
  saveDrivers: (drivers: Driver[]) => saveToStorage(STORAGE_KEYS.DRIVERS, drivers),

  getAllocationHistory: (): DriverAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.ALLOCATION_HISTORY, INITIAL_ALLOCATION_HISTORY),
  saveAllocationHistory: (history: DriverAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.ALLOCATION_HISTORY, history),

  getVehicleAllocationHistory: (): VehicleAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.VEHICLE_ALLOCATION_HISTORY, INITIAL_VEHICLE_ALLOCATION_HISTORY),
  saveVehicleAllocationHistory: (history: VehicleAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.VEHICLE_ALLOCATION_HISTORY, history),

  getOfficerAllocationHistory: (): OfficerAllocationHistory[] =>
    getFromStorage(STORAGE_KEYS.OFFICER_ALLOCATION_HISTORY, INITIAL_OFFICER_ALLOCATION_HISTORY),
  saveOfficerAllocationHistory: (history: OfficerAllocationHistory[]) =>
    saveToStorage(STORAGE_KEYS.OFFICER_ALLOCATION_HISTORY, history),

  getDailyLogs: (): DailyLogEntry[] => getFromStorage(STORAGE_KEYS.DAILY_LOGS, INITIAL_DAILY_LOGS),
  saveDailyLogs: (logs: DailyLogEntry[]) => saveToStorage(STORAGE_KEYS.DAILY_LOGS, logs),

  getFuelRecords: (): FuelRecord[] => getFromStorage(STORAGE_KEYS.FUEL_RECORDS, INITIAL_FUEL_RECORDS),
  saveFuelRecords: (fuel: FuelRecord[]) => saveToStorage(STORAGE_KEYS.FUEL_RECORDS, fuel),

  getMaintenanceRecords: (): MaintenanceRecord[] =>
    getFromStorage(STORAGE_KEYS.MAINTENANCE_RECORDS, INITIAL_MAINTENANCE_RECORDS),
  saveMaintenanceRecords: (maint: MaintenanceRecord[]) =>
    saveToStorage(STORAGE_KEYS.MAINTENANCE_RECORDS, maint),

  getKhataTransactions: (): DriverKhataTransaction[] =>
    getFromStorage(STORAGE_KEYS.KHATA_TRANSACTIONS, INITIAL_KHATA_TRANSACTIONS),
  saveKhataTransactions: (khata: DriverKhataTransaction[]) =>
    saveToStorage(STORAGE_KEYS.KHATA_TRANSACTIONS, khata),

  getBills: (): MonthlyBill[] => getFromStorage(STORAGE_KEYS.BILLS, INITIAL_BILLS),
  saveBills: (bills: MonthlyBill[]) => saveToStorage(STORAGE_KEYS.BILLS, bills),

  getVendors: (): Vendor[] => getFromStorage(STORAGE_KEYS.VENDORS, INITIAL_VENDORS),
  saveVendors: (vendors: Vendor[]) => saveToStorage(STORAGE_KEYS.VENDORS, vendors),

  getDailyPayments: (): DailyPaymentEntry[] =>
    getFromStorage(STORAGE_KEYS.DAILY_PAYMENTS, INITIAL_DAILY_PAYMENTS),
  saveDailyPayments: (payments: DailyPaymentEntry[]) =>
    saveToStorage(STORAGE_KEYS.DAILY_PAYMENTS, payments),

  getVendorSettlements: (): VendorSettlement[] =>
    getFromStorage(STORAGE_KEYS.VENDOR_SETTLEMENTS, INITIAL_VENDOR_SETTLEMENTS),
  saveVendorSettlements: (settlements: VendorSettlement[]) =>
    saveToStorage(STORAGE_KEYS.VENDOR_SETTLEMENTS, settlements),

  getStatutoryPayroll: (): StatutoryPayrollEntry[] =>
    getFromStorage(STORAGE_KEYS.STATUTORY_PAYROLL, INITIAL_STATUTORY_PAYROLL),
  saveStatutoryPayroll: (payroll: StatutoryPayrollEntry[]) =>
    saveToStorage(STORAGE_KEYS.STATUTORY_PAYROLL, payroll),

  getBillSeriesConfig: (): BillSeriesConfig =>
    getFromStorage(STORAGE_KEYS.BILL_SERIES, DEFAULT_BILL_SERIES_CONFIG),
  saveBillSeriesConfig: (config: BillSeriesConfig) =>
    saveToStorage(STORAGE_KEYS.BILL_SERIES, config),

  getStaffUsers: (): StaffUser[] =>
    getFromStorage(STORAGE_KEYS.STAFF_USERS, INITIAL_STAFF_USERS),
  saveStaffUsers: (users: StaffUser[]) =>
    saveToStorage(STORAGE_KEYS.STAFF_USERS, users),

  getCurrentUserId: (): string =>
    getFromStorage(STORAGE_KEYS.CURRENT_USER_ID, 'staff-1'),
  saveCurrentUserId: (id: string) =>
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, id),

  getPettyCashTransactions: (): PettyCashTransaction[] =>
    getFromStorage(STORAGE_KEYS.PETTY_CASH, INITIAL_PETTY_CASH_TRANSACTIONS),
  savePettyCashTransactions: (txns: PettyCashTransaction[]) =>
    saveToStorage(STORAGE_KEYS.PETTY_CASH, txns),

  getCompanyDocuments: (): CompanyDocument[] =>
    getFromStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, INITIAL_COMPANY_DOCUMENTS),
  saveCompanyDocuments: (docs: CompanyDocument[]) =>
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, docs),

  getFuelPumpVendors: (): FuelPumpVendor[] =>
    getFromStorage(STORAGE_KEYS.FUEL_PUMP_VENDORS, INITIAL_FUEL_PUMP_VENDORS),
  saveFuelPumpVendors: (pumps: FuelPumpVendor[]) =>
    saveToStorage(STORAGE_KEYS.FUEL_PUMP_VENDORS, pumps),

  getFuelSlips: (): FuelSlip[] =>
    getFromStorage(STORAGE_KEYS.FUEL_SLIPS, INITIAL_FUEL_SLIPS),
  saveFuelSlips: (slips: FuelSlip[]) =>
    saveToStorage(STORAGE_KEYS.FUEL_SLIPS, slips),

  getFuelVendorBills: (): FuelVendorMonthlyBill[] =>
    getFromStorage(STORAGE_KEYS.FUEL_VENDOR_BILLS, INITIAL_FUEL_VENDOR_BILLS),
  saveFuelVendorBills: (bills: FuelVendorMonthlyBill[]) =>
    saveToStorage(STORAGE_KEYS.FUEL_VENDOR_BILLS, bills),

  getDriverLeaves: (): DriverLeaveRecord[] =>
    getFromStorage(STORAGE_KEYS.DRIVER_LEAVES, INITIAL_DRIVER_LEAVES),
  saveDriverLeaves: (leaves: DriverLeaveRecord[]) =>
    saveToStorage(STORAGE_KEYS.DRIVER_LEAVES, leaves),

  // Clear all operational data so user can reset anytime
  clearAllOperationalData: () => {
    Object.values(STORAGE_KEYS).forEach((k) => {
      if (k !== STORAGE_KEYS.STAFF_USERS && k !== STORAGE_KEYS.CURRENT_USER_ID) {
        localStorage.removeItem(k);
      }
    });
    window.location.reload();
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('shakti_clean_slate_live_v5');
    window.location.reload();
  },

  resetToDefault: () => {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('shakti_clean_slate_live_v5');
    window.location.reload();
  },

  // Optional: Load sample data if user ever wants to inspect demo features
  loadDemoData: () => {
    const demo = getDemoFleetData();
    StorageService.saveTenders(demo.tenders);
    StorageService.saveOfficers(demo.officers);
    StorageService.saveVehicles(demo.vehicles);
    StorageService.saveDrivers(demo.drivers);
    StorageService.saveAllocationHistory(demo.allocationHistory);
    StorageService.saveVehicleAllocationHistory(demo.vehicleAllocationHistory);
    StorageService.saveOfficerAllocationHistory(demo.officerAllocationHistory);
    StorageService.saveDailyLogs(demo.dailyLogs);
    StorageService.saveFuelRecords(demo.fuelRecords);
    StorageService.saveMaintenanceRecords(demo.maintenanceRecords);
    StorageService.saveKhataTransactions(demo.khataTransactions);
    StorageService.saveBills(demo.bills);
    StorageService.saveVendors(demo.vendors);
    StorageService.saveDailyPayments(demo.dailyPayments);
    StorageService.saveVendorSettlements(demo.vendorSettlements);
    StorageService.saveStatutoryPayroll(demo.statutoryPayroll);
    StorageService.saveCompanyDocuments(demo.companyDocuments);
    StorageService.savePettyCashTransactions(demo.pettyCashTransactions);
    StorageService.saveDriverLeaves(demo.driverLeaves);
    StorageService.saveFuelPumpVendors(demo.fuelPumpVendors);
    StorageService.saveFuelSlips(demo.fuelSlips);
    StorageService.saveFuelVendorBills(demo.fuelVendorBills);
    StorageService.saveStaffUsers(demo.staffUsers);
    window.location.reload();
  },

  exportAllData: () => {
    const data = {
      companyName: 'Shakti Travels and Tours',
      tenders: StorageService.getTenders(),
      officers: StorageService.getOfficers(),
      vehicles: StorageService.getVehicles(),
      drivers: StorageService.getDrivers(),
      vendors: StorageService.getVendors(),
      dailyPayments: StorageService.getDailyPayments(),
      vendorSettlements: StorageService.getVendorSettlements(),
      allocationHistory: StorageService.getAllocationHistory(),
      vehicleAllocationHistory: StorageService.getVehicleAllocationHistory(),
      officerAllocationHistory: StorageService.getOfficerAllocationHistory(),
      dailyLogs: StorageService.getDailyLogs(),
      fuelRecords: StorageService.getFuelRecords(),
      maintenanceRecords: StorageService.getMaintenanceRecords(),
      khataTransactions: StorageService.getKhataTransactions(),
      bills: StorageService.getBills(),
      staffUsers: StorageService.getStaffUsers(),
      pettyCashTransactions: StorageService.getPettyCashTransactions(),
      companyDocuments: StorageService.getCompanyDocuments(),
      fuelPumpVendors: StorageService.getFuelPumpVendors(),
      fuelSlips: StorageService.getFuelSlips(),
      fuelVendorBills: StorageService.getFuelVendorBills(),
      driverLeaves: StorageService.getDriverLeaves(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shakti-travels-and-tours-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: (jsonData: any) => {
    if (jsonData.tenders) StorageService.saveTenders(jsonData.tenders);
    if (jsonData.officers) StorageService.saveOfficers(jsonData.officers);
    if (jsonData.vehicles) StorageService.saveVehicles(jsonData.vehicles);
    if (jsonData.drivers) StorageService.saveDrivers(jsonData.drivers);
    if (jsonData.vendors) StorageService.saveVendors(jsonData.vendors);
    if (jsonData.dailyPayments) StorageService.saveDailyPayments(jsonData.dailyPayments);
    if (jsonData.vendorSettlements) StorageService.saveVendorSettlements(jsonData.vendorSettlements);
    if (jsonData.allocationHistory) StorageService.saveAllocationHistory(jsonData.allocationHistory);
    if (jsonData.vehicleAllocationHistory) StorageService.saveVehicleAllocationHistory(jsonData.vehicleAllocationHistory);
    if (jsonData.officerAllocationHistory) StorageService.saveOfficerAllocationHistory(jsonData.officerAllocationHistory);
    if (jsonData.dailyLogs) StorageService.saveDailyLogs(jsonData.dailyLogs);
    if (jsonData.fuelRecords) StorageService.saveFuelRecords(jsonData.fuelRecords);
    if (jsonData.maintenanceRecords) StorageService.saveMaintenanceRecords(jsonData.maintenanceRecords);
    if (jsonData.khataTransactions) StorageService.saveKhataTransactions(jsonData.khataTransactions);
    if (jsonData.bills) StorageService.saveBills(jsonData.bills);
    if (jsonData.staffUsers) StorageService.saveStaffUsers(jsonData.staffUsers);
    if (jsonData.pettyCashTransactions) StorageService.savePettyCashTransactions(jsonData.pettyCashTransactions);
    if (jsonData.companyDocuments) StorageService.saveCompanyDocuments(jsonData.companyDocuments);
    if (jsonData.fuelPumpVendors) StorageService.saveFuelPumpVendors(jsonData.fuelPumpVendors);
    if (jsonData.fuelSlips) StorageService.saveFuelSlips(jsonData.fuelSlips);
    if (jsonData.fuelVendorBills) StorageService.saveFuelVendorBills(jsonData.fuelVendorBills);
    if (jsonData.driverLeaves) StorageService.saveDriverLeaves(jsonData.driverLeaves);
    window.location.reload();
  },
};
