/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback, startTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import {
  clearAuthSession,
  fetchCurrentUser,
} from './api/authClient';
import { createStaffApi, fetchStaffList, updateStaffApi } from './api/staffClient';
import { fetchDashboardSummary, type DashboardSummary } from './api/dashboardClient';
import {
  bulkImportTendersApi,
  createTenderApi,
  fetchTenders,
  updateTenderApi,
} from './api/tendersClient';
import {
  bulkImportCompanyDocumentsApi,
  createCompanyDocumentApi,
  deleteCompanyDocumentApi,
  fetchCompanyDocuments,
  updateCompanyDocumentApi,
} from './api/companyDocumentsClient';
import {
  bulkImportOfficersApi,
  createOfficerApi,
  deleteOfficerApi,
  fetchOfficers,
  updateOfficerApi,
} from './api/officersClient';
import {
  bulkImportDriversApi,
  createDriverApi,
  deleteDriverApi,
  fetchDrivers,
  updateDriverApi,
} from './api/driversClient';
import {
  bulkImportVehiclesApi,
  createVehicleApi,
  fetchVehicles,
  updateVehicleApi,
} from './api/vehiclesClient';
import {
  bulkImportAllocationsApi,
  fetchDriverAllocations,
  fetchOfficerAllocations,
  fetchVehicleAllocations,
  reactivateVehicleAllocationApi,
  replaceDriverApi,
  replaceVehicleApi,
  transferOfficerApi,
} from './api/allocationsClient';
import {
  bulkImportDailyLogsApi,
  createDailyLogApi,
  fetchDailyLogs,
  verifyDailyLogApi,
} from './api/dailyLogsClient';
import {
  bulkImportMaintenanceApi,
  createMaintenanceApi,
  fetchMaintenanceRecords,
} from './api/maintenanceClient';
import {
  bulkImportFuelPumpsApi,
  bulkImportFuelRecordsApi,
  bulkImportFuelSlipsApi,
  bulkImportFuelVendorBillsApi,
  createFuelPumpApi,
  createFuelRecordApi,
  createFuelSlipApi,
  createFuelVendorBillApi,
  deleteFuelPumpApi,
  deleteFuelSlipApi,
  deleteFuelVendorBillApi,
  fetchFuelPumps,
  fetchFuelRecords,
  fetchFuelSlips,
  fetchFuelVendorBills,
  markFuelSlipFilledApi,
  payFuelVendorBillApi,
  updateFuelPumpApi,
  updateFuelSlipApi,
  updateFuelVendorBillApi,
} from './api/fuelClient';
import {
  bulkImportBillsApi,
  createBillApi,
  fetchBills,
  updateBillApi,
  updateBillStatusApi,
} from './api/billsClient';
import {
  bulkImportDriverLeavesApi,
  bulkImportKhataApi,
  createDriverLeaveApi,
  createKhataTransactionApi,
  deleteDriverLeaveApi,
  deleteKhataTransactionApi,
  fetchDriverLeaves,
  fetchKhataTransactions,
  updateDriverLeaveApi,
} from './api/khataClient';
import {
  bulkImportDailyPaymentsApi,
  createDailyPaymentApi,
  createDailyPaymentsBatchApi,
  fetchDailyPayments,
  type DailyPaymentRouted,
} from './api/dailyPaymentsClient';
import {
  bulkImportVendorSettlementsApi,
  bulkImportVendorsApi,
  createVendorApi,
  createVendorSettlementApi,
  deleteVendorApi,
  fetchVendorSettlements,
  fetchVendors,
  payVendorSettlementApi,
  updateVendorApi,
  updateVendorSettlementApi,
} from './api/vendorsClient';
import {
  bulkImportStatutoryPayrollApi,
  createStatutoryPayrollApi,
  fetchStatutoryPayroll,
  updateStatutoryPayrollApi,
} from './api/statutoryClient';
import {
  bulkImportPettyCashApi,
  createPettyCashApi,
  fetchPettyCashTransactions,
  updatePettyCashApi,
} from './api/pettyCashClient';
import {
  INITIAL_ALLOCATION_HISTORY,
  INITIAL_BILLS,
  INITIAL_COMPANY_DOCUMENTS,
  INITIAL_DAILY_LOGS,
  INITIAL_DAILY_PAYMENTS,
  INITIAL_DRIVER_LEAVES,
  INITIAL_DRIVERS,
  INITIAL_FUEL_PUMP_VENDORS,
  INITIAL_FUEL_RECORDS,
  INITIAL_FUEL_SLIPS,
  INITIAL_FUEL_VENDOR_BILLS,
  INITIAL_KHATA_TRANSACTIONS,
  INITIAL_MAINTENANCE_RECORDS,
  INITIAL_OFFICERS,
  INITIAL_OFFICER_ALLOCATION_HISTORY,
  INITIAL_PETTY_CASH_TRANSACTIONS,
  INITIAL_STATUTORY_PAYROLL,
  INITIAL_TENDERS,
  INITIAL_VENDOR_SETTLEMENTS,
  INITIAL_VENDORS,
  INITIAL_VEHICLE_ALLOCATION_HISTORY,
  INITIAL_VEHICLES,
} from './data/seedData';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TendersView } from './components/TendersView';
import { VehiclesOfficersView } from './components/VehiclesOfficersView';
import { LogBookView } from './components/LogBookView';
import { GovtBillingView } from './components/GovtBillingView';
import { DriversKhataView } from './components/DriversKhataView';
import { FuelManagerView } from './components/FuelManagerView';
import { MaintenanceView } from './components/MaintenanceView';
import { RemindersCenterView } from './components/RemindersCenterView';
import { DailyPaymentsJournalView } from './components/DailyPaymentsJournalView';
import { VendorAttachedFleetView } from './components/VendorAttachedFleetView';
import { StatutoryLabourComplianceView } from './components/StatutoryLabourComplianceView';
import { PettyCashManagerView } from './components/PettyCashManagerView';
import { StaffManagementView } from './components/StaffManagementView';
import { CompanyDocumentsView } from './components/CompanyDocumentsView';
import { OurVehiclesFleetView } from './components/OurVehiclesFleetView';
import { FleetDispatchProView } from './components/fleet-dispatch/FleetDispatchProView';
import { BulkImportModal, BulkImportType } from './components/BulkImportModal';
import { UnifiedProfileModal, ProfileEntityType } from './components/UnifiedProfileModal';

import { flushStorageWrites, StorageService } from './utils/storage';
import { generateAllReminders, getDaysDiff } from './utils/calculations';
import {
  generateDriverUniqueId,
  generateVendorUniqueId,
  generateOfficerUniqueId,
} from './utils/idGenerator';
import {
  Tender,
  Vehicle,
  Officer,
  Driver,
  DriverAllocationHistory,
  VehicleAllocationHistory,
  OfficerAllocationHistory,
  DailyLogEntry,
  FuelRecord,
  MaintenanceRecord,
  DriverKhataTransaction,
  MonthlyBill,
  ReplacementReason,
  VehicleReplacementReason,
  OfficerTransferReason,
  PaymentStatus,
  Vendor,
  DailyPaymentEntry,
  VendorSettlement,
  StatutoryPayrollEntry,
  StaffUser,
  PettyCashTransaction,
  CompanyDocument,
  FuelPumpVendor,
  FuelSlip,
  FuelVendorMonthlyBill,
  DriverLeaveRecord,
} from './types';

const P2_MASTERS_SEEDED_KEY = 'shakti_p2_masters_seeded';
const P3_FLEET_SEEDED_KEY = 'shakti_p3_fleet_seeded';
const P4_ALLOC_SEEDED_KEY = 'shakti_p4_alloc_seeded';
const P5_OPS_SEEDED_KEY = 'shakti_p5_ops_seeded';
const P6_FUEL_SEEDED_KEY = 'shakti_p6_fuel_seeded';
const P7_BILLING_SEEDED_KEY = 'shakti_p7_billing_seeded';
const P8_MONEY_SEEDED_KEY = 'shakti_p8_money_seeded';

type AuthScreen = 'login' | 'register';
type AuthStatus = 'loading' | 'guest' | 'authenticated';

