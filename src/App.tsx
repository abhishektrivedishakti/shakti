/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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

import { StorageService } from './utils/storage';
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

export default function App() {
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

  const currentUser = useMemo(() => {
    return staffUsers.find((s) => s.id === currentUserId) || staffUsers[0];
  }, [staffUsers, currentUserId]);

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

  const handleDeleteDriver = (driverId: string) => {
    const updated = drivers.filter((d) => d.id !== driverId);
    setDrivers(updated);
    StorageService.saveDrivers(updated);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = vendors.filter((v) => v.id !== vendorId);
    setVendors(updated);
    StorageService.saveVendors(updated);
  };

  const handleDeleteOfficer = (officerId: string) => {
    const updated = officers.filter((o) => o.id !== officerId);
    setOfficers(updated);
    StorageService.saveOfficers(updated);
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
  const handleSaveTender = (tender: Tender) => {
    const exists = tenders.some((t) => t.id === tender.id);
    const updated = exists ? tenders.map((t) => (t.id === tender.id ? tender : t)) : [...tenders, tender];
    setTenders(updated);
    StorageService.saveTenders(updated);
  };

  const handleSaveVehicle = (vehicle: Vehicle) => {
    const exists = vehicles.some((v) => v.id === vehicle.id);
    const updated = exists ? vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)) : [...vehicles, vehicle];
    setVehicles(updated);
    StorageService.saveVehicles(updated);
  };

  const handleSaveOfficer = (officer: Officer) => {
    const code = officer.officerCode || (officer.id && officer.id.startsWith('OFF-') ? officer.id : generateOfficerUniqueId(officers));
    const finalOfficer: Officer = {
      ...officer,
      officerCode: code,
      id: officer.id || code,
    };
    const exists = officers.some((o) => o.id === finalOfficer.id);
    const updated = exists ? officers.map((o) => (o.id === finalOfficer.id ? finalOfficer : o)) : [...officers, finalOfficer];
    setOfficers(updated);
    StorageService.saveOfficers(updated);
  };

  const handleSaveDriver = (driver: Driver) => {
    const code = driver.driverCode || (driver.id && driver.id.startsWith('DRV-') ? driver.id : generateDriverUniqueId(drivers));
    const finalDriver: Driver = {
      ...driver,
      driverCode: code,
      id: driver.id || code,
    };
    const exists = drivers.some((d) => d.id === finalDriver.id);
    const updated = exists ? drivers.map((d) => (d.id === finalDriver.id ? finalDriver : d)) : [...drivers, finalDriver];
    setDrivers(updated);
    StorageService.saveDrivers(updated);
  };

  const handleBulkImportVehicles = (newVehicles: Vehicle[], newVendors?: Vendor[]) => {
    const updatedVehicles = [...newVehicles, ...vehicles];
    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);

    if (newVendors && newVendors.length > 0) {
      // Ensure any newly created vendor in vehicle import has authentic unique ID
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
  };

  const handleBulkImportTenders = (newTenders: Tender[]) => {
    const updatedTenders = [...newTenders, ...tenders];
    setTenders(updatedTenders);
    StorageService.saveTenders(updatedTenders);
  };

  // Driver replacement handler: "Kaun kab hata, kaun kab laga"
  const handleReplaceDriver = (
    vehicleId: string,
    newDriverId: string,
    reason: ReplacementReason,
    effectiveDate: string,
    notes: string
  ) => {
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) return;

    const oldDriverId = veh.currentDriverId;
    const oldDriver = drivers.find((d) => d.id === oldDriverId);
    const newDriver = drivers.find((d) => d.id === newDriverId);
    const tender = tenders.find((t) => t.id === veh.tenderId);
    const officer = officers.find((o) => o.id === veh.assignedOfficerId);

    // 1. Close current open history record for this vehicle if exists
    const updatedHistory = allocationHistory.map((h) => {
      if (h.vehicleId === vehicleId && !h.releasedDate) {
        return {
          ...h,
          releasedDate: effectiveDate,
        };
      }
      return h;
    });

    // 2. Add new allocation entry
    const newHistoryItem: DriverAllocationHistory = {
      id: `dah-${Date.now()}`,
      driverId: newDriverId,
      driverName: newDriver?.name || 'Driver',
      vehicleId: vehicleId,
      vehicleNumber: veh.vehicleNumber,
      tenderId: tender?.id || '',
      tenderName: tender?.departmentName || 'Govt Tender',
      officerId: officer?.id || '',
      officerName: officer?.name || 'Officer',
      assignedDate: effectiveDate,
      reasonForChange: reason,
      notes: notes || `Assigned to replace ${oldDriver?.name || 'previous driver'}`,
    };
    updatedHistory.unshift(newHistoryItem);

    // 3. Update Vehicle state
    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return {
          ...v,
          currentDriverId: newDriverId,
        };
      }
      return v;
    });

    // 4. Update Driver states
    const updatedDrivers = drivers.map((d) => {
      if (d.id === oldDriverId) {
        return { ...d, currentVehicleId: undefined };
      }
      if (d.id === newDriverId) {
        return { ...d, currentVehicleId: vehicleId };
      }
      return d;
    });

    // 5. Update Officer state if assigned
    const updatedOfficers = officers.map((o) => {
      if (o.assignedVehicleId === vehicleId) {
        return { ...o, currentDriverId: newDriverId };
      }
      return o;
    });

    setAllocationHistory(updatedHistory);
    StorageService.saveAllocationHistory(updatedHistory);

    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);

    setDrivers(updatedDrivers);
    StorageService.saveDrivers(updatedDrivers);

    setOfficers(updatedOfficers);
    StorageService.saveOfficers(updatedOfficers);
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
    const oldVeh = vehicles.find((v) => v.id === oldVehicleId);
    const tender = tenders.find((t) => t.id === (oldVeh?.tenderId || tenderId));
    const officer = officers.find(
      (o) => o.assignedVehicleId === oldVehicleId || (oldVeh && o.id === oldVeh.assignedOfficerId)
    );
    const driver = drivers.find((d) => d.id === oldVeh?.currentDriverId);

    // 1. Close current open vehicle allocation history record for this old vehicle
    const updatedHistory = vehicleAllocationHistory.map((h) => {
      if (h.vehicleId === oldVehicleId && !h.releasedDate) {
        return {
          ...h,
          releasedDate: effectiveDate,
          replacementVehicleNumber: newVehicleData.vehicleNumber,
          replacementVehicleModel: newVehicleData.makeModel,
        };
      }
      return h;
    });

    // 2. Identify or instantiate new vehicle
    let targetVehicleId: string = newVehicleData.id || `veh-${Date.now()}`;
    let targetVehicle = vehicles.find((v) => v.id === targetVehicleId);
    let updatedVehicles = [...vehicles];

    if (!targetVehicle) {
      targetVehicleId = `veh-${Date.now()}`;
      targetVehicle = {
        id: targetVehicleId,
        vehicleNumber: newVehicleData.vehicleNumber.toUpperCase().trim(),
        makeModel: newVehicleData.makeModel,
        vehicleType: newVehicleData.vehicleType || 'Sedan',
        fuelType: newVehicleData.fuelType || 'Diesel',
        color: 'White',
        modelYear: 2025,
        ownershipType: newVehicleData.ownershipType || 'Attached / Market Hire',
        vendorId: newVehicleData.vendorId,
        vendorName: newVehicleData.vendorName,
        monthlyVendorRent: newVehicleData.monthlyVendorRent,
        tenderId: tender?.id || tenderId,
        assignedOfficerId: transferDriverAndOfficer ? officer?.id : undefined,
        currentDriverId: transferDriverAndOfficer ? driver?.id : undefined,
        currentOdometer: 15000,
        rtoFitnessExpiry: '2028-03-31',
        insuranceExpiry: '2027-04-15',
        pucExpiry: '2026-12-31',
        roadTaxExpiry: '2028-12-31',
        permitExpiry: '2028-06-30',
        status: 'active',
        fuelPolicy: oldVeh?.fuelPolicy || 'actual_reimbursement',
        monthlyFixedFuelAmount: oldVeh?.monthlyFixedFuelAmount,
        documents: [],
      };
      updatedVehicles.push(targetVehicle);
    } else {
      updatedVehicles = updatedVehicles.map((v) => {
        if (v.id === targetVehicleId) {
          return {
            ...v,
            tenderId: tender?.id || tenderId,
            assignedOfficerId: transferDriverAndOfficer ? officer?.id : v.assignedOfficerId,
            currentDriverId: transferDriverAndOfficer ? driver?.id : v.currentDriverId,
            status: 'active' as const,
          };
        }
        return v;
      });
    }

    // 3. Mark old vehicle as released / idle
    if (oldVeh) {
      updatedVehicles = updatedVehicles.map((v) => {
        if (v.id === oldVeh.id) {
          return {
            ...v,
            assignedOfficerId: undefined,
            currentDriverId: undefined,
            status: 'idle' as const,
          };
        }
        return v;
      });
    }

    // 4. Update Officer if transferDriverAndOfficer is true
    let updatedOfficers = [...officers];
    if (officer && transferDriverAndOfficer) {
      updatedOfficers = updatedOfficers.map((o) => {
        if (o.id === officer.id) {
          return {
            ...o,
            assignedVehicleId: targetVehicleId,
          };
        }
        return o;
      });
      setOfficers(updatedOfficers);
      StorageService.saveOfficers(updatedOfficers);
    }

    // 5. Update Driver if transferDriverAndOfficer is true
    let updatedDrivers = [...drivers];
    if (driver && transferDriverAndOfficer) {
      updatedDrivers = updatedDrivers.map((d) => {
        if (d.id === driver.id) {
          return {
            ...d,
            currentVehicleId: targetVehicleId,
          };
        }
        return d;
      });
      setDrivers(updatedDrivers);
      StorageService.saveDrivers(updatedDrivers);
    }

    // 6. Add new history entry
    const newHistoryItem: VehicleAllocationHistory = {
      id: `vah-${Date.now()}`,
      tenderId: tender?.id || tenderId,
      tenderName: tender?.departmentName || 'Govt Tender',
      vehicleId: targetVehicleId,
      vehicleNumber: targetVehicle.vehicleNumber,
      makeModel: targetVehicle.makeModel,
      officerId: officer?.id,
      officerName: officer?.name,
      driverId: driver?.id,
      driverName: driver?.name,
      assignedDate: effectiveDate,
      replacementVehicleId: oldVeh?.id,
      replacementVehicleNumber: oldVeh?.vehicleNumber,
      replacementVehicleModel: oldVeh?.makeModel,
      reasonForChange: reason,
      notes: notes || `Replaced ${oldVeh?.vehicleNumber || 'previous vehicle'}`,
      ownershipType: targetVehicle.ownershipType,
    };
    updatedHistory.unshift(newHistoryItem);

    setVehicleAllocationHistory(updatedHistory);
    StorageService.saveVehicleAllocationHistory(updatedHistory);

    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);
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
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) return;

    const oldOfficer = officers.find(
      (o) => o.assignedVehicleId === vehicleId || (veh.assignedOfficerId && o.id === veh.assignedOfficerId)
    );
    const tender = tenders.find((t) => t.id === veh.tenderId);
    const currentDriver = drivers.find((d) => d.id === veh.currentDriverId);

    // 1. Close current open officer allocation record for this vehicle
    const updatedHistory = officerAllocationHistory.map((h) => {
      if (h.vehicleId === vehicleId && !h.relievedDate) {
        return {
          ...h,
          relievedDate: effectiveDate,
          replacementOfficerName: newOfficerData?.name,
          replacementOfficerDesignation: newOfficerData?.designation,
          transferOrderNumber: transferOrderNumber || h.transferOrderNumber,
        };
      }
      return h;
    });

    let updatedVehicles = [...vehicles];
    let updatedOfficers = [...officers];
    let updatedDrivers = [...drivers];

    // 2. Mark old officer as transferred / relieved
    if (oldOfficer) {
      updatedOfficers = updatedOfficers.map((o) => {
        if (o.id === oldOfficer.id) {
          return {
            ...o,
            assignedVehicleId: undefined,
            status: 'transferred' as const,
            transferDate: effectiveDate,
            transferOrderNumber: transferOrderNumber || o.transferOrderNumber,
            transferDestination: notes || 'Transferred / Relieved from charge',
          };
        }
        return o;
      });
    }

    // 3. Handle specific action
    if (action === 'halt_car_post_vacant' || action === 'surrender_vehicle' || action === 'move_to_pool') {
      const newStatus =
        action === 'halt_car_post_vacant'
          ? ('idle_officer_transferred' as const)
          : action === 'surrender_vehicle'
          ? ('surrendered_temporary' as const)
          : ('standby_pool' as const);

      const driverFreed = driverAction === 'free_to_pool';

      updatedVehicles = updatedVehicles.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            assignedOfficerId: undefined,
            currentDriverId: driverFreed ? undefined : v.currentDriverId,
            status: newStatus,
            idleSinceDate: effectiveDate,
            idleReason:
              notes ||
              (action === 'halt_car_post_vacant'
                ? 'अधिकारी का तबादला - नवीन तैनाती तक गाड़ी चलना बंद'
                : 'गाड़ी अस्थायी सरेंडर / स्टैंडबाय पूल में'),
            transferOrderRef: transferOrderNumber,
          };
        }
        return v;
      });

      if (driverFreed && currentDriver) {
        updatedDrivers = updatedDrivers.map((d) =>
          d.id === currentDriver.id ? { ...d, currentVehicleId: undefined } : d
        );
      }

      // Record in history
      const historyItem: OfficerAllocationHistory = {
        id: `oah-${Date.now()}`,
        tenderId: tender?.id || veh.tenderId,
        tenderName: tender?.departmentName || 'Govt Department',
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        officerId: oldOfficer?.id || 'off-vacant',
        officerName: oldOfficer?.name || 'Vacant Post',
        officerDesignation: oldOfficer?.designation || 'Transferred Officer',
        department: oldOfficer?.department || tender?.departmentName || '',
        assignedDate: oldOfficer ? '2026-01-01' : effectiveDate,
        relievedDate: effectiveDate,
        vehicleAction:
          action === 'halt_car_post_vacant'
            ? 'halted_idle_post_vacant'
            : action === 'surrender_vehicle'
            ? 'vehicle_surrendered'
            : 'transferred_to_pool',
        reason: reason,
        transferOrderNumber: transferOrderNumber,
        notes: notes || `अधिकारी तबादला उपरांत वाहन स्थिति: ${newStatus}`,
      };
      updatedHistory.unshift(historyItem);
    } else if (action === 'reassign_new_officer' && newOfficerData) {
      // Reassign directly to new officer
      let targetOfficerId: string = newOfficerData.id || `off-${Date.now()}`;
      let targetOfficer = officers.find((o) => o.id === targetOfficerId);

      if (!targetOfficer) {
        targetOfficer = {
          id: targetOfficerId,
          name: newOfficerData.name,
          designation: newOfficerData.designation,
          department: newOfficerData.department || tender?.departmentName || '',
          officeAddress: tender?.authorityOffice || '',
          mobile: newOfficerData.mobile,
          assignedVehicleId: vehicleId,
          tenderId: tender?.id || veh.tenderId,
          reportingTime: newOfficerData.reportingTime || '09:30 AM',
          status: 'active',
        };
        updatedOfficers.push(targetOfficer);
      } else {
        updatedOfficers = updatedOfficers.map((o) =>
          o.id === targetOfficerId
            ? { ...o, assignedVehicleId: vehicleId, status: 'active' as const }
            : o
        );
      }

      updatedVehicles = updatedVehicles.map((v) => {
        if (v.id === vehicleId) {
          return {
            ...v,
            assignedOfficerId: targetOfficerId,
            status: 'active' as const,
            idleSinceDate: undefined,
            idleReason: undefined,
          };
        }
        return v;
      });

      const historyItem: OfficerAllocationHistory = {
        id: `oah-${Date.now()}`,
        tenderId: tender?.id || veh.tenderId,
        tenderName: tender?.departmentName || 'Govt Department',
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        officerId: targetOfficerId,
        officerName: targetOfficer.name,
        officerDesignation: targetOfficer.designation,
        department: targetOfficer.department,
        assignedDate: effectiveDate,
        replacementOfficerId: oldOfficer?.id,
        replacementOfficerName: oldOfficer?.name,
        replacementOfficerDesignation: oldOfficer?.designation,
        vehicleAction: 'reassigned_to_new_officer',
        reason: reason,
        transferOrderNumber: transferOrderNumber,
        notes: notes || `पूर्व अधिकारी ${oldOfficer?.name || ''} के स्थान पर नवीन पदभार ग्रहण।`,
      };
      updatedHistory.unshift(historyItem);
    }

    setOfficerAllocationHistory(updatedHistory);
    StorageService.saveOfficerAllocationHistory(updatedHistory);

    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);

    setOfficers(updatedOfficers);
    StorageService.saveOfficers(updatedOfficers);

    setDrivers(updatedDrivers);
    StorageService.saveDrivers(updatedDrivers);
  };

  // Quick Resume Vehicle: Assigns incoming officer & reactivates halted vehicle
  const handleReactivateIdleVehicle = (
    vehicleId: string,
    officerIdOrNew: string | { name: string; designation: string; mobile: string; department?: string },
    effectiveDate: string,
    notes: string
  ) => {
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (!veh) return;
    const tender = tenders.find((t) => t.id === veh.tenderId);

    let assignedOffId = '';
    let assignedOffName = '';
    let assignedOffDesig = '';
    let updatedOfficers = [...officers];

    if (typeof officerIdOrNew === 'string') {
      assignedOffId = officerIdOrNew;
      const off = officers.find((o) => o.id === officerIdOrNew);
      assignedOffName = off?.name || 'Officer';
      assignedOffDesig = off?.designation || '';
      updatedOfficers = updatedOfficers.map((o) =>
        o.id === assignedOffId ? { ...o, assignedVehicleId: vehicleId, status: 'active' as const } : o
      );
    } else {
      assignedOffId = `off-${Date.now()}`;
      assignedOffName = officerIdOrNew.name;
      assignedOffDesig = officerIdOrNew.designation;
      const newOff: Officer = {
        id: assignedOffId,
        name: officerIdOrNew.name,
        designation: officerIdOrNew.designation,
        department: officerIdOrNew.department || tender?.departmentName || '',
        officeAddress: tender?.authorityOffice || '',
        mobile: officerIdOrNew.mobile,
        assignedVehicleId: vehicleId,
        tenderId: veh.tenderId,
        reportingTime: '09:30 AM',
        status: 'active',
      };
      updatedOfficers.push(newOff);
    }

    const updatedVehicles = vehicles.map((v) => {
      if (v.id === vehicleId) {
        return {
          ...v,
          assignedOfficerId: assignedOffId,
          status: 'active' as const,
          idleSinceDate: undefined,
          idleReason: undefined,
        };
      }
      return v;
    });

    const newHistoryItem: OfficerAllocationHistory = {
      id: `oah-${Date.now()}`,
      tenderId: tender?.id || veh.tenderId,
      tenderName: tender?.departmentName || 'Govt Department',
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      officerId: assignedOffId,
      officerName: assignedOffName,
      officerDesignation: assignedOffDesig,
      department: tender?.departmentName || '',
      assignedDate: effectiveDate,
      vehicleAction: 'reassigned_to_new_officer',
      reason: 'new_joining',
      notes: notes || 'नवीन अधिकारी तैनाती उपरांत वाहन पुनः सक्रिय किया गया।',
    };

    const updatedHistory = [newHistoryItem, ...officerAllocationHistory];
    setOfficerAllocationHistory(updatedHistory);
    StorageService.saveOfficerAllocationHistory(updatedHistory);

    setVehicles(updatedVehicles);
    StorageService.saveVehicles(updatedVehicles);

    setOfficers(updatedOfficers);
    StorageService.saveOfficers(updatedOfficers);
  };

  const handleAddLog = (entry: DailyLogEntry) => {
    const updated = [entry, ...dailyLogs];
    setDailyLogs(updated);
    StorageService.saveDailyLogs(updated);

    // Also update vehicle's current odometer if closingKm is higher
    const veh = vehicles.find((v) => v.id === entry.vehicleId);
    if (veh && entry.closingKm > veh.currentOdometer) {
      const updatedVehicles = vehicles.map((v) =>
        v.id === veh.id ? { ...v, currentOdometer: entry.closingKm } : v
      );
      setVehicles(updatedVehicles);
      StorageService.saveVehicles(updatedVehicles);
    }
  };

  const handleToggleVerified = (id: string) => {
    const updated = dailyLogs.map((l) =>
      l.id === id ? { ...l, isVerifiedByOfficer: !l.isVerifiedByOfficer } : l
    );
    setDailyLogs(updated);
    StorageService.saveDailyLogs(updated);
  };

  const handleSaveBill = (bill: MonthlyBill) => {
    const exists = bills.some((b) => b.id === bill.id);
    const updated = exists ? bills.map((b) => (b.id === bill.id ? bill : b)) : [bill, ...bills];
    setBills(updated);
    StorageService.saveBills(updated);
  };

  const handleUpdateBillStatus = (
    billId: string,
    status: PaymentStatus,
    remarks?: string,
    voucher?: string,
    newBillNumber?: string
  ) => {
    const updated = bills.map((b) => {
      if (b.id === billId) {
        return {
          ...b,
          billNumber: newBillNumber !== undefined && newBillNumber.trim() ? newBillNumber.trim() : b.billNumber,
          paymentStatus: status,
          paymentRemarks: remarks !== undefined ? remarks : b.paymentRemarks,
          voucherNumber: voucher !== undefined ? voucher : b.voucherNumber,
          paymentReceivedDate:
            status === 'paid' && !b.paymentReceivedDate
              ? new Date().toISOString().slice(0, 10)
              : b.paymentReceivedDate,
        };
      }
      return b;
    });
    setBills(updated);
    StorageService.saveBills(updated);
  };

  const handleAddFuelRecord = (record: FuelRecord) => {
    const updated = [record, ...fuelRecords];
    setFuelRecords(updated);
    StorageService.saveFuelRecords(updated);
  };

  const handleSaveFuelSlip = (slip: FuelSlip) => {
    const exists = fuelSlips.some((s) => s.id === slip.id);
    const updated = exists
      ? fuelSlips.map((s) => (s.id === slip.id ? slip : s))
      : [slip, ...fuelSlips];
    setFuelSlips(updated);
    StorageService.saveFuelSlips(updated);
  };

  const handleDeleteFuelSlip = (slipId: string) => {
    const updated = fuelSlips.filter((s) => s.id !== slipId);
    setFuelSlips(updated);
    StorageService.saveFuelSlips(updated);
  };

  const handleSavePumpVendor = (vendor: FuelPumpVendor) => {
    const exists = fuelPumpVendors.some((p) => p.id === vendor.id);
    const updated = exists
      ? fuelPumpVendors.map((p) => (p.id === vendor.id ? vendor : p))
      : [...fuelPumpVendors, vendor];
    setFuelPumpVendors(updated);
    StorageService.saveFuelPumpVendors(updated);
  };

  const handleDeletePumpVendor = (vendorId: string) => {
    const updated = fuelPumpVendors.filter((p) => p.id !== vendorId);
    setFuelPumpVendors(updated);
    StorageService.saveFuelPumpVendors(updated);
  };

  const handleSaveFuelVendorBill = (bill: FuelVendorMonthlyBill, linkedSlipIds: string[]) => {
    const exists = fuelVendorBills.some((b) => b.id === bill.id);
    const updatedBills = exists
      ? fuelVendorBills.map((b) => (b.id === bill.id ? bill : b))
      : [bill, ...fuelVendorBills];
    setFuelVendorBills(updatedBills);
    StorageService.saveFuelVendorBills(updatedBills);

    // Mark linked slips as 'billed'
    if (linkedSlipIds && linkedSlipIds.length > 0) {
      const updatedSlips = fuelSlips.map((s) =>
        linkedSlipIds.includes(s.id)
          ? { ...s, status: 'billed' as const, vendorBillId: bill.id, vendorBillNumber: bill.billNumber }
          : s
      );
      setFuelSlips(updatedSlips);
      StorageService.saveFuelSlips(updatedSlips);
    }
  };

  const handleDeleteFuelVendorBill = (billId: string) => {
    const updated = fuelVendorBills.filter((b) => b.id !== billId);
    setFuelVendorBills(updated);
    StorageService.saveFuelVendorBills(updated);
  };

  const handlePayFuelVendorBill = (
    billId: string,
    paymentData: { mode: 'bank_transfer' | 'cheque' | 'upi' | 'cash'; ref: string; date: string; amount: number }
  ) => {
    const bill = fuelVendorBills.find((b) => b.id === billId);
    if (!bill) return;

    const updatedBill: FuelVendorMonthlyBill = {
      ...bill,
      paymentStatus: 'paid',
      paidAmount: paymentData.amount,
      paidDate: paymentData.date,
      paymentMode: paymentData.mode,
      paymentReference: paymentData.ref,
    };
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
    handleAddDailyPayment(paymentEntry);
  };

  const handleAddMaintenanceRecord = (record: MaintenanceRecord) => {
    const updated = [record, ...maintenanceRecords];
    setMaintenanceRecords(updated);
    StorageService.saveMaintenanceRecords(updated);
  };

  const handleAddTransaction = (tx: DriverKhataTransaction) => {
    const updated = [tx, ...khataTransactions];
    setKhataTransactions(updated);
    StorageService.saveKhataTransactions(updated);
  };

  const handleDeleteTransaction = (txId: string) => {
    const updated = khataTransactions.filter((t) => t.id !== txId);
    setKhataTransactions(updated);
    StorageService.saveKhataTransactions(updated);
  };

  const handleSaveDriverLeave = (leave: DriverLeaveRecord) => {
    const exists = driverLeaves.some((l) => l.id === leave.id);
    const updated = exists ? driverLeaves.map((l) => (l.id === leave.id ? leave : l)) : [leave, ...driverLeaves];
    setDriverLeaves(updated);
    StorageService.saveDriverLeaves(updated);
  };

  const handleDeleteDriverLeave = (leaveId: string) => {
    const updated = driverLeaves.filter((l) => l.id !== leaveId);
    setDriverLeaves(updated);
    StorageService.saveDriverLeaves(updated);
  };

  const handleSaveVendor = (vendor: Vendor) => {
    const code = vendor.vendorCode || (vendor.id && (vendor.id.startsWith('VND-') || vendor.id.startsWith('vnd-')) ? vendor.id.toUpperCase() : generateVendorUniqueId(vendors, vendor.vendorType));
    const finalVendor: Vendor = {
      ...vendor,
      vendorCode: code,
      id: vendor.id || code,
    };
    const exists = vendors.some((v) => v.id === finalVendor.id);
    const updated = exists ? vendors.map((v) => (v.id === finalVendor.id ? finalVendor : v)) : [...vendors, finalVendor];
    setVendors(updated);
    StorageService.saveVendors(updated);
  };

  const handleSaveSettlement = (settlement: VendorSettlement) => {
    const exists = vendorSettlements.some((s) => s.id === settlement.id);
    const updated = exists
      ? vendorSettlements.map((s) => (s.id === settlement.id ? settlement : s))
      : [settlement, ...vendorSettlements];
    setVendorSettlements(updated);
    StorageService.saveVendorSettlements(updated);
  };

  const handlePaySettlement = (settlementId: string, paymentRef: string) => {
    const updated = vendorSettlements.map((s) => {
      if (s.id === settlementId) {
        return {
          ...s,
          paymentStatus: 'paid' as const,
          paymentDate: new Date().toISOString().slice(0, 10),
          paymentRef,
        };
      }
      return s;
    });
    setVendorSettlements(updated);
    StorageService.saveVendorSettlements(updated);
  };

  const handleAddDailyPayment = (payment: DailyPaymentEntry) => {
    const updatedPayments = [payment, ...dailyPayments];
    setDailyPayments(updatedPayments);
    StorageService.saveDailyPayments(updatedPayments);

    // AUTO-ROUTING LOGIC
    if (payment.category === 'driver_advance' && payment.driverId) {
      const drv = drivers.find((d) => d.id === payment.driverId);
      const newTx: DriverKhataTransaction = {
        id: `dkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        driverId: payment.driverId,
        driverName: drv?.name || payment.payeeName,
        date: payment.date,
        type: 'advance',
        amount: payment.amount,
        description: payment.description || `Daily advance via ${payment.paymentMode.toUpperCase()}`,
        paymentMode: payment.paymentMode === 'cheque' ? 'bank_transfer' : payment.paymentMode,
        referenceNumber: payment.referenceNumber,
      };
      handleAddTransaction(newTx);
    } else if (payment.category === 'driver_salary' && payment.driverId) {
      const drv = drivers.find((d) => d.id === payment.driverId);
      const newTx: DriverKhataTransaction = {
        id: `dkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        driverId: payment.driverId,
        driverName: drv?.name || payment.payeeName,
        date: payment.date,
        type: 'salary_payment',
        amount: payment.amount,
        description: payment.description || `Salary payment via ${payment.paymentMode.toUpperCase()}`,
        paymentMode: payment.paymentMode === 'cheque' ? 'bank_transfer' : payment.paymentMode,
        referenceNumber: payment.referenceNumber,
      };
      handleAddTransaction(newTx);
    } else if (payment.category === 'fastag_toll' && payment.driverId) {
      const drv = drivers.find((d) => d.id === payment.driverId);
      const newTx: DriverKhataTransaction = {
        id: `dkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        driverId: payment.driverId,
        driverName: drv?.name || payment.payeeName,
        date: payment.date,
        type: 'fastag_topup',
        amount: payment.amount,
        description: payment.description || `FASTag recharge for ${payment.vehicleNumber || 'Vehicle'}`,
        paymentMode: payment.paymentMode === 'cheque' ? 'bank_transfer' : payment.paymentMode,
        referenceNumber: payment.referenceNumber,
      };
      handleAddTransaction(newTx);
    } else if (payment.category === 'fuel' && payment.vehicleId) {
      const veh = vehicles.find((v) => v.id === payment.vehicleId);
      const drv = drivers.find((d) => d.id === (payment.driverId || veh?.currentDriverId));
      const newFuel: FuelRecord = {
        id: `fuel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: payment.date,
        vehicleId: payment.vehicleId,
        vehicleNumber: payment.vehicleNumber || veh?.vehicleNumber || '',
        driverId: drv?.id || 'd-generic',
        driverName: drv?.name || payment.payeeName || 'Driver',
        mode: 'slip',
        liters: Math.max(1, Math.round(payment.amount / 92)),
        ratePerLiter: 92,
        totalAmount: payment.amount,
        odometerKm: veh?.currentOdometer || 50000,
        fuelType: (veh?.fuelType as any) || 'Diesel',
        fuelStation: payment.payeeName || 'Authorized Fuel Station',
        receiptNumber: payment.referenceNumber || `RCP-${Date.now().toString().slice(-5)}`,
        fullTank: false,
        notes: payment.description || 'Auto-created from Daily Payments Journal',
      };
      handleAddFuelRecord(newFuel);
    } else if (payment.category === 'maintenance' && payment.vehicleId) {
      const veh = vehicles.find((v) => v.id === payment.vehicleId);
      const newMaint: MaintenanceRecord = {
        id: `maint-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: payment.date,
        vehicleId: payment.vehicleId,
        vehicleNumber: payment.vehicleNumber || veh?.vehicleNumber || '',
        serviceType: 'other',
        odometerKm: veh?.currentOdometer || 50000,
        garageName: payment.payeeName || 'Authorized Workshop',
        cost: payment.amount,
        description: payment.description || 'Maintenance repair expense',
        invoiceNumber: payment.referenceNumber || `INV-${Date.now().toString().slice(-4)}`,
      };
      handleAddMaintenanceRecord(newMaint);
    } else if (payment.category === 'vendor_rent' && payment.vendorId) {
      const pendingSettlement = vendorSettlements.find(
        (s) => s.vendorId === payment.vendorId && s.paymentStatus !== 'paid'
      );
      if (pendingSettlement) {
        handlePaySettlement(
          pendingSettlement.id,
          payment.referenceNumber || `VND-TRF-${Date.now().toString().slice(-4)}`
        );
      }
    }
  };

  const handleAddBatchDailyPayments = (payments: DailyPaymentEntry[]) => {
    payments.forEach((p) => handleAddDailyPayment(p));
  };

  const handleSavePayrollEntry = (entry: StatutoryPayrollEntry) => {
    const exists = statutoryPayroll.some((p) => p.id === entry.id);
    const updated = exists
      ? statutoryPayroll.map((p) => (p.id === entry.id ? entry : p))
      : [entry, ...statutoryPayroll];
    setStatutoryPayroll(updated);
    StorageService.saveStatutoryPayroll(updated);
  };

  const handleEnrollDriver = (
    driverId: string,
    uan: string,
    esicIp: string,
    basic: number,
    vda: number,
    hra: number
  ) => {
    const updatedDrivers = drivers.map((d) => {
      if (d.id === driverId) {
        return {
          ...d,
          uanNumber: uan,
          esicIpNumber: esicIp,
          basicSalary: basic,
          vdaAllowance: vda,
          hraAllowance: hra,
          isEpfApplicable: true,
          isEsicApplicable: true,
          isStatutoryMinimumWageCompliant: true,
        };
      }
      return d;
    });
    setDrivers(updatedDrivers);
    StorageService.saveDrivers(updatedDrivers);
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

  const handleSaveStaffUser = (user: StaffUser) => {
    const exists = staffUsers.some((s) => s.id === user.id);
    const updated = exists ? staffUsers.map((s) => (s.id === user.id ? user : s)) : [...staffUsers, user];
    setStaffUsers(updated);
    StorageService.saveStaffUsers(updated);
  };

  // Petty Cash & Field Expenses handlers (लड़के का पेटी कैश व दैनिक खर्च)
  const handleAddPettyCashTransaction = (txn: PettyCashTransaction) => {
    const updated = [txn, ...pettyCashTransactions];
    setPettyCashTransactions(updated);
    StorageService.savePettyCashTransactions(updated);

    // Cross-module auto integration:
    // 1. If cash inflow (Admin gives boy cash float), record in Daily Payments Journal as an outflow entry
    if (txn.type === 'cash_inflow') {
      const paymentEntry: DailyPaymentEntry = {
        id: `dp-pc-${Date.now()}`,
        date: txn.date,
        category: 'emergency_expense',
        amount: txn.amount,
        paymentMode: txn.paymentMode === 'UPI / PhonePe' ? 'upi' : txn.paymentMode === 'Card' ? 'bank_transfer' : 'cash',
        payeeName: txn.staffUserName,
        payeeType: 'other',
        description: `पेटी कैश अग्रिम (Cash Float to ${txn.staffUserName}) - ${txn.notes}`,
        autoRoutedTo: 'Petty Cash / Float',
        recordedBy: currentUser.name,
      };
      const updatedPayments = [paymentEntry, ...dailyPayments];
      setDailyPayments(updatedPayments);
      StorageService.saveDailyPayments(updatedPayments);
    }

    // 2. If fuel expense with vehicle, also log in Fuel Records
    if (txn.type === 'cash_expense' && txn.category === 'fuel_emergency' && txn.vehicleId && txn.vehicleNumber) {
      const veh = vehicles.find((v) => v.id === txn.vehicleId);
      const driver = drivers.find((d) => d.id === veh?.currentDriverId) || drivers[0];
      const approxLiters = Math.max(1, Math.round((txn.amount / 92) * 10) / 10);
      const fuelRec: FuelRecord = {
        id: `fuel-pc-${Date.now()}`,
        date: txn.date,
        vehicleId: txn.vehicleId,
        vehicleNumber: txn.vehicleNumber,
        driverId: driver ? driver.id : 'dr-gen',
        driverName: driver ? driver.name : txn.staffUserName,
        mode: 'slip',
        liters: approxLiters,
        ratePerLiter: 92,
        totalAmount: txn.amount,
        odometerKm: veh?.currentOdometer || 0,
        fuelType: (veh?.fuelType as any) || 'Diesel',
        fuelStation: txn.payeeOrVendor || 'स्थानीय पेट्रोल पंप (नकद)',
        receiptNumber: txn.billSlipNumber || `PC-SLIP-${Math.floor(100 + Math.random() * 900)}`,
        fullTank: false,
        notes: `[पेटी कैश खर्च द्वारा: ${txn.staffUserName}] ${txn.notes}`,
        recordedBy: txn.staffUserName,
      };
      const updatedFuel = [fuelRec, ...fuelRecords];
      setFuelRecords(updatedFuel);
      StorageService.saveFuelRecords(updatedFuel);
    }

    // 3. If servicing or accessories with vehicle, also log in Maintenance Records
    if (
      txn.type === 'cash_expense' &&
      (txn.category === 'servicing_puncture' || txn.category === 'vehicle_accessories') &&
      txn.vehicleId &&
      txn.vehicleNumber
    ) {
      const veh = vehicles.find((v) => v.id === txn.vehicleId);
      const maintRec: MaintenanceRecord = {
        id: `maint-pc-${Date.now()}`,
        date: txn.date,
        vehicleId: txn.vehicleId,
        vehicleNumber: txn.vehicleNumber,
        serviceType: txn.category === 'servicing_puncture' ? 'scheduled' : 'other',
        odometerKm: veh?.currentOdometer || 0,
        garageName: txn.payeeOrVendor || 'स्थानीय वर्कशॉप / एक्सेसरीज दुकान',
        cost: txn.amount,
        partsReplaced: txn.category === 'vehicle_accessories' ? txn.notes : 'पंचर / आयल / त्वरित रिपेयर',
        description: `[पेटी कैश खर्च द्वारा: ${txn.staffUserName}] ${txn.notes}`,
        invoiceNumber: txn.billSlipNumber,
        recordedBy: txn.staffUserName,
      };
      const updatedMaint = [maintRec, ...maintenanceRecords];
      setMaintenanceRecords(updatedMaint);
      StorageService.saveMaintenanceRecords(updatedMaint);
    }
  };

  const handleUpdatePettyCashTransaction = (txn: PettyCashTransaction) => {
    const updated = pettyCashTransactions.map((t) => (t.id === txn.id ? txn : t));
    setPettyCashTransactions(updated);
    StorageService.savePettyCashTransactions(updated);
  };

  const handleSaveCompanyDocument = (doc: CompanyDocument) => {
    const exists = companyDocuments.some((d) => d.id === doc.id);
    const updated = exists ? companyDocuments.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...companyDocuments];
    setCompanyDocuments(updated);
    StorageService.saveCompanyDocuments(updated);
  };

  const handleDeleteCompanyDocument = (id: string) => {
    const updated = companyDocuments.filter((d) => d.id !== id);
    setCompanyDocuments(updated);
    StorageService.saveCompanyDocuments(updated);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
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
        companyDocAlertsCount={companyDocAlertsCount}
        vehicleDocAlertsCount={vehicleDocAlertsCount}
        onOpenBulkImport={(type) => {
          setBulkImportInitialType(type || 'vehicles');
          setIsGlobalBulkImportOpen(true);
        }}
        onOpenProfileModal={handleOpenProfileModal}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <StaffManagementView
            staffUsers={staffUsers}
            currentUser={currentUser}
            onSaveStaffUser={handleSaveStaffUser}
            onSwitchUser={handleSwitchUser}
          />
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
          onClose={() => setIsUnifiedProfileModalOpen(false)}
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
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-200">Sarkari Fleet &amp; Tender ERP</span> &bull; सरकारी कार्यालय मासिक टैक्सी टेंडर प्रबंधक
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>Compliant with GeM / PWD / NHAI Guidelines</span>
            <span>&bull;</span>
            <span>Auto LocalStorage Persistence Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
