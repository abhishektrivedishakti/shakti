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
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  CompanyDocument,
  PettyCashTransaction,
  DriverLeaveRecord,
  StaffUser,
} from '../types';
import { generateLargeFleetData } from './largeFleetGenerator';

// Real Indian Government Fleet & Tender ERP Initial Data
const SEED = generateLargeFleetData();

export const INITIAL_TENDERS: Tender[] = SEED.tenders;
export const INITIAL_OFFICERS: Officer[] = SEED.officers;
export const INITIAL_VEHICLES: Vehicle[] = SEED.vehicles;
export const INITIAL_DRIVERS: Driver[] = SEED.drivers;
export const INITIAL_VENDORS: Vendor[] = SEED.vendors;
export const INITIAL_ALLOCATION_HISTORY: DriverAllocationHistory[] = SEED.allocationHistory;
export const INITIAL_VEHICLE_ALLOCATION_HISTORY: VehicleAllocationHistory[] = SEED.vehicleAllocationHistory;
export const INITIAL_OFFICER_ALLOCATION_HISTORY: OfficerAllocationHistory[] = SEED.officerAllocationHistory;
export const INITIAL_DAILY_LOGS: DailyLogEntry[] = SEED.dailyLogs;
export const INITIAL_FUEL_RECORDS: FuelRecord[] = SEED.fuelRecords;
export const INITIAL_MAINTENANCE_RECORDS: MaintenanceRecord[] = SEED.maintenanceRecords;
export const INITIAL_KHATA_TRANSACTIONS: DriverKhataTransaction[] = SEED.khataTransactions;
export const INITIAL_BILLS: MonthlyBill[] = SEED.bills;
export const INITIAL_DAILY_PAYMENTS: DailyPaymentEntry[] = SEED.dailyPayments;
export const INITIAL_VENDOR_SETTLEMENTS: VendorSettlement[] = SEED.vendorSettlements;
export const INITIAL_STATUTORY_PAYROLL: StatutoryPayrollEntry[] = SEED.statutoryPayroll;
export const INITIAL_FUEL_PUMP_VENDORS: FuelPumpVendor[] = SEED.fuelPumpVendors;
export const INITIAL_FUEL_SLIPS: FuelSlip[] = SEED.fuelSlips;
export const INITIAL_FUEL_VENDOR_BILLS: FuelVendorMonthlyBill[] = SEED.fuelVendorBills;
export const INITIAL_COMPANY_DOCUMENTS: CompanyDocument[] = SEED.companyDocuments;
export const INITIAL_PETTY_CASH_TRANSACTIONS: PettyCashTransaction[] = SEED.pettyCashTransactions;
export const INITIAL_DRIVER_LEAVES: DriverLeaveRecord[] = SEED.driverLeaves;
export const INITIAL_STAFF_USERS: StaffUser[] = SEED.staffUsers;

export const getDemoFleetData = () => generateLargeFleetData();