export default function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core State initialized from persistent StorageService
  const [tenders, setTenders] = useState<Tender[]>(() => StorageService.getTenders());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => StorageService.getVehicles());
  const [officers, setOfficers] = useState<Officer[]>(() => StorageService.getOfficers());
  const [drivers, setDrivers] = useState<Driver[]>(() => StorageService.getDrivers());
  const [allocationHistory, setAllocationHistory] = useState<DriverAllocationHistory[]>(() =>
    StorageService.getAllocationHistory()
  );
  const [vehicleAllocationHistory, setVehicleAllocationHistory] = useState<VehicleAllocationHistory[]>(() =>
    StorageService.getVehicleAllocationHistory()
  );
  const [officerAllocationHistory, setOfficerAllocationHistory] = useState<OfficerAllocationHistory[]>(() =>
    StorageService.getOfficerAllocationHistory()
  );
  const [dailyLogs, setDailyLogs] = useState<DailyLogEntry[]>(() => StorageService.getDailyLogs());
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>(() =>
    StorageService.getFuelRecords()
  );
  const [fuelPumpVendors, setFuelPumpVendors] = useState<FuelPumpVendor[]>(() =>
    StorageService.getFuelPumpVendors()
  );
  const [fuelSlips, setFuelSlips] = useState<FuelSlip[]>(() =>
    StorageService.getFuelSlips()
  );
  const [fuelVendorBills, setFuelVendorBills] = useState<FuelVendorMonthlyBill[]>(() =>
    StorageService.getFuelVendorBills()
  );
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>(() =>
    StorageService.getMaintenanceRecords()
  );
  const [khataTransactions, setKhataTransactions] = useState<DriverKhataTransaction[]>(() =>
    StorageService.getKhataTransactions()
  );
  const [bills, setBills] = useState<MonthlyBill[]>(() => StorageService.getBills());
  const [vendors, setVendors] = useState<Vendor[]>(() => StorageService.getVendors());
  const [dailyPayments, setDailyPayments] = useState<DailyPaymentEntry[]>(() =>
    StorageService.getDailyPayments()
  );
  const [vendorSettlements, setVendorSettlements] = useState<VendorSettlement[]>(() =>
    StorageService.getVendorSettlements()
  );
  const [statutoryPayroll, setStatutoryPayroll] = useState<StatutoryPayrollEntry[]>(() =>
    StorageService.getStatutoryPayroll()
  );
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => StorageService.getStaffUsers());
  const [currentUserId, setCurrentUserId] = useState<string>(() => StorageService.getCurrentUserId());
  const [pettyCashTransactions, setPettyCashTransactions] = useState<PettyCashTransaction[]>(() =>
    StorageService.getPettyCashTransactions()
  );
  const [companyDocuments, setCompanyDocuments] = useState<CompanyDocument[]>(() =>
    StorageService.getCompanyDocuments()
  );
  const [driverLeaves, setDriverLeaves] = useState<DriverLeaveRecord[]>(() =>
    StorageService.getDriverLeaves()
  );
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [staffApiError, setStaffApiError] = useState('');
  const [mastersApiError, setMastersApiError] = useState('');

  const currentUser = useMemo(() => {
    return staffUsers.find((s) => s.id === currentUserId) || staffUsers[0];
  }, [staffUsers, currentUserId]);

  const applyAuthenticatedUser = useCallback((user: StaffUser) => {
    setStaffUsers((prev) => {
      const exists = prev.some((s) => s.id === user.id);
      const merged = exists ? prev.map((s) => (s.id === user.id ? user : s)) : [user, ...prev];
      StorageService.saveStaffUsers(merged);
      return merged;
    });
    setCurrentUserId(user.id);
    StorageService.saveCurrentUserId(user.id);
    setAuthStatus('authenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;

    const safetyTimer = window.setTimeout(() => {
      if (!cancelled) {
        setAuthStatus((prev) => (prev === 'loading' ? 'guest' : prev));
      }
    }, 12_000);

    (async () => {
      try {
        const live = await fetchCurrentUser();
        if (cancelled) return;
        if (live) {
          applyAuthenticatedUser(live);
        } else {
          setAuthStatus('guest');
        }
      } catch {
        if (!cancelled) setAuthStatus('guest');
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
    };
  }, [applyAuthenticatedUser]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    let cancelled = false;
    (async () => {
      try {
        const cachedTenders = StorageService.getTenders();
        const cachedDocs = StorageService.getCompanyDocuments();
        const cachedVehicles = StorageService.getVehicles();
        const cachedOfficers = StorageService.getOfficers();
        const cachedDrivers = StorageService.getDrivers();
        const cachedDriverAlloc = StorageService.getAllocationHistory();
        const cachedVehicleAlloc = StorageService.getVehicleAllocationHistory();
        const cachedOfficerAlloc = StorageService.getOfficerAllocationHistory();
        const cachedLogs = StorageService.getDailyLogs();
        const cachedMaint = StorageService.getMaintenanceRecords();
        const cachedFuelRecords = StorageService.getFuelRecords();
        const cachedFuelPumps = StorageService.getFuelPumpVendors();
        const cachedFuelSlips = StorageService.getFuelSlips();
        const cachedFuelBills = StorageService.getFuelVendorBills();
        const cachedBills = StorageService.getBills();
        const cachedKhata = StorageService.getKhataTransactions();
        const cachedLeaves = StorageService.getDriverLeaves();
        const cachedDailyPayments = StorageService.getDailyPayments();
        const cachedVendors = StorageService.getVendors();
        const cachedSettlements = StorageService.getVendorSettlements();
        const cachedPayroll = StorageService.getStatutoryPayroll();
        const cachedPetty = StorageService.getPettyCashTransactions();
        const alreadySeeded = sessionStorage.getItem(P2_MASTERS_SEEDED_KEY) === '1';
        const fleetSeeded = sessionStorage.getItem(P3_FLEET_SEEDED_KEY) === '1';
        const allocSeeded = sessionStorage.getItem(P4_ALLOC_SEEDED_KEY) === '1';
        const opsSeeded = sessionStorage.getItem(P5_OPS_SEEDED_KEY) === '1';
        const fuelSeeded = sessionStorage.getItem(P6_FUEL_SEEDED_KEY) === '1';
        const billingSeeded = sessionStorage.getItem(P7_BILLING_SEEDED_KEY) === '1';
        const moneySeeded = sessionStorage.getItem(P8_MONEY_SEEDED_KEY) === '1';

        let [
          list,
          summary,
          apiTenders,
          apiDocs,
          apiVehicles,
          apiOfficers,
          apiDrivers,
          apiDriverAlloc,
          apiVehicleAlloc,
          apiOfficerAlloc,
          apiLogs,
          apiMaint,
          apiFuelRecords,
          apiFuelPumps,
          apiFuelSlips,
          apiFuelBills,
          apiBills,
          apiKhata,
          apiLeaves,
          apiDailyPayments,
          apiVendors,
          apiSettlements,
          apiPayroll,
          apiPetty,
        ] = await Promise.all([
          fetchStaffList(),
          fetchDashboardSummary(),
          fetchTenders(),
          fetchCompanyDocuments(),
          fetchVehicles(),
          fetchOfficers(),
          fetchDrivers(),
          fetchDriverAllocations(),
          fetchVehicleAllocations(),
          fetchOfficerAllocations(),
          fetchDailyLogs(),
          fetchMaintenanceRecords(),
          fetchFuelRecords(),
          fetchFuelPumps(),
          fetchFuelSlips(),
          fetchFuelVendorBills(),
          fetchBills(),
          fetchKhataTransactions(),
          fetchDriverLeaves(),
          fetchDailyPayments(),
          fetchVendors(),
          fetchVendorSettlements(),
          fetchStatutoryPayroll(),
          fetchPettyCashTransactions(),
        ]);

        // One-time hydrate: empty DB after Phase 2 would otherwise wipe the local seed fleet links.
        let didSeed = false;
        if (!alreadySeeded && apiTenders.length === 0) {
          const source = cachedTenders.length > 0 ? cachedTenders : INITIAL_TENDERS;
          if (source.length > 0) {
            apiTenders = await bulkImportTendersApi(source);
            didSeed = true;
          }
        }
        if (!alreadySeeded && apiDocs.length === 0) {
          const source = cachedDocs.length > 0 ? cachedDocs : INITIAL_COMPANY_DOCUMENTS;
          if (source.length > 0) {
            apiDocs = await bulkImportCompanyDocumentsApi(source);
            didSeed = true;
          }
        }
        if (!alreadySeeded) {
          sessionStorage.setItem(P2_MASTERS_SEEDED_KEY, '1');
        }

        if (!fleetSeeded && apiVehicles.length === 0) {
          const source = cachedVehicles.length > 0 ? cachedVehicles : INITIAL_VEHICLES;
          if (source.length > 0) {
            apiVehicles = await bulkImportVehiclesApi(source);
            didSeed = true;
          }
        }
        if (!fleetSeeded && apiOfficers.length === 0) {
          const source = cachedOfficers.length > 0 ? cachedOfficers : INITIAL_OFFICERS;
          if (source.length > 0) {
            apiOfficers = await bulkImportOfficersApi(source);
            didSeed = true;
          }
        }
        if (!fleetSeeded && apiDrivers.length === 0) {
          const source = cachedDrivers.length > 0 ? cachedDrivers : INITIAL_DRIVERS;
          if (source.length > 0) {
            apiDrivers = await bulkImportDriversApi(source);
            didSeed = true;
          }
        }
        if (!fleetSeeded) {
          sessionStorage.setItem(P3_FLEET_SEEDED_KEY, '1');
        }

        if (
          !allocSeeded &&
          apiDriverAlloc.length === 0 &&
          apiVehicleAlloc.length === 0 &&
          apiOfficerAlloc.length === 0
        ) {
          const driversSrc =
            cachedDriverAlloc.length > 0 ? cachedDriverAlloc : INITIAL_ALLOCATION_HISTORY;
          const vehiclesSrc =
            cachedVehicleAlloc.length > 0
              ? cachedVehicleAlloc
              : INITIAL_VEHICLE_ALLOCATION_HISTORY;
          const officersSrc =
            cachedOfficerAlloc.length > 0
              ? cachedOfficerAlloc
              : INITIAL_OFFICER_ALLOCATION_HISTORY;
          if (driversSrc.length + vehiclesSrc.length + officersSrc.length > 0) {
            const imported = await bulkImportAllocationsApi({
              drivers: driversSrc,
              vehicles: vehiclesSrc,
              officers: officersSrc,
            });
            apiDriverAlloc = imported.drivers;
            apiVehicleAlloc = imported.vehicles;
            apiOfficerAlloc = imported.officers;
            didSeed = true;
          }
        }
        if (!allocSeeded) {
          sessionStorage.setItem(P4_ALLOC_SEEDED_KEY, '1');
        }

        if (!opsSeeded && apiLogs.length === 0) {
          const source = cachedLogs.length > 0 ? cachedLogs : INITIAL_DAILY_LOGS;
          if (source.length > 0) {
            apiLogs = await bulkImportDailyLogsApi(source);
            didSeed = true;
          }
        }
        if (!opsSeeded && apiMaint.length === 0) {
          const source = cachedMaint.length > 0 ? cachedMaint : INITIAL_MAINTENANCE_RECORDS;
          if (source.length > 0) {
            apiMaint = await bulkImportMaintenanceApi(source);
            didSeed = true;
          }
        }
        if (!opsSeeded) {
          sessionStorage.setItem(P5_OPS_SEEDED_KEY, '1');
        }

        if (!fuelSeeded && apiFuelPumps.length === 0) {
          const source = cachedFuelPumps.length > 0 ? cachedFuelPumps : INITIAL_FUEL_PUMP_VENDORS;
          if (source.length > 0) {
            apiFuelPumps = await bulkImportFuelPumpsApi(source);
            didSeed = true;
          }
        }
        if (!fuelSeeded && apiFuelSlips.length === 0) {
          const source = cachedFuelSlips.length > 0 ? cachedFuelSlips : INITIAL_FUEL_SLIPS;
          if (source.length > 0) {
            apiFuelSlips = await bulkImportFuelSlipsApi(source);
            didSeed = true;
          }
        }
        if (!fuelSeeded && apiFuelRecords.length === 0) {
          const source = cachedFuelRecords.length > 0 ? cachedFuelRecords : INITIAL_FUEL_RECORDS;
          if (source.length > 0) {
            apiFuelRecords = await bulkImportFuelRecordsApi(source);
            didSeed = true;
          }
        }
        if (!fuelSeeded && apiFuelBills.length === 0) {
          const source = cachedFuelBills.length > 0 ? cachedFuelBills : INITIAL_FUEL_VENDOR_BILLS;
          if (source.length > 0) {
            apiFuelBills = await bulkImportFuelVendorBillsApi(source);
            didSeed = true;
          }
        }
        if (!fuelSeeded) {
          sessionStorage.setItem(P6_FUEL_SEEDED_KEY, '1');
        }

        if (!billingSeeded && apiBills.length === 0) {
          const source = cachedBills.length > 0 ? cachedBills : INITIAL_BILLS;
          if (source.length > 0) {
            apiBills = await bulkImportBillsApi(source);
            didSeed = true;
          }
        }
        if (!billingSeeded) {
          sessionStorage.setItem(P7_BILLING_SEEDED_KEY, '1');
        }

        if (!moneySeeded && apiKhata.length === 0) {
          const source = cachedKhata.length > 0 ? cachedKhata : INITIAL_KHATA_TRANSACTIONS;
          if (source.length > 0) {
            apiKhata = await bulkImportKhataApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiLeaves.length === 0) {
          const source = cachedLeaves.length > 0 ? cachedLeaves : INITIAL_DRIVER_LEAVES;
          if (source.length > 0) {
            apiLeaves = await bulkImportDriverLeavesApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiVendors.length === 0) {
          const source = cachedVendors.length > 0 ? cachedVendors : INITIAL_VENDORS;
          if (source.length > 0) {
            apiVendors = await bulkImportVendorsApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiSettlements.length === 0) {
          const source =
            cachedSettlements.length > 0 ? cachedSettlements : INITIAL_VENDOR_SETTLEMENTS;
          if (source.length > 0) {
            apiSettlements = await bulkImportVendorSettlementsApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiDailyPayments.length === 0) {
          const source =
            cachedDailyPayments.length > 0 ? cachedDailyPayments : INITIAL_DAILY_PAYMENTS;
          if (source.length > 0) {
            apiDailyPayments = await bulkImportDailyPaymentsApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiPayroll.length === 0) {
          const source = cachedPayroll.length > 0 ? cachedPayroll : INITIAL_STATUTORY_PAYROLL;
          if (source.length > 0) {
            apiPayroll = await bulkImportStatutoryPayrollApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded && apiPetty.length === 0) {
          const source = cachedPetty.length > 0 ? cachedPetty : INITIAL_PETTY_CASH_TRANSACTIONS;
          if (source.length > 0) {
            apiPetty = await bulkImportPettyCashApi(source);
            didSeed = true;
          }
        }
        if (!moneySeeded) {
          sessionStorage.setItem(P8_MONEY_SEEDED_KEY, '1');
        }

        if (didSeed) {
          summary = await fetchDashboardSummary();
        }

        if (cancelled) return;
        setStaffUsers(list);
        StorageService.saveStaffUsers(list);
        setDashboardSummary(summary);
        setTenders(apiTenders);
        StorageService.saveTenders(apiTenders);
        setCompanyDocuments(apiDocs);
        StorageService.saveCompanyDocuments(apiDocs);
        setVehicles(apiVehicles);
        StorageService.saveVehicles(apiVehicles);
        setOfficers(apiOfficers);
        StorageService.saveOfficers(apiOfficers);
        setDrivers(apiDrivers);
        StorageService.saveDrivers(apiDrivers);
        setAllocationHistory(apiDriverAlloc);
        StorageService.saveAllocationHistory(apiDriverAlloc);
        setVehicleAllocationHistory(apiVehicleAlloc);
        StorageService.saveVehicleAllocationHistory(apiVehicleAlloc);
        setOfficerAllocationHistory(apiOfficerAlloc);
        StorageService.saveOfficerAllocationHistory(apiOfficerAlloc);
        setDailyLogs(apiLogs);
        StorageService.saveDailyLogs(apiLogs);
        setMaintenanceRecords(apiMaint);
        StorageService.saveMaintenanceRecords(apiMaint);
        setFuelRecords(apiFuelRecords);
        StorageService.saveFuelRecords(apiFuelRecords);
        setFuelPumpVendors(apiFuelPumps);
        StorageService.saveFuelPumpVendors(apiFuelPumps);
        setFuelSlips(apiFuelSlips);
        StorageService.saveFuelSlips(apiFuelSlips);
        setFuelVendorBills(apiFuelBills);
        StorageService.saveFuelVendorBills(apiFuelBills);
        setBills(apiBills);
        StorageService.saveBills(apiBills);
        setKhataTransactions(apiKhata);
        StorageService.saveKhataTransactions(apiKhata);
        setDriverLeaves(apiLeaves);
        StorageService.saveDriverLeaves(apiLeaves);
        setDailyPayments(apiDailyPayments);
        StorageService.saveDailyPayments(apiDailyPayments);
        setVendors(apiVendors);
        StorageService.saveVendors(apiVendors);
        setVendorSettlements(apiSettlements);
        StorageService.saveVendorSettlements(apiSettlements);
        setStatutoryPayroll(apiPayroll);
        StorageService.saveStatutoryPayroll(apiPayroll);
        setPettyCashTransactions(apiPetty);
        StorageService.savePettyCashTransactions(apiPetty);
        setStaffApiError('');
        setMastersApiError('');
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Could not load data from API.';
          setStaffApiError(msg);
          setMastersApiError(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const handleLogout = () => {
    flushStorageWrites();
    clearAuthSession();
    setAuthStatus('guest');
    setAuthScreen('login');
    setActiveTab('dashboard');
  };

  // Modal Open Triggers
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isGlobalBulkImportOpen, setIsGlobalBulkImportOpen] = useState(false);
  const [bulkImportInitialType, setBulkImportInitialType] = useState<BulkImportType>('combined');

  // Unified Profile Management Modal (Drivers, Vendors, Officers, Vehicles)
  const [isUnifiedProfileModalOpen, setIsUnifiedProfileModalOpen] = useState(false);
  const [unifiedProfileModalConfig, setUnifiedProfileModalConfig] = useState<{
    type: ProfileEntityType;
    id?: string;
  }>({ type: 'driver' });

  const handleOpenProfileModal = (type: ProfileEntityType = 'driver', id?: string) => {
    setUnifiedProfileModalConfig({ type, id });
    setIsUnifiedProfileModalOpen(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
    const snapshot = drivers;
    const updated = drivers.filter((d) => d.id !== driverId);
    setDrivers(updated);
    StorageService.saveDrivers(updated);
    try {
      await deleteDriverApi(driverId);
      setMastersApiError('');
    } catch (err: unknown) {
      setDrivers(snapshot);
      StorageService.saveDrivers(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete driver.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    const snapshot = vendors;
    const updated = vendors.filter((v) => v.id !== vendorId);
    setVendors(updated);
    StorageService.saveVendors(updated);
    try {
      await deleteVendorApi(vendorId);
      setMastersApiError('');
    } catch (err: unknown) {
      setVendors(snapshot);
      StorageService.saveVendors(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete vendor.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const applyDailyPaymentRouted = (routed: DailyPaymentRouted) => {
    if (routed.khata) {
      setKhataTransactions((prev) => {
        const next = [routed.khata!, ...prev.filter((t) => t.id !== routed.khata!.id)];
        StorageService.saveKhataTransactions(next);
        return next;
      });
    }
    if (routed.fuelRecord) {
      setFuelRecords((prev) => {
        const next = [
          routed.fuelRecord!,
          ...prev.filter((r) => r.id !== routed.fuelRecord!.id),
        ];
        StorageService.saveFuelRecords(next);
        return next;
      });
    }
    if (routed.maintenance) {
      setMaintenanceRecords((prev) => {
        const next = [
          routed.maintenance!,
          ...prev.filter((r) => r.id !== routed.maintenance!.id),
        ];
        StorageService.saveMaintenanceRecords(next);
        return next;
      });
    }
    if (routed.settlement) {
      setVendorSettlements((prev) => {
        const next = prev.map((s) =>
          s.id === routed.settlement!.id ? routed.settlement! : s
        );
        StorageService.saveVendorSettlements(next);
        return next;
      });
    }
  };

  const handleDeleteOfficer = async (officerId: string) => {
    const snapshot = officers;
    const updated = officers.filter((o) => o.id !== officerId);
    setOfficers(updated);
    StorageService.saveOfficers(updated);
    try {
      await deleteOfficerApi(officerId);
      setMastersApiError('');
    } catch (err: unknown) {
      setOfficers(snapshot);
      StorageService.saveOfficers(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete officer.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  // Dynamic Reminders calculation (including company document expiries)
  const reminders = useMemo(() => {
    return generateAllReminders(tenders, vehicles, drivers, bills, companyDocuments);
  }, [tenders, vehicles, drivers, bills, companyDocuments]);

  // Company docs alert count for Navbar badge
  const companyDocAlertsCount = useMemo(() => {
    return companyDocuments.filter((d) => {
      if (d.isLifetime || !d.expiryDate) return false;
      const days = getDaysDiff(d.expiryDate);
      return days <= (d.alertDaysBefore || 30);
    }).length;
  }, [companyDocuments]);

  // Vehicle document expiries 1-month alert count for Navbar badge
  const vehicleDocAlertsCount = useMemo(() => {
    return vehicles.filter((v) => {
      const pucDays = v.pucExpiry ? getDaysDiff(v.pucExpiry) : 999;
      const insDays = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : 999;
      const fitDays = v.rtoFitnessExpiry ? getDaysDiff(v.rtoFitnessExpiry) : 999;
      const permitDays = v.permitExpiry ? getDaysDiff(v.permitExpiry) : 999;
      const taxDays = v.roadTaxExpiry ? getDaysDiff(v.roadTaxExpiry) : 999;
      return (
        pucDays <= 30 ||
        insDays <= 30 ||
        fitDays <= 30 ||
        permitDays <= 30 ||
        taxDays <= 30
      );
    }).length;
  }, [vehicles]);

  // Pending bills calculation for header
  const pendingBillsAmount = useMemo(() => {
    return bills
      .filter((b) => b.paymentStatus === 'submitted' || b.paymentStatus === 'overdue')
      .reduce((sum, b) => sum + b.netPayableAmount, 0);
  }, [bills]);

  // Handlers for updating data & saving to storage
  const handleSaveTender = async (tender: Tender) => {
    const snapshot = tenders;
    const exists = tenders.some((t) => t.id === tender.id);
    const optimistic = exists
      ? tenders.map((t) => (t.id === tender.id ? tender : t))
      : [...tenders, tender];
    setTenders(optimistic);
    StorageService.saveTenders(optimistic);

    try {
      const saved = exists
        ? await updateTenderApi(tender.id, tender)
        : await createTenderApi(tender);
      startTransition(() => {
        setTenders((prev) => {
          const next = prev.some((t) => t.id === saved.id)
            ? prev.map((t) => (t.id === saved.id ? saved : t))
            : [...prev, saved];
          StorageService.saveTenders(next);
          return next;
        });
        setMastersApiError('');
      });
    } catch (err: unknown) {
      setTenders(snapshot);
      StorageService.saveTenders(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save tender to API.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const handleSaveVehicle = async (vehicle: Vehicle) => {
    const snapshot = vehicles;
    const exists = vehicles.some((v) => v.id === vehicle.id);
    const updated = exists
      ? vehicles.map((v) => (v.id === vehicle.id ? vehicle : v))
      : [...vehicles, vehicle];
    setVehicles(updated);
    StorageService.saveVehicles(updated);

    try {
      const saved = exists
        ? await updateVehicleApi(vehicle.id, vehicle)
        : await createVehicleApi(vehicle);
      startTransition(() => {
        setVehicles((prev) => {
          const next = prev.some((v) => v.id === saved.id)
            ? prev.map((v) => (v.id === saved.id ? saved : v))
            : [...prev, saved];
          StorageService.saveVehicles(next);
          return next;
        });
        setMastersApiError('');
      });
    } catch (err: unknown) {
      setVehicles(snapshot);
      StorageService.saveVehicles(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save vehicle to API.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const handleSaveOfficer = async (officer: Officer) => {
    const snapshot = officers;
    const code =
      officer.officerCode ||
      (officer.id && officer.id.startsWith('OFF-') ? officer.id : generateOfficerUniqueId(officers));
    const finalOfficer: Officer = {
      ...officer,
      officerCode: code,
      id: officer.id || code,
    };
    const exists = officers.some((o) => o.id === finalOfficer.id);
    const updated = exists
      ? officers.map((o) => (o.id === finalOfficer.id ? finalOfficer : o))
      : [...officers, finalOfficer];
    setOfficers(updated);
    StorageService.saveOfficers(updated);

    try {
      const saved = exists
        ? await updateOfficerApi(finalOfficer.id, finalOfficer)
        : await createOfficerApi(finalOfficer);
      startTransition(() => {
        setOfficers((prev) => {
          const next = prev.some((o) => o.id === saved.id)
            ? prev.map((o) => (o.id === saved.id ? saved : o))
            : [...prev, saved];
          StorageService.saveOfficers(next);
          return next;
        });
        setMastersApiError('');
      });
    } catch (err: unknown) {
      setOfficers(snapshot);
      StorageService.saveOfficers(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save officer to API.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const handleSaveDriver = async (driver: Driver) => {
    const snapshot = drivers;
    const code =
      driver.driverCode ||
      (driver.id && driver.id.startsWith('DRV-') ? driver.id : generateDriverUniqueId(drivers));
    const finalDriver: Driver = {
      ...driver,
      driverCode: code,
      id: driver.id || code,
    };
    const exists = drivers.some((d) => d.id === finalDriver.id);
    const updated = exists
      ? drivers.map((d) => (d.id === finalDriver.id ? finalDriver : d))
      : [...drivers, finalDriver];
    setDrivers(updated);
    StorageService.saveDrivers(updated);

    try {
      const saved = exists
        ? await updateDriverApi(finalDriver.id, finalDriver)
        : await createDriverApi(finalDriver);
      startTransition(() => {
        setDrivers((prev) => {
          const next = prev.some((d) => d.id === saved.id)
            ? prev.map((d) => (d.id === saved.id ? saved : d))
            : [...prev, saved];
          StorageService.saveDrivers(next);
          return next;
        });
        setMastersApiError('');
      });
    } catch (err: unknown) {
      setDrivers(snapshot);
      StorageService.saveDrivers(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save driver to API.';
      setMastersApiError(msg);
      throw new Error(msg);
    }
  };

  const handleBulkImportVehicles = (newVehicles: Vehicle[], newVendors?: Vendor[]) => {
    const updatedVehicles = [...newVehicles, ...vehicles];
    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);

    if (newVendors && newVendors.length > 0) {
      const tempVendors = [...vendors];
      const processedVendors = newVendors.map((vnd) => {
        const vCode = vnd.vendorCode || generateVendorUniqueId(tempVendors, vnd.vendorType);
        const completeV = { ...vnd, vendorCode: vCode, id: vnd.id || vCode };
        tempVendors.push(completeV);
        return completeV;
      });
      const updatedVendors = [...processedVendors, ...vendors];
      setVendors(updatedVendors);
      StorageService.saveVendors(updatedVendors);
    }

    (async () => {
      try {
        const imported = await bulkImportVehiclesApi(newVehicles);
        setVehicles((prev) => {
          const byId = new Map(prev.map((v) => [v.id, v]));
          for (const v of imported) byId.set(v.id, v);
          const next = Array.from(byId.values());
          StorageService.saveVehicles(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not bulk-import vehicles.');
      }
    })();
  };

  const handleBulkImportDrivers = (newDrivers: Driver[]) => {
    const tempDrivers = [...drivers];
    const processedDrivers = newDrivers.map((d) => {
      const code = d.driverCode || generateDriverUniqueId(tempDrivers);
      const completeD: Driver = { ...d, driverCode: code, id: d.id || code };
      tempDrivers.push(completeD);
      return completeD;
    });
    const updatedDrivers = [...processedDrivers, ...drivers];
    setDrivers(updatedDrivers);
    StorageService.saveDrivers(updatedDrivers);

    (async () => {
      try {
        const imported = await bulkImportDriversApi(processedDrivers);
        setDrivers((prev) => {
          const byId = new Map(prev.map((d) => [d.id, d]));
          for (const d of imported) byId.set(d.id, d);
          const next = Array.from(byId.values());
          StorageService.saveDrivers(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not bulk-import drivers.');
      }
    })();
  };

  const handleBulkImportOfficers = (newOfficers: Officer[]) => {
    const tempOfficers = [...officers];
    const processedOfficers = newOfficers.map((o) => {
      const code = o.officerCode || generateOfficerUniqueId(tempOfficers);
      const completeO: Officer = { ...o, officerCode: code, id: o.id || code };
      tempOfficers.push(completeO);
      return completeO;
    });
    const updatedOfficers = [...processedOfficers, ...officers];
    setOfficers(updatedOfficers);
    StorageService.saveOfficers(updatedOfficers);

    (async () => {
      try {
        const imported = await bulkImportOfficersApi(processedOfficers);
        setOfficers((prev) => {
          const byId = new Map(prev.map((o) => [o.id, o]));
          for (const o of imported) byId.set(o.id, o);
          const next = Array.from(byId.values());
          StorageService.saveOfficers(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not bulk-import officers.');
      }
    })();
  };

  const handleBulkImportTenders = (newTenders: Tender[]) => {
    const updatedTenders = [...newTenders, ...tenders];
    setTenders(updatedTenders);
    StorageService.saveTenders(updatedTenders);

    (async () => {
      try {
        const imported = await bulkImportTendersApi(newTenders);
        setTenders((prev) => {
          const byId = new Map(prev.map((t) => [t.id, t]));
          for (const t of imported) byId.set(t.id, t);
          const next = Array.from(byId.values());
          StorageService.saveTenders(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not bulk-import tenders.');
      }
    })();
  };

  // Driver replacement handler: "Kaun kab hata, kaun kab laga"
  const handleReplaceDriver = (
    vehicleId: string,
    newDriverId: string,
    reason: ReplacementReason,
    effectiveDate: string,
    notes: string
  ) => {
    (async () => {
      try {
        const result = await replaceDriverApi({
          vehicleId,
          newDriverId,
          reason,
          effectiveDate,
          notes,
        });
        setVehicles((prev) => {
          const next = prev.map((v) => (v.id === result.vehicle.id ? result.vehicle : v));
          StorageService.saveVehicles(next);
          return next;
        });
        setDrivers((prev) => {
          const byId = new Map(prev.map((d) => [d.id, d]));
          for (const d of result.drivers) byId.set(d.id, d);
          const next = Array.from(byId.values());
          StorageService.saveDrivers(next);
          return next;
        });
        if (result.officer) {
          setOfficers((prev) => {
            const next = prev.map((o) => (o.id === result.officer!.id ? result.officer! : o));
            StorageService.saveOfficers(next);
            return next;
          });
        }
        setAllocationHistory((prev) => {
          const closed = prev.map((h) =>
            h.vehicleId === vehicleId && !h.releasedDate
              ? { ...h, releasedDate: effectiveDate }
              : h
          );
          const next = [result.allocation, ...closed.filter((h) => h.id !== result.allocation.id)];
          StorageService.saveAllocationHistory(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not replace driver.');
      }
    })();
  };

  // Vehicle replacement handler: "Kaun si gadi kab hati, kiski lagi"
  const handleReplaceVehicle = (
    tenderId: string,
    oldVehicleId: string,
    newVehicleData: {
      id?: string;
      vehicleNumber: string;
      makeModel: string;
      ownershipType?: 'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver';
      vendorId?: string;
      vendorName?: string;
      monthlyVendorRent?: number;
      fuelType?: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
      vehicleType?: 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV';
    },
    reason: VehicleReplacementReason,
    effectiveDate: string,
    notes: string,
    transferDriverAndOfficer: boolean = true
  ) => {
    (async () => {
      try {
        const result = await replaceVehicleApi({
          tenderId,
          oldVehicleId,
          newVehicle: newVehicleData,
          reason,
          effectiveDate,
          notes,
          transferDriverAndOfficer,
        });
        setVehicles((prev) => {
          const byId = new Map(prev.map((v) => [v.id, v]));
          byId.set(result.oldVehicle.id, result.oldVehicle);
          byId.set(result.vehicle.id, result.vehicle);
          const next = Array.from(byId.values());
          StorageService.saveVehicles(next);
          return next;
        });
        if (result.officer) {
          setOfficers((prev) => {
            const next = prev.map((o) => (o.id === result.officer!.id ? result.officer! : o));
            StorageService.saveOfficers(next);
            return next;
          });
        }
        if (result.driver) {
          setDrivers((prev) => {
            const next = prev.map((d) => (d.id === result.driver!.id ? result.driver! : d));
            StorageService.saveDrivers(next);
            return next;
          });
        }
        setVehicleAllocationHistory((prev) => {
          const closed = prev.map((h) =>
            h.vehicleId === oldVehicleId && !h.releasedDate
              ? {
                  ...h,
                  releasedDate: effectiveDate,
                  replacementVehicleNumber: result.vehicle.vehicleNumber,
                  replacementVehicleModel: result.vehicle.makeModel,
                }
              : h
          );
          const next = [result.allocation, ...closed.filter((h) => h.id !== result.allocation.id)];
          StorageService.saveVehicleAllocationHistory(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not replace vehicle.');
      }
    })();
  };

  // Officer Transfer & Vehicle Idle Management: "Adhikari change ya transfer ho gaya to gadi band/reassign"
  const handleTransferOrRelieveOfficer = (
    vehicleId: string,
    action: 'halt_car_post_vacant' | 'reassign_new_officer' | 'surrender_vehicle' | 'move_to_pool',
    effectiveDate: string,
    reason: OfficerTransferReason,
    transferOrderNumber: string,
    notes: string,
    newOfficerData?: {
      id?: string;
      name: string;
      designation: string;
      department?: string;
      mobile: string;
      reportingTime?: string;
    },
    driverAction: 'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave' = 'keep_on_vehicle'
  ) => {
    (async () => {
      try {
        const result = await transferOfficerApi({
          vehicleId,
          action,
          effectiveDate,
          reason,
          transferOrderNumber,
          notes,
          newOfficer: newOfficerData,
          driverAction,
        });
        setVehicles((prev) => {
          const next = prev.map((v) => (v.id === result.vehicle.id ? result.vehicle : v));
          StorageService.saveVehicles(next);
          return next;
        });
        setOfficers((prev) => {
          const byId = new Map(prev.map((o) => [o.id, o]));
          if (result.oldOfficer) byId.set(result.oldOfficer.id, result.oldOfficer);
          if (result.officer) byId.set(result.officer.id, result.officer);
          const next = Array.from(byId.values());
          StorageService.saveOfficers(next);
          return next;
        });
        if (result.driver) {
          setDrivers((prev) => {
            const next = prev.map((d) => (d.id === result.driver!.id ? result.driver! : d));
            StorageService.saveDrivers(next);
            return next;
          });
        }
        if (result.allocation) {
          setOfficerAllocationHistory((prev) => {
            const closed = prev.map((h) =>
              h.vehicleId === vehicleId && !h.relievedDate
                ? { ...h, relievedDate: effectiveDate }
                : h
            );
            const next = [
              result.allocation!,
              ...closed.filter((h) => h.id !== result.allocation!.id),
            ];
            StorageService.saveOfficerAllocationHistory(next);
            return next;
          });
        }
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not transfer officer.');
      }
    })();
  };

  // Quick Resume Vehicle: Assigns incoming officer & reactivates halted vehicle
  const handleReactivateIdleVehicle = (
    vehicleId: string,
    officerIdOrNew: string | { name: string; designation: string; mobile: string; department?: string },
    effectiveDate: string,
    notes: string
  ) => {
    (async () => {
      try {
        const result = await reactivateVehicleAllocationApi({
          vehicleId,
          effectiveDate,
          notes,
          ...(typeof officerIdOrNew === 'string'
            ? { officerId: officerIdOrNew }
            : { newOfficer: officerIdOrNew }),
        });
        setVehicles((prev) => {
          const next = prev.map((v) => (v.id === result.vehicle.id ? result.vehicle : v));
          StorageService.saveVehicles(next);
          return next;
        });
        setOfficers((prev) => {
          const byId = new Map(prev.map((o) => [o.id, o]));
          byId.set(result.officer.id, result.officer);
          const next = Array.from(byId.values());
          StorageService.saveOfficers(next);
          return next;
        });
        setOfficerAllocationHistory((prev) => {
          const next = [result.allocation, ...prev.filter((h) => h.id !== result.allocation.id)];
          StorageService.saveOfficerAllocationHistory(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not reactivate vehicle.');
      }
    })();
  };

  const handleAddLog = (entry: DailyLogEntry) => {
    const updated = [entry, ...dailyLogs];
    setDailyLogs(updated);
    StorageService.saveDailyLogs(updated);

    (async () => {
      try {
        const result = await createDailyLogApi(entry);
        setDailyLogs((prev) => {
          const next = [result.log, ...prev.filter((l) => l.id !== result.log.id && l.id !== entry.id)];
          StorageService.saveDailyLogs(next);
          return next;
        });
        if (result.vehicle) {
          setVehicles((prev) => {
            const next = prev.map((v) => (v.id === result.vehicle!.id ? result.vehicle! : v));
            StorageService.saveVehicles(next);
            return next;
          });
        }
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not save daily log.');
      }
    })();
  };

  const handleToggleVerified = (id: string) => {
    const updated = dailyLogs.map((l) =>
      l.id === id ? { ...l, isVerifiedByOfficer: !l.isVerifiedByOfficer } : l
    );
    setDailyLogs(updated);
    StorageService.saveDailyLogs(updated);

    (async () => {
      try {
        const saved = await verifyDailyLogApi(id);
        setDailyLogs((prev) => {
          const next = prev.map((l) => (l.id === saved.id ? saved : l));
          StorageService.saveDailyLogs(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(err instanceof Error ? err.message : 'Could not verify daily log.');
      }
    })();
  };

  const handleSaveBill = async (bill: MonthlyBill) => {
    try {
      const exists = bills.some((b) => b.id === bill.id);
      const saved = exists
        ? await updateBillApi(bill.id, bill)
        : (await createBillApi({ ...bill, advanceSeries: true })).bill;
      const updated = exists
        ? bills.map((b) => (b.id === saved.id ? saved : b))
        : [saved, ...bills];
      setBills(updated);
      StorageService.saveBills(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save bill.');
    }
  };

  const handleUpdateBillStatus = async (
    billId: string,
    status: PaymentStatus,
    remarks?: string,
    voucher?: string,
    newBillNumber?: string
  ) => {
    try {
      const saved = await updateBillStatusApi(billId, {
        status,
        billNumber: newBillNumber,
        paymentRemarks: remarks,
        voucherNumber: voucher,
      });
      const updated = bills.map((b) => (b.id === billId ? saved : b));
      setBills(updated);
      StorageService.saveBills(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not update bill status.');
    }
  };

  const handleAddFuelRecord = async (record: FuelRecord) => {
    try {
      const result = await createFuelRecordApi(record);
      const updated = [result.record, ...fuelRecords.filter((r) => r.id !== result.record.id)];
      setFuelRecords(updated);
      StorageService.saveFuelRecords(updated);
      if (result.vehicle) {
        const nextVehicles = vehicles.map((v) =>
          v.id === result.vehicle!.id ? result.vehicle! : v
        );
        setVehicles(nextVehicles);
        StorageService.saveVehicles(nextVehicles);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save fuel record.');
    }
  };

  const handleSaveFuelSlip = async (slip: FuelSlip) => {
    try {
      const exists = fuelSlips.some((s) => s.id === slip.id);
      let saved: FuelSlip;
      if (exists && slip.status === 'filled') {
        const prior = fuelSlips.find((s) => s.id === slip.id);
        if (prior && prior.status === 'issued') {
          const result = await markFuelSlipFilledApi(slip.id, {
            ...slip,
            createFuelRecord: false,
          });
          saved = result.slip;
          if (result.vehicle) {
            const nextVehicles = vehicles.map((v) =>
              v.id === result.vehicle!.id ? result.vehicle! : v
            );
            setVehicles(nextVehicles);
            StorageService.saveVehicles(nextVehicles);
          }
        } else {
          saved = await updateFuelSlipApi(slip.id, slip);
        }
      } else if (exists) {
        saved = await updateFuelSlipApi(slip.id, slip);
      } else {
        saved = await createFuelSlipApi(slip);
      }
      const updated = exists
        ? fuelSlips.map((s) => (s.id === saved.id ? saved : s))
        : [saved, ...fuelSlips];
      setFuelSlips(updated);
      StorageService.saveFuelSlips(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save fuel slip.');
    }
  };

  const handleDeleteFuelSlip = async (slipId: string) => {
    try {
      await deleteFuelSlipApi(slipId);
      const updated = fuelSlips.filter((s) => s.id !== slipId);
      setFuelSlips(updated);
      StorageService.saveFuelSlips(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete fuel slip.');
    }
  };

  const handleSavePumpVendor = async (vendor: FuelPumpVendor) => {
    try {
      const exists = fuelPumpVendors.some((p) => p.id === vendor.id);
      const saved = exists
        ? await updateFuelPumpApi(vendor.id, vendor)
        : await createFuelPumpApi(vendor);
      const updated = exists
        ? fuelPumpVendors.map((p) => (p.id === saved.id ? saved : p))
        : [...fuelPumpVendors, saved];
      setFuelPumpVendors(updated);
      StorageService.saveFuelPumpVendors(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save fuel pump.');
    }
  };

  const handleDeletePumpVendor = async (vendorId: string) => {
    try {
      await deleteFuelPumpApi(vendorId);
      const updated = fuelPumpVendors.filter((p) => p.id !== vendorId);
      setFuelPumpVendors(updated);
      StorageService.saveFuelPumpVendors(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete fuel pump.');
    }
  };

  const handleSaveFuelVendorBill = async (
    bill: FuelVendorMonthlyBill,
    linkedSlipIds: string[]
  ) => {
    try {
      const exists = fuelVendorBills.some((b) => b.id === bill.id);
      const { bill: saved, slips: linked } = exists
        ? {
            bill: await updateFuelVendorBillApi(bill.id, { ...bill, linkedSlipIds }),
            slips: [] as FuelSlip[],
          }
        : await createFuelVendorBillApi({ ...bill, linkedSlipIds });

      const updatedBills = exists
        ? fuelVendorBills.map((b) => (b.id === saved.id ? saved : b))
        : [saved, ...fuelVendorBills];
      setFuelVendorBills(updatedBills);
      StorageService.saveFuelVendorBills(updatedBills);

      if (linked.length > 0 || (linkedSlipIds && linkedSlipIds.length > 0)) {
        const linkedMap = new Map(linked.map((s) => [s.id, s]));
        const updatedSlips = fuelSlips.map((s) => {
          if (linkedMap.has(s.id)) return linkedMap.get(s.id)!;
          if (linkedSlipIds?.includes(s.id)) {
            return {
              ...s,
              status: 'billed' as const,
              vendorBillId: saved.id,
              vendorBillNumber: saved.billNumber,
            };
          }
          return s;
        });
        setFuelSlips(updatedSlips);
        StorageService.saveFuelSlips(updatedSlips);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not save fuel vendor bill.');
    }
  };

  const handleDeleteFuelVendorBill = async (billId: string) => {
    try {
      await deleteFuelVendorBillApi(billId);
      const updated = fuelVendorBills.filter((b) => b.id !== billId);
      setFuelVendorBills(updated);
      StorageService.saveFuelVendorBills(updated);
      const refreshedSlips = await fetchFuelSlips();
      setFuelSlips(refreshedSlips);
      StorageService.saveFuelSlips(refreshedSlips);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not delete fuel vendor bill.');
    }
  };

  const handlePayFuelVendorBill = async (
    billId: string,
    paymentData: { mode: 'bank_transfer' | 'cheque' | 'upi' | 'cash'; ref: string; date: string; amount: number }
  ) => {
    const bill = fuelVendorBills.find((b) => b.id === billId);
    if (!bill) return;

    let updatedBill: FuelVendorMonthlyBill;
    try {
      updatedBill = await payFuelVendorBillApi(billId, {
        amount: paymentData.amount,
        date: paymentData.date,
        mode: paymentData.mode,
        ref: paymentData.ref,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Could not record fuel bill payment.');
      return;
    }
    const updatedBills = fuelVendorBills.map((b) => (b.id === billId ? updatedBill : b));
    setFuelVendorBills(updatedBills);
    StorageService.saveFuelVendorBills(updatedBills);

    // Auto-record in Daily Payments Journal
    const paymentEntry: DailyPaymentEntry = {
      id: `pay-fuel-${Date.now()}`,
      date: paymentData.date,
      category: 'fuel',
      amount: paymentData.amount,
      paymentMode: paymentData.mode,
      referenceNumber: paymentData.ref,
      payeeName: bill.pumpVendorName,
      payeeType: 'fuel_pump',
      description: `पेट्रोल पंप मासिक बिल भुगतान - Bill #${bill.billNumber} (${bill.monthYear})`,
      autoRoutedTo: 'Fuel Records & Vendor Ledger',
      recordedBy: currentUser?.name || 'Fleet Cashier',
    };
    void (async () => {
      try {
        const { payment: saved } = await createDailyPaymentApi({
          ...paymentEntry,
          skipRouting: true,
        });
        setDailyPayments((prev) => {
          const next = [saved, ...prev.filter((p) => p.id !== saved.id)];
          StorageService.saveDailyPayments(next);
          return next;
        });
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Could not log daily payment for fuel bill.');
      }
    })();
  };

  const handleAddMaintenanceRecord = (record: MaintenanceRecord) => {
    const updated = [record, ...maintenanceRecords];
    setMaintenanceRecords(updated);
    StorageService.saveMaintenanceRecords(updated);

    (async () => {
      try {
        const result = await createMaintenanceApi(record);
        setMaintenanceRecords((prev) => {
          const next = [
            result.record,
            ...prev.filter((r) => r.id !== result.record.id && r.id !== record.id),
          ];
          StorageService.saveMaintenanceRecords(next);
          return next;
        });
        if (result.vehicle) {
          setVehicles((prev) => {
            const next = prev.map((v) => (v.id === result.vehicle!.id ? result.vehicle! : v));
            StorageService.saveVehicles(next);
            return next;
          });
        }
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(
          err instanceof Error ? err.message : 'Could not save maintenance record.'
        );
      }
    })();
  };

  const handleAddTransaction = async (tx: DriverKhataTransaction) => {
    const snapshot = khataTransactions;
    const optimistic = [tx, ...khataTransactions.filter((t) => t.id !== tx.id)];
    setKhataTransactions(optimistic);
    StorageService.saveKhataTransactions(optimistic);
    try {
      const saved = await createKhataTransactionApi(tx);
      setKhataTransactions((prev) => {
        const next = [saved, ...prev.filter((t) => t.id !== saved.id && t.id !== tx.id)];
        StorageService.saveKhataTransactions(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setKhataTransactions(snapshot);
      StorageService.saveKhataTransactions(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save khata transaction.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    const snapshot = khataTransactions;
    const updated = khataTransactions.filter((t) => t.id !== txId);
    setKhataTransactions(updated);
    StorageService.saveKhataTransactions(updated);
    try {
      await deleteKhataTransactionApi(txId);
      setMastersApiError('');
    } catch (err: unknown) {
      setKhataTransactions(snapshot);
      StorageService.saveKhataTransactions(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete khata transaction.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleSaveDriverLeave = async (leave: DriverLeaveRecord) => {
    const exists = driverLeaves.some((l) => l.id === leave.id);
    const snapshot = driverLeaves;
    const optimistic = exists
      ? driverLeaves.map((l) => (l.id === leave.id ? leave : l))
      : [leave, ...driverLeaves];
    setDriverLeaves(optimistic);
    StorageService.saveDriverLeaves(optimistic);
    try {
      const saved = exists
        ? await updateDriverLeaveApi(leave.id, leave)
        : await createDriverLeaveApi(leave);
      setDriverLeaves((prev) => {
        const next = exists
          ? prev.map((l) => (l.id === saved.id ? saved : l))
          : [saved, ...prev.filter((l) => l.id !== saved.id && l.id !== leave.id)];
        StorageService.saveDriverLeaves(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setDriverLeaves(snapshot);
      StorageService.saveDriverLeaves(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save driver leave.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleDeleteDriverLeave = async (leaveId: string) => {
    const snapshot = driverLeaves;
    const updated = driverLeaves.filter((l) => l.id !== leaveId);
    setDriverLeaves(updated);
    StorageService.saveDriverLeaves(updated);
    try {
      await deleteDriverLeaveApi(leaveId);
      setMastersApiError('');
    } catch (err: unknown) {
      setDriverLeaves(snapshot);
      StorageService.saveDriverLeaves(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not delete driver leave.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleSaveVendor = async (vendor: Vendor) => {
    const code =
      vendor.vendorCode ||
      (vendor.id && (vendor.id.startsWith('VND-') || vendor.id.startsWith('vnd-'))
        ? vendor.id.toUpperCase()
        : generateVendorUniqueId(vendors, vendor.vendorType));
    const finalVendor: Vendor = {
      ...vendor,
      vendorCode: code,
      id: vendor.id || code,
    };
    const exists = vendors.some((v) => v.id === finalVendor.id);
    const snapshot = vendors;
    const optimistic = exists
      ? vendors.map((v) => (v.id === finalVendor.id ? finalVendor : v))
      : [...vendors, finalVendor];
    setVendors(optimistic);
    StorageService.saveVendors(optimistic);
    try {
      const saved = exists
        ? await updateVendorApi(finalVendor.id, finalVendor)
        : await createVendorApi(finalVendor);
      setVendors((prev) => {
        const next = exists
          ? prev.map((v) => (v.id === saved.id ? saved : v))
          : [...prev.filter((v) => v.id !== saved.id && v.id !== finalVendor.id), saved];
        StorageService.saveVendors(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setVendors(snapshot);
      StorageService.saveVendors(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save vendor.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleSaveSettlement = async (settlement: VendorSettlement) => {
    const exists = vendorSettlements.some((s) => s.id === settlement.id);
    const snapshot = vendorSettlements;
    const optimistic = exists
      ? vendorSettlements.map((s) => (s.id === settlement.id ? settlement : s))
      : [settlement, ...vendorSettlements];
    setVendorSettlements(optimistic);
    StorageService.saveVendorSettlements(optimistic);
    try {
      const saved = exists
        ? await updateVendorSettlementApi(settlement.id, settlement)
        : await createVendorSettlementApi(settlement);
      setVendorSettlements((prev) => {
        const next = exists
          ? prev.map((s) => (s.id === saved.id ? saved : s))
          : [saved, ...prev.filter((s) => s.id !== saved.id && s.id !== settlement.id)];
        StorageService.saveVendorSettlements(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setVendorSettlements(snapshot);
      StorageService.saveVendorSettlements(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save vendor settlement.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handlePaySettlement = async (settlementId: string, paymentRef: string) => {
    const snapshot = vendorSettlements;
    const optimistic = vendorSettlements.map((s) =>
      s.id === settlementId
        ? {
            ...s,
            paymentStatus: 'paid' as const,
            paymentDate: new Date().toISOString().slice(0, 10),
            paymentRef,
          }
        : s
    );
    setVendorSettlements(optimistic);
    StorageService.saveVendorSettlements(optimistic);
    try {
      const saved = await payVendorSettlementApi(settlementId, { paymentRef });
      setVendorSettlements((prev) => {
        const next = prev.map((s) => (s.id === saved.id ? saved : s));
        StorageService.saveVendorSettlements(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setVendorSettlements(snapshot);
      StorageService.saveVendorSettlements(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not mark settlement paid.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleAddDailyPayment = async (payment: DailyPaymentEntry) => {
    const snapshot = dailyPayments;
    const optimistic = [payment, ...dailyPayments.filter((p) => p.id !== payment.id)];
    setDailyPayments(optimistic);
    StorageService.saveDailyPayments(optimistic);
    try {
      const { payment: saved, routed } = await createDailyPaymentApi(payment);
      setDailyPayments((prev) => {
        const next = [saved, ...prev.filter((p) => p.id !== saved.id && p.id !== payment.id)];
        StorageService.saveDailyPayments(next);
        return next;
      });
      applyDailyPaymentRouted(routed);
      setMastersApiError('');
    } catch (err: unknown) {
      setDailyPayments(snapshot);
      StorageService.saveDailyPayments(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save daily payment.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleAddBatchDailyPayments = async (payments: DailyPaymentEntry[]) => {
    if (!payments.length) return;
    const snapshot = dailyPayments;
    const optimistic = [...payments, ...dailyPayments];
    setDailyPayments(optimistic);
    StorageService.saveDailyPayments(optimistic);
    try {
      const { payments: saved, routed } = await createDailyPaymentsBatchApi(payments);
      setDailyPayments((prev) => {
        const ids = new Set(payments.map((p) => p.id));
        const next = [...saved, ...prev.filter((p) => !ids.has(p.id) && !saved.some((s) => s.id === p.id))];
        StorageService.saveDailyPayments(next);
        return next;
      });
      routed.forEach(applyDailyPaymentRouted);
      setMastersApiError('');
    } catch (err: unknown) {
      setDailyPayments(snapshot);
      StorageService.saveDailyPayments(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save batch payments.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleSavePayrollEntry = async (entry: StatutoryPayrollEntry) => {
    const exists = statutoryPayroll.some((p) => p.id === entry.id);
    const snapshot = statutoryPayroll;
    const optimistic = exists
      ? statutoryPayroll.map((p) => (p.id === entry.id ? entry : p))
      : [entry, ...statutoryPayroll];
    setStatutoryPayroll(optimistic);
    StorageService.saveStatutoryPayroll(optimistic);
    try {
      const saved = exists
        ? await updateStatutoryPayrollApi(entry.id, entry)
        : await createStatutoryPayrollApi(entry);
      setStatutoryPayroll((prev) => {
        const next = exists
          ? prev.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...prev.filter((p) => p.id !== saved.id && p.id !== entry.id)];
        StorageService.saveStatutoryPayroll(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setStatutoryPayroll(snapshot);
      StorageService.saveStatutoryPayroll(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not save payroll entry.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleEnrollDriver = async (
    driverId: string,
    uan: string,
    esicIp: string,
    basic: number,
    vda: number,
    hra: number
  ) => {
    const snapshot = drivers;
    const patch = {
      uanNumber: uan,
      esicIpNumber: esicIp,
      minimumWageBasic: basic,
      vda,
      hra,
      isEpfApplicable: true,
      isEsicApplicable: true,
      employmentType: 'company_statutory' as const,
    };
    const optimistic = drivers.map((d) => (d.id === driverId ? { ...d, ...patch } : d));
    setDrivers(optimistic);
    StorageService.saveDrivers(optimistic);
    try {
      const saved = await updateDriverApi(driverId, patch);
      setDrivers((prev) => {
        const next = prev.map((d) => (d.id === saved.id ? saved : d));
        StorageService.saveDrivers(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setDrivers(snapshot);
      StorageService.saveDrivers(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not enroll driver.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  // Multi-user & RBAC handlers
  const handleSwitchUser = (user: StaffUser) => {
    setCurrentUserId(user.id);
    StorageService.saveCurrentUserId(user.id);
    // If user does not have permission for current activeTab, auto-switch to first allowed tab
    if (user.role !== 'admin') {
      const permKey = (activeTab === 'fuel' ? 'fuel_manager' : activeTab) as any;
      if ((user.permissions as Record<string, any>)?.[permKey]?.canView === false) {
        const priorityTabs: ActiveTab[] = [
          'petty_cash',
          'fuel',
          'logbook',
          'vehicles_officers',
          'dashboard',
          'billing',
          'drivers_khata',
          'maintenance',
          'daily_payments',
        ];
        const next = priorityTabs.find((t) => {
          const k = (t === 'fuel' ? 'fuel_manager' : t) as any;
          return (user.permissions as Record<string, any>)?.[k]?.canView !== false;
        }) || 'petty_cash';
        setActiveTab(next);
      }
    }
  };

  const handleSaveStaffUser = async (user: StaffUser) => {
    setStaffApiError('');
    try {
      const isNewLocalId = user.id.startsWith('staff-');
      const existsOnServer = staffUsers.some((s) => s.id === user.id && !isNewLocalId);

      const saved = existsOnServer
        ? await updateStaffApi(user.id, {
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            designation: user.designation,
            role: user.role,
            avatarColor: user.avatarColor,
            permissions: user.permissions,
          })
        : await createStaffApi({
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            designation: user.designation,
            role: user.role,
            pin: user.pin || undefined,
            password: user.pin && user.pin.length >= 8 ? user.pin : undefined,
            avatarColor: user.avatarColor,
            permissions: user.permissions,
          });

      setStaffUsers((prev) => {
        const withoutTemp = prev.filter((s) => s.id !== user.id);
        const exists = withoutTemp.some((s) => s.id === saved.id);
        const merged = exists
          ? withoutTemp.map((s) => (s.id === saved.id ? saved : s))
          : [...withoutTemp, saved];
        StorageService.saveStaffUsers(merged);
        return merged;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not save staff member.';
      setStaffApiError(message);
      alert(message);
    }
  };

  // Petty Cash & Field Expenses handlers (लड़के का पेटी कैश व दैनिक खर्च)
  const handleAddPettyCashTransaction = async (txn: PettyCashTransaction) => {
    const snapshotPetty = pettyCashTransactions;
    const optimistic = [txn, ...pettyCashTransactions.filter((t) => t.id !== txn.id)];
    setPettyCashTransactions(optimistic);
    StorageService.savePettyCashTransactions(optimistic);
    try {
      const { transaction: saved, sideEffects } = await createPettyCashApi(txn);
      setPettyCashTransactions((prev) => {
        const next = [saved, ...prev.filter((t) => t.id !== saved.id && t.id !== txn.id)];
        StorageService.savePettyCashTransactions(next);
        return next;
      });
      if (sideEffects.payment) {
        setDailyPayments((prev) => {
          const next = [
            sideEffects.payment!,
            ...prev.filter((p) => p.id !== sideEffects.payment!.id),
          ];
          StorageService.saveDailyPayments(next);
          return next;
        });
      }
      if (sideEffects.fuelRecord) {
        setFuelRecords((prev) => {
          const next = [
            sideEffects.fuelRecord!,
            ...prev.filter((r) => r.id !== sideEffects.fuelRecord!.id),
          ];
          StorageService.saveFuelRecords(next);
          return next;
        });
      }
      if (sideEffects.maintenance) {
        setMaintenanceRecords((prev) => {
          const next = [
            sideEffects.maintenance!,
            ...prev.filter((r) => r.id !== sideEffects.maintenance!.id),
          ];
          StorageService.saveMaintenanceRecords(next);
          return next;
        });
      }
      setMastersApiError('');
    } catch (err: unknown) {
      setPettyCashTransactions(snapshotPetty);
      StorageService.savePettyCashTransactions(snapshotPetty);
      const msg = err instanceof Error ? err.message : 'Could not save petty cash transaction.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleUpdatePettyCashTransaction = async (txn: PettyCashTransaction) => {
    const snapshot = pettyCashTransactions;
    const optimistic = pettyCashTransactions.map((t) => (t.id === txn.id ? txn : t));
    setPettyCashTransactions(optimistic);
    StorageService.savePettyCashTransactions(optimistic);
    try {
      const saved = await updatePettyCashApi(txn.id, txn);
      setPettyCashTransactions((prev) => {
        const next = prev.map((t) => (t.id === saved.id ? saved : t));
        StorageService.savePettyCashTransactions(next);
        return next;
      });
      setMastersApiError('');
    } catch (err: unknown) {
      setPettyCashTransactions(snapshot);
      StorageService.savePettyCashTransactions(snapshot);
      const msg = err instanceof Error ? err.message : 'Could not update petty cash transaction.';
      setMastersApiError(msg);
      alert(msg);
    }
  };

  const handleSaveCompanyDocument = (doc: CompanyDocument) => {
    const exists = companyDocuments.some((d) => d.id === doc.id);
    const updated = exists
      ? companyDocuments.map((d) => (d.id === doc.id ? doc : d))
      : [doc, ...companyDocuments];
    setCompanyDocuments(updated);
    StorageService.saveCompanyDocuments(updated);

    (async () => {
      try {
        const saved = exists
          ? await updateCompanyDocumentApi(doc.id, doc)
          : await createCompanyDocumentApi(doc);
        setCompanyDocuments((prev) => {
          const next = prev.some((d) => d.id === saved.id)
            ? prev.map((d) => (d.id === saved.id ? saved : d))
            : [saved, ...prev];
          StorageService.saveCompanyDocuments(next);
          return next;
        });
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(
          err instanceof Error ? err.message : 'Could not save company document to API.'
        );
      }
    })();
  };

  const handleDeleteCompanyDocument = (id: string) => {
    const updated = companyDocuments.filter((d) => d.id !== id);
    setCompanyDocuments(updated);
    StorageService.saveCompanyDocuments(updated);

    (async () => {
      try {
        await deleteCompanyDocumentApi(id);
        setMastersApiError('');
      } catch (err: unknown) {
        setMastersApiError(
          err instanceof Error ? err.message : 'Could not delete company document from API.'
        );
      }
    })();
  };

  if (authStatus === 'loading') {
    return (
      <div className="auth-loading-screen">
        <div className="auth-logo-mark flex h-14 w-14 items-center justify-center rounded-2xl text-white">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] text-base font-bold text-[var(--color-ink)]">
            <span className="text-[var(--color-copper)]">SHAKTI</span> Travels &amp; Tours
          </p>
          <p className="mt-1 text-sm">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  if (authStatus === 'guest') {
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onSuccess={applyAuthenticatedUser}
          onGoLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginPage
        onSuccess={applyAuthenticatedUser}
        onGoRegister={() => setAuthScreen('register')}
      />
    );
  }

  return (
    <div className="app-shell">
      {/* Top Navbar with Tab Navigation & Quick Indicators */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        reminders={reminders}
        totalVehicles={vehicles.length}
        activeTendersCount={tenders.filter((t) => t.status === 'active').length}
        pendingBillsAmount={pendingBillsAmount}
        currentUser={currentUser}
        staffUsers={staffUsers}
        onSwitchUser={handleSwitchUser}
        onLogout={handleLogout}
        serverAuthEnabled
        companyDocAlertsCount={companyDocAlertsCount}
        vehicleDocAlertsCount={vehicleDocAlertsCount}
        onOpenBulkImport={(type) => {
          setBulkImportInitialType(type || 'vehicles');
          setIsGlobalBulkImportOpen(true);
        }}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {(staffApiError || mastersApiError) && activeTab !== 'staff_management' && !isUnifiedProfileModalOpen && (
        <div className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-5">
          <div className="flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
            <span className="flex-1">{staffApiError || mastersApiError}</span>
            <button
              type="button"
              className="text-[10px] font-bold uppercase tracking-wide"
              onClick={() => {
                setStaffApiError('');
                setMastersApiError('');
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="app-main">
        {activeTab === 'dashboard' && (
          <DashboardView
            tenders={tenders}
            vehicles={vehicles}
            officers={officers}
            drivers={drivers}
            dailyLogs={dailyLogs}
            bills={bills}
            reminders={reminders}
            currentUser={currentUser}
            staffUsers={staffUsers}
            pettyCashTransactions={pettyCashTransactions}
            companyDocuments={companyDocuments}
            setActiveTab={setActiveTab}
            onOpenNewLogModal={() => {
              setActiveTab('logbook');
              setIsLogModalOpen(true);
            }}
            onOpenNewBillModal={() => {
              setActiveTab('billing');
              setIsBillModalOpen(true);
            }}
            onOpenAdvanceModal={() => {
              setActiveTab('drivers_khata');
              setIsAdvanceModalOpen(true);
            }}
            onOpenPaymentModal={() => {
              setActiveTab('daily_payments');
              setIsPaymentModalOpen(true);
            }}
            onOpenBulkImportModal={(type) => {
              setBulkImportInitialType(type || 'combined');
              setIsGlobalBulkImportOpen(true);
            }}
          />
        )}

        {activeTab === 'fleet_dispatch' && (
          <FleetDispatchProView
            erpVehicles={vehicles}
            erpDrivers={drivers}
            erpOfficers={officers}
            erpTenders={tenders}
          />
        )}

        {activeTab === 'our_vehicles' && (
          <OurVehiclesFleetView
            vehicles={vehicles}
            drivers={drivers}
            tenders={tenders}
            officers={officers}
            vendors={vendors}
            onSaveVehicle={handleSaveVehicle}
            onBulkImportVehicles={handleBulkImportVehicles}
            onBulkImportDrivers={handleBulkImportDrivers}
            onReplaceDriver={handleReplaceDriver}
          />
        )}

        {activeTab === 'company_documents' && (
          <CompanyDocumentsView
            documents={companyDocuments}
            onSaveDocument={handleSaveCompanyDocument}
            onDeleteDocument={handleDeleteCompanyDocument}
          />
        )}

        {activeTab === 'petty_cash' && (
          <PettyCashManagerView
            pettyCashTransactions={pettyCashTransactions}
            staffUsers={staffUsers}
            vehicles={vehicles}
            currentUser={currentUser}
            onAddTransaction={handleAddPettyCashTransaction}
            onUpdateTransaction={handleUpdatePettyCashTransaction}
          />
        )}

        {activeTab === 'daily_payments' && (
          <DailyPaymentsJournalView
            dailyPayments={dailyPayments}
            drivers={drivers}
            vehicles={vehicles}
            vendors={vendors}
            onAddPayment={handleAddDailyPayment}
            onAddBatchPayments={handleAddBatchDailyPayments}
            isAddModalOpen={isPaymentModalOpen}
            setIsAddModalOpen={setIsPaymentModalOpen}
          />
        )}

        {activeTab === 'attached_vendors' && (
          <VendorAttachedFleetView
            vendors={vendors}
            vehicles={vehicles}
            vendorSettlements={vendorSettlements}
            dailyLogs={dailyLogs}
            drivers={drivers}
            tenders={tenders}
            officers={officers}
            onSaveVendor={handleSaveVendor}
            onSaveVehicle={handleSaveVehicle}
            onSaveDriver={handleSaveDriver}
            onBulkImportVehicles={handleBulkImportVehicles}
            onBulkImportDrivers={handleBulkImportDrivers}
            onSaveSettlement={handleSaveSettlement}
            onPaySettlement={handlePaySettlement}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}

        {activeTab === 'statutory_payroll' && (
          <StatutoryLabourComplianceView
            statutoryPayroll={statutoryPayroll}
            drivers={drivers}
            vehicles={vehicles}
            tenders={tenders}
            onSavePayrollEntry={handleSavePayrollEntry}
            onEnrollDriver={handleEnrollDriver}
          />
        )}

        {activeTab === 'tenders' && (
          <TendersView
            tenders={tenders}
            vehicles={vehicles}
            officers={officers}
            drivers={drivers}
            dailyLogs={dailyLogs}
            fuelRecords={fuelRecords}
            maintenanceRecords={maintenanceRecords}
            bills={bills}
            khataTransactions={khataTransactions}
            driverLeaves={driverLeaves}
            dailyPayments={dailyPayments}
            vendors={vendors}
            allocationHistory={allocationHistory}
            vehicleAllocationHistory={vehicleAllocationHistory}
            officerAllocationHistory={officerAllocationHistory}
            currentUser={currentUser}
            onSaveTender={handleSaveTender}
            onSaveOfficer={handleSaveOfficer}
            onSaveVehicle={handleSaveVehicle}
            onSaveDriver={handleSaveDriver}
            onReplaceDriver={handleReplaceDriver}
            onReplaceVehicle={handleReplaceVehicle}
            onTransferOrRelieveOfficer={handleTransferOrRelieveOfficer}
            onReactivateIdleVehicle={handleReactivateIdleVehicle}
            onAddLog={handleAddLog}
            onAddFuelRecord={handleAddFuelRecord}
            onSaveBill={handleSaveBill}
            onAddDailyPayment={handleAddDailyPayment}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddDriverLeave={handleSaveDriverLeave}
            onDeleteDriverLeave={handleDeleteDriverLeave}
            onToggleLogVerified={handleToggleVerified}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}

        {activeTab === 'vehicles_officers' && (
          <VehiclesOfficersView
            vehicles={vehicles}
            officers={officers}
            drivers={drivers}
            tenders={tenders}
            vendors={vendors}
            allocationHistory={allocationHistory}
            vehicleAllocationHistory={vehicleAllocationHistory}
            officerAllocationHistory={officerAllocationHistory}
            khataTransactions={khataTransactions}
            driverLeaves={driverLeaves}
            dailyPayments={dailyPayments}
            currentUser={currentUser}
            onSaveVehicle={handleSaveVehicle}
            onSaveOfficer={handleSaveOfficer}
            onSaveDriver={handleSaveDriver}
            onSaveVendor={handleSaveVendor}
            onBulkImportVehicles={handleBulkImportVehicles}
            onBulkImportDrivers={handleBulkImportDrivers}
            onBulkImportOfficers={handleBulkImportOfficers}
            onReplaceDriver={handleReplaceDriver}
            onReplaceVehicle={handleReplaceVehicle}
            onTransferOrRelieveOfficer={handleTransferOrRelieveOfficer}
            onReactivateIdleVehicle={handleReactivateIdleVehicle}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onAddDailyPayment={handleAddDailyPayment}
            onAddDriverLeave={handleSaveDriverLeave}
            onDeleteDriverLeave={handleDeleteDriverLeave}
            onOpenProfileModal={handleOpenProfileModal}
          />
        )}

        {activeTab === 'logbook' && (
          <LogBookView
            dailyLogs={dailyLogs}
            vehicles={vehicles}
            drivers={drivers}
            officers={officers}
            tenders={tenders}
            onAddLog={handleAddLog}
            onToggleVerified={handleToggleVerified}
            isAddModalOpen={isLogModalOpen}
            setIsAddModalOpen={setIsLogModalOpen}
          />
        )}

        {activeTab === 'billing' && (
          <GovtBillingView
            bills={bills}
            tenders={tenders}
            vehicles={vehicles}
            officers={officers}
            dailyLogs={dailyLogs}
            onSaveBill={handleSaveBill}
            onUpdateBillStatus={handleUpdateBillStatus}
            isAddModalOpen={isBillModalOpen}
            setIsAddModalOpen={setIsBillModalOpen}
          />
        )}

        {activeTab === 'drivers_khata' && (
          <DriversKhataView
            drivers={drivers}
            vehicles={vehicles}
            khataTransactions={khataTransactions}
            dailyLogs={dailyLogs}
            tenders={tenders}
            vendors={vendors}
            onAddTransaction={handleAddTransaction}
            onSaveDriver={handleSaveDriver}
            onBulkImportDrivers={handleBulkImportDrivers}
            onOpenProfileModal={handleOpenProfileModal}
            isAdvanceModalOpen={isAdvanceModalOpen}
            setIsAdvanceModalOpen={setIsAdvanceModalOpen}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelManagerView
            fuelRecords={fuelRecords}
            vehicles={vehicles}
            drivers={drivers}
            fuelPumpVendors={fuelPumpVendors}
            fuelSlips={fuelSlips}
            fuelVendorBills={fuelVendorBills}
            currentUser={currentUser}
            onAddFuelRecord={handleAddFuelRecord}
            onSaveFuelSlip={handleSaveFuelSlip}
            onDeleteFuelSlip={handleDeleteFuelSlip}
            onSavePumpVendor={handleSavePumpVendor}
            onDeletePumpVendor={handleDeletePumpVendor}
            onSaveFuelVendorBill={handleSaveFuelVendorBill}
            onDeleteFuelVendorBill={handleDeleteFuelVendorBill}
            onPayFuelVendorBill={handlePayFuelVendorBill}
          />
        )}

        {activeTab === 'maintenance' && (
          <MaintenanceView
            maintenanceRecords={maintenanceRecords}
            vehicles={vehicles}
            onAddMaintenanceRecord={handleAddMaintenanceRecord}
          />
        )}

        {activeTab === 'staff_management' && (
          <div className="space-y-3">
            {(staffApiError || mastersApiError) && (
              <div className="rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">
                {staffApiError || mastersApiError}
              </div>
            )}
            {dashboardSummary && (
              <div className="rounded-xl border border-[var(--color-line)] bg-white px-4 py-3 text-xs text-[var(--color-muted)]">
                API staff directory: <strong className="text-[var(--color-ink)]">{dashboardSummary.staff.active}</strong> active
                {' · '}
                <strong className="text-[var(--color-ink)]">{dashboardSummary.staff.total}</strong> total
                {' · '}
                tenders <strong className="text-[var(--color-ink)]">{dashboardSummary.fleet.activeTenders}</strong>
                {' · '}phase {dashboardSummary.phase}
              </div>
            )}
            <StaffManagementView
              staffUsers={staffUsers}
              currentUser={currentUser}
              onSaveStaffUser={handleSaveStaffUser}
              onSwitchUser={handleSwitchUser}
            />
          </div>
        )}

        {activeTab === 'reminders' && (
          <RemindersCenterView
            reminders={reminders}
            bills={bills}
            tenders={tenders}
          />
        )}
      </main>

      {/* Global Bulk Excel Import Modal */}
      {isGlobalBulkImportOpen && (
        <BulkImportModal
          isOpen={isGlobalBulkImportOpen}
          onClose={() => setIsGlobalBulkImportOpen(false)}
          initialType={bulkImportInitialType}
          existingVehicles={vehicles}
          existingDrivers={drivers}
          existingOfficers={officers}
          tenders={tenders}
          vendors={vendors}
          onImportVehicles={handleBulkImportVehicles}
          onImportDrivers={handleBulkImportDrivers}
          onImportOfficers={handleBulkImportOfficers}
          onImportTenders={handleBulkImportTenders}
        />
      )}

      {/* Unified Profile Management Modal (Drivers, Vendors, Officers, Vehicles) */}
      {isUnifiedProfileModalOpen && (
        <UnifiedProfileModal
          isOpen={isUnifiedProfileModalOpen}
          onClose={() => {
            setIsUnifiedProfileModalOpen(false);
            setMastersApiError('');
          }}
          initialType={unifiedProfileModalConfig.type}
          initialId={unifiedProfileModalConfig.id}
          drivers={drivers}
          vendors={vendors}
          officers={officers}
          vehicles={vehicles}
          tenders={tenders}
          onSaveDriver={handleSaveDriver}
          onSaveVendor={handleSaveVendor}
          onSaveOfficer={handleSaveOfficer}
          onSaveVehicle={handleSaveVehicle}
          onDeleteDriver={handleDeleteDriver}
          onDeleteVendor={handleDeleteVendor}
          onDeleteOfficer={handleDeleteOfficer}
          apiError={mastersApiError}
          onClearApiError={() => setMastersApiError('')}
        />
      )}

      {/* Footer */}
      <footer className="app-footer print:hidden">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-2 sm:flex-row">
          <div>
            <span className="font-semibold text-white/80">Shakti Travels &amp; Tours</span>
            <span className="text-white/35"> · Govt fleet &amp; tender ERP</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/35">
            <span>GeM / PWD / NHAI ready</span>
            <span>·</span>
            <span>Local persistence active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
