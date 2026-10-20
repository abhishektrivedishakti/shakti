import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Building2,
  Car,
  UserCheck,
  Users,
  FileText,
  Clock,
  Plus,
  ArrowRightLeft,
  Fuel,
  Receipt,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  Shield,
  IndianRupee,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Edit2,
} from 'lucide-react';
import {
  Tender,
  Vehicle,
  Officer,
  Driver,
  DailyLogEntry,
  FuelRecord,
  MaintenanceRecord,
  MonthlyBill,
  DriverKhataTransaction,
  Vendor,
  DriverAllocationHistory,
  VehicleAllocationHistory,
  OfficerAllocationHistory,
  ReplacementReason,
  VehicleReplacementReason,
  OfficerTransferReason,
  DailyPaymentEntry,
  DriverLeaveRecord,
  StaffUser,
} from '../types';
import { formatCurrency, formatDate, getAssignedDriverForVehicle } from '../utils/calculations';
import { DriverHisabAndLeaveModal } from './DriverHisabAndLeaveModal';

const actionFieldClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm';
const actionSelectClass =
  'w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-xs font-medium text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm';
const actionLabelClass = 'mb-1 block font-semibold text-[var(--color-ink)]';

const ActionModalShell: React.FC<{
  title: string;
  subtitle?: string;
  kickerIcon?: React.ReactNode;
  kickerLabel?: string;
  onClose: () => void;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}> = ({
  title,
  subtitle,
  kickerIcon,
  kickerLabel,
  onClose,
  maxWidthClass = 'max-w-md',
  children,
  footer,
}) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4">
    <div
      className={`flex max-h-[92vh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-4 text-white sm:px-5">
        <div className="min-w-0">
          {(kickerIcon || kickerLabel) && (
            <div className="mb-1 flex items-center gap-2">
              <span className="page-kicker !text-teal-300">
                {kickerIcon}
                {kickerLabel}
              </span>
            </div>
          )}
          <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
            {title}
          </h3>
          {subtitle && <p className="mt-1 text-[11px] text-white/65">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-sand)]/50 p-4 text-xs sm:p-5">
        {children}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-line)] pt-3">
          {footer}
        </div>
      </div>
    </div>
  </div>
);

interface TenderDetailHubModalProps {
  tender: Tender;
  vehicles: Vehicle[];
  officers: Officer[];
  drivers: Driver[];
  dailyLogs: DailyLogEntry[];
  fuelRecords: FuelRecord[];
  maintenanceRecords: MaintenanceRecord[];
  bills: MonthlyBill[];
  khataTransactions: DriverKhataTransaction[];
  vendors: Vendor[];
  allocationHistory: DriverAllocationHistory[];
  vehicleAllocationHistory: VehicleAllocationHistory[];
  officerAllocationHistory?: OfficerAllocationHistory[];
  onClose: () => void;
  onSaveOfficer: (officer: Officer) => void;
  onSaveVehicle: (vehicle: Vehicle) => void;
  onSaveDriver: (driver: Driver) => void;
  onReplaceDriver: (
    vehicleId: string,
    newDriverId: string,
    reason: ReplacementReason,
    effectiveDate: string,
    notes: string
  ) => void;
  onReplaceVehicle: (
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
    transferDriverAndOfficer?: boolean
  ) => void;
  onTransferOrRelieveOfficer?: (
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
    driverAction?: 'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave'
  ) => void;
  onReactivateIdleVehicle?: (
    vehicleId: string,
    officerIdOrNew: string | { name: string; designation: string; mobile: string; department?: string },
    effectiveDate: string,
    notes: string
  ) => void;
  onAddLog: (entry: DailyLogEntry) => void;
  onAddFuelRecord: (record: FuelRecord) => void;
  onSaveBill: (bill: MonthlyBill) => void;
  onAddDailyPayment: (entry: DailyPaymentEntry) => void;
  onToggleLogVerified: (id: string) => void;
  driverLeaves?: DriverLeaveRecord[];
  dailyPayments?: DailyPaymentEntry[];
  currentUser?: StaffUser;
  onAddTransaction?: (tx: DriverKhataTransaction) => void;
  onDeleteTransaction?: (txId: string) => void;
  onAddDriverLeave?: (leave: DriverLeaveRecord) => void;
  onDeleteDriverLeave?: (leaveId: string) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

export const TenderDetailHubModal: React.FC<TenderDetailHubModalProps> = ({
  tender,
  vehicles,
  officers,
  drivers,
  dailyLogs,
  fuelRecords,
  maintenanceRecords,
  bills,
  khataTransactions = [],
  vendors,
  allocationHistory,
  vehicleAllocationHistory,
  officerAllocationHistory = [],
  driverLeaves = [],
  dailyPayments = [],
  currentUser,
  onClose,
  onSaveOfficer,
  onSaveVehicle,
  onSaveDriver,
  onReplaceDriver,
  onReplaceVehicle,
  onTransferOrRelieveOfficer = () => {},
  onReactivateIdleVehicle = () => {},
  onAddLog,
  onAddFuelRecord,
  onSaveBill,
  onAddDailyPayment,
  onToggleLogVerified,
  onAddTransaction = () => {},
  onDeleteTransaction = () => {},
  onAddDriverLeave = () => {},
  onDeleteDriverLeave = () => {},
  onOpenProfileModal,
}) => {
  type HubTab =
    | 'roster'
    | 'drivers'
    | 'driver_hisab'
    | 'officer_transfers'
    | 'vehicle_replacement'
    | 'driver_replacement'
    | 'logs'
    | 'fuel'
    | 'billing'
    | 'officers'
    | 'terms';
  const [activeTab, setActiveTab] = useState<HubTab>('roster');
  const hubTabsRef = useRef<HTMLDivElement>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);

  const updateHubTabsScroll = useCallback(() => {
    const el = hubTabsRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollTabsLeft(el.scrollLeft > 4);
    setCanScrollTabsRight(max > 4 && el.scrollLeft < max - 4);
  }, []);

  const scrollHubTabs = (dir: 'left' | 'right') => {
    hubTabsRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  // Unified In-Place Driver Hisab & Leave Modal State
  const [hisabModalConfig, setHisabModalConfig] = useState<{
    isOpen: boolean;
    initialTab: 'payments' | 'leaves' | 'monthly_hisab';
    vehicleId?: string;
    officerId?: string;
    driverId?: string;
  } | null>(null);

  // Filter entities belonging to this tender
  const tenderVehicles = vehicles.filter((v) => v.tenderId === tender.id);
  const tenderOfficers = officers.filter((o) => o.tenderId === tender.id);
  const tenderVehicleIds = new Set(tenderVehicles.map((v) => v.id));

  useEffect(() => {
    const el = hubTabsRef.current;
    if (!el) return;
    updateHubTabsScroll();
    const onScroll = () => updateHubTabsScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHubTabsScroll) : null;
    ro?.observe(el);
    window.addEventListener('resize', updateHubTabsScroll);
    const t = window.setTimeout(updateHubTabsScroll, 100);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro?.disconnect();
      window.removeEventListener('resize', updateHubTabsScroll);
      window.clearTimeout(t);
    };
  }, [updateHubTabsScroll, activeTab, tenderVehicles.length]);

  // Robust Tender Drivers resolution using getAssignedDriverForVehicle
  const tenderDrivers = tenderVehicles
    .map((v) => getAssignedDriverForVehicle(v, drivers, officers))
    .filter((d): d is Driver => !!d);
  const tenderDriverIds = new Set(tenderDrivers.map((d) => d.id));

  // Quick Inline Driver Assignment for Tender Vehicles
  const handleQuickAssignDriver = (vehicleId: string, driverId: string) => {
    const targetVeh = vehicles.find((v) => v.id === vehicleId);
    const targetDrv = drivers.find((d) => d.id === driverId);
    if (!targetVeh || !targetDrv) return;

    const updatedVeh: Vehicle = {
      ...targetVeh,
      currentDriverId: targetDrv.id,
    };
    const updatedDrv: Driver = {
      ...targetDrv,
      currentVehicleId: targetVeh.id,
      status: 'active',
    };

    onSaveVehicle(updatedVeh);
    onSaveDriver(updatedDrv);
  };

  // Auto-link unassigned vehicles in tender with available standby drivers
  const handleAutoAssignDriversForTender = () => {
    const unassignedVehicles = tenderVehicles.filter(
      (v) => !getAssignedDriverForVehicle(v, drivers, officers)
    );

    if (unassignedVehicles.length === 0) {
      alert('इस टेंडर की सभी गाड़ियों में पहले से ही ड्राइवर नियुक्त हैं!');
      return;
    }

    const busyDriverIds = new Set(
      vehicles.map((v) => v.currentDriverId).filter(Boolean)
    );
    const availableDrivers = drivers.filter(
      (d) => !busyDriverIds.has(d.id) && d.status !== 'released'
    );

    if (availableDrivers.length === 0) {
      alert('कोई भी खाली/स्टैंडबाय ड्राइवर उपलब्ध नहीं है। कृपया पहले नया ड्राइवर जोड़ें।');
      return;
    }

    let assignedCount = 0;
    unassignedVehicles.forEach((veh, idx) => {
      if (idx < availableDrivers.length) {
        const drv = availableDrivers[idx];
        const updatedVeh: Vehicle = {
          ...veh,
          currentDriverId: drv.id,
        };
        const updatedDrv: Driver = {
          ...drv,
          currentVehicleId: veh.id,
          status: 'active',
        };
        onSaveVehicle(updatedVeh);
        onSaveDriver(updatedDrv);
        assignedCount++;
      }
    });

    alert(`सफलतापूर्वक ${assignedCount} गाड़ियों में ड्राइवर लिंक कर दिए गए!`);
  };

  const tenderLogs = dailyLogs.filter(
    (l) => l.tenderId === tender.id || tenderVehicleIds.has(l.vehicleId)
  );
  const tenderBills = bills.filter((b) => b.tenderId === tender.id);
  const tenderFuel = fuelRecords.filter((f) => tenderVehicleIds.has(f.vehicleId));
  const tenderVehicleHistory = vehicleAllocationHistory.filter(
    (vh) => vh.tenderId === tender.id || tenderVehicleIds.has(vh.vehicleId)
  );
  const tenderDriverHistory = allocationHistory.filter(
    (dh) => dh.tenderId === tender.id || tenderVehicleIds.has(dh.vehicleId)
  );
  const tenderOfficerHistory = officerAllocationHistory.filter(
    (oh) => oh.tenderId === tender.id || tenderVehicleIds.has(oh.vehicleId)
  );

  // Modals for Actions triggered inside Tender
  type ActionModalType =
    | null
    | 'add_officer'
    | 'add_vehicle'
    | 'add_driver'
    | 'replace_vehicle'
    | 'replace_driver'
    | 'transfer_officer'
    | 'reactivate_vehicle'
    | 'add_log'
    | 'add_fuel'
    | 'add_bill'
    | 'add_payment';

  const [activeActionModal, setActiveActionModal] = useState<ActionModalType>(null);
  const [selectedVehicleForAction, setSelectedVehicleForAction] = useState<Vehicle | null>(null);

  // Officer Transfer & Vehicle Halt State: "Adhikari change ya transfer ho gaya to gadi band/reassign"
  const [transferVehId, setTransferVehId] = useState<string>(tenderVehicles[0]?.id || '');
  const [transferAction, setTransferAction] = useState<'halt_car_post_vacant' | 'reassign_new_officer' | 'surrender_vehicle' | 'move_to_pool'>('halt_car_post_vacant');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [transferReason, setTransferReason] = useState<OfficerTransferReason>('post_vacant_car_stopped');
  const [transferOrderNo, setTransferOrderNo] = useState<string>(`PWD/GO/2026/TRF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferDriverAction, setTransferDriverAction] = useState<'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave'>('keep_on_vehicle');

  // New Officer details (if transferAction === 'reassign_new_officer')
  const [newOfficerSource, setNewOfficerSource] = useState<'existing' | 'new'>('new');
  const [selectedExistingOfficerId, setSelectedExistingOfficerId] = useState<string>('');
  const [newOffName, setNewOffName] = useState<string>('');
  const [newOffDesignation, setNewOffDesignation] = useState<string>('');
  const [newOffMobile, setNewOffMobile] = useState<string>('');
  const [newOffDept, setNewOffDept] = useState<string>(tender.departmentName);

  // Reactivate Idle Vehicle state
  const [reactivateVehId, setReactivateVehId] = useState<string>('');
  const [reactivateOfficerSource, setReactivateOfficerSource] = useState<'existing' | 'new'>('new');
  const [reactivateExistingOffId, setReactivateExistingOffId] = useState<string>('');
  const [reactivateOffName, setReactivateOffName] = useState<string>('');
  const [reactivateOffDesig, setReactivateOffDesig] = useState<string>('');
  const [reactivateOffMobile, setReactivateOffMobile] = useState<string>('');
  const [reactivateDate, setReactivateDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reactivateNotes, setReactivateNotes] = useState<string>('नवीन अधिकारी कार्यभार ग्रहण - वाहन पुनः ड्यूटी पर प्रारंभ');

  // Form states
  const [officerForm, setOfficerForm] = useState<Partial<Officer>>({
    id: '',
    name: '',
    designation: '',
    department: tender.departmentName,
    officeAddress: tender.authorityOffice,
    mobile: '',
    reportingTime: '09:30 AM',
    tenderId: tender.id,
  });

  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({
    id: '',
    vehicleNumber: '',
    makeModel: 'Maruti Suzuki Dzire',
    vehicleType: 'Sedan',
    fuelType: 'Diesel',
    color: 'White',
    modelYear: 2025,
    ownershipType: 'Company Owned',
    currentOdometer: 10000,
    rtoFitnessExpiry: '2028-12-31',
    insuranceExpiry: '2027-12-31',
    pucExpiry: '2026-12-31',
    roadTaxExpiry: '2028-12-31',
    permitExpiry: '2028-12-31',
    status: 'active',
    fuelPolicy: 'actual_reimbursement',
    tenderId: tender.id,
  });

  const [driverForm, setDriverForm] = useState<Partial<Driver>>({
    id: '',
    name: '',
    phone: '',
    address: 'Lucknow, UP',
    licenseNumber: '',
    licenseExpiry: '2029-12-31',
    policeVerificationDate: '2026-01-15',
    policeVerificationExpiry: '2027-01-14',
    aadharNumber: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    monthlySalary: 16500,
    dailyDaRate: 350,
    status: 'active',
    fuelPolicy: 'actual_reimbursement',
    monthlyFuelBudgetAmount: 12000,
  });

  // Replace Vehicle State: "Kaun si gadi kab hati, kiski lagi"
  const [replaceVehOldId, setReplaceVehOldId] = useState<string>(tenderVehicles[0]?.id || '');
  const [replaceVehSource, setReplaceVehSource] = useState<'existing_fleet' | 'new_attached'>('new_attached');
  const [replaceVehNewId, setReplaceVehNewId] = useState<string>('');
  const [replaceVehNewNumber, setReplaceVehNewNumber] = useState<string>('');
  const [replaceVehNewModel, setReplaceVehNewModel] = useState<string>('Maruti Suzuki Dzire ZXi');
  const [replaceVehOwnership, setReplaceVehOwnership] = useState<'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver'>('Attached / Market Hire');
  const [replaceVehVendorId, setReplaceVehVendorId] = useState<string>('');
  const [replaceVehVendorRent, setReplaceVehVendorRent] = useState<number>(31000);
  const [replaceVehReason, setReplaceVehReason] = useState<VehicleReplacementReason>('breakdown_maintenance');
  const [replaceVehDate, setReplaceVehDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [replaceVehNotes, setReplaceVehNotes] = useState<string>('');
  const [replaceVehTransferOfficerAndDriver, setReplaceVehTransferOfficerAndDriver] = useState<boolean>(true);

  // Replace Driver State: "Kaun kab hata kaun laga"
  const [replaceDrvVehId, setReplaceDrvVehId] = useState<string>(tenderVehicles[0]?.id || '');
  const [replaceDrvNewId, setReplaceDrvNewId] = useState<string>('');
  const [replaceDrvReason, setReplaceDrvReason] = useState<ReplacementReason>('officer_request');
  const [replaceDrvDate, setReplaceDrvDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [replaceDrvNotes, setReplaceDrvNotes] = useState<string>('');

  // Daily Log State
  const [logVehId, setLogVehId] = useState<string>(tenderVehicles[0]?.id || '');
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [logOpeningKm, setLogOpeningKm] = useState<number>(tenderVehicles[0]?.currentOdometer || 25000);
  const [logClosingKm, setLogClosingKm] = useState<number>((tenderVehicles[0]?.currentOdometer || 25000) + 85);
  const [logOpenTime, setLogOpenTime] = useState<string>('09:00');
  const [logCloseTime, setLogCloseTime] = useState<string>('19:00');
  const [logStartLoc, setLogStartLoc] = useState<string>('Officer Residence');
  const [logEndLoc, setLogEndLoc] = useState<string>('Head Office / Site Commute');
  const [logPurpose, setLogPurpose] = useState<string>('Official Duty / Division Site Visit');
  const [logToll, setLogToll] = useState<number>(0);
  const [logSlipNumber, setLogSlipNumber] = useState<string>(`DS-${Date.now().toString().slice(-5)}`);

  // Fuel Form State
  const [fuelVehId, setFuelVehId] = useState<string>(tenderVehicles[0]?.id || '');
  const [fuelDate, setFuelDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fuelLiters, setFuelLiters] = useState<number>(35);
  const [fuelRate, setFuelRate] = useState<number>(90);
  const [fuelOdo, setFuelOdo] = useState<number>(tenderVehicles[0]?.currentOdometer || 25000);
  const [fuelStation, setFuelStation] = useState<string>('Indian Oil Corp, Hazratganj');
  const [fuelReceipt, setFuelReceipt] = useState<string>(`IOCL-${Date.now().toString().slice(-4)}`);

  // Bill Form State
  const [billVehId, setBillVehId] = useState<string>(tenderVehicles[0]?.id || '');
  const [billMonth, setBillMonth] = useState<string>('2026-08');
  const [billTotalKm, setBillTotalKm] = useState<number>(2450);
  const [billTotalHrs, setBillTotalHrs] = useState<number>(265);
  const [billToll, setBillToll] = useState<number>(680);
  const [billNightHalts, setBillNightHalts] = useState<number>(1);
  const [billPenalty, setBillPenalty] = useState<number>(0);

  // Daily Payment State
  const [payAmount, setPayAmount] = useState<number>(2000);
  const [payCategory, setPayCategory] = useState<'driver_advance' | 'fuel' | 'maintenance' | 'other'>('driver_advance');
  const [payMode, setPayMode] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [payDesc, setPayDesc] = useState<string>('Advance for route duty and food');
  const [payDriverId, setPayDriverId] = useState<string>(drivers[0]?.id || '');

  // Helper when log vehicle changes
  const handleLogVehChange = (vid: string) => {
    setLogVehId(vid);
    const v = vehicles.find((veh) => veh.id === vid);
    if (v) {
      setLogOpeningKm(v.currentOdometer);
      setLogClosingKm(v.currentOdometer + 80);
    }
  };

  // Submit Handlers
  const handleSaveOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerForm.name || !officerForm.mobile) return;
    const newOfficer: Officer = {
      id: officerForm.id || `off-${Date.now()}`,
      name: officerForm.name,
      designation: officerForm.designation || 'Inspection Officer',
      department: tender.departmentName,
      officeAddress: officerForm.officeAddress || tender.authorityOffice,
      mobile: officerForm.mobile,
      tenderId: tender.id,
      reportingTime: officerForm.reportingTime || '09:30 AM',
      assignedVehicleId: officerForm.assignedVehicleId,
      currentDriverId: officerForm.currentDriverId,
    };
    onSaveOfficer(newOfficer);
    setActiveActionModal(null);
  };

  const handleSaveVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.vehicleNumber) return;
    const newVeh: Vehicle = {
      id: vehicleForm.id || `veh-${Date.now()}`,
      vehicleNumber: vehicleForm.vehicleNumber.toUpperCase().trim(),
      makeModel: vehicleForm.makeModel || 'Maruti Suzuki Dzire',
      vehicleType: vehicleForm.vehicleType || 'Sedan',
      fuelType: vehicleForm.fuelType || 'Diesel',
      color: vehicleForm.color || 'White',
      modelYear: Number(vehicleForm.modelYear) || 2025,
      ownershipType: vehicleForm.ownershipType || 'Company Owned',
      vendorId: vehicleForm.vendorId,
      vendorName: vehicleForm.vendorName,
      monthlyVendorRent: Number(vehicleForm.monthlyVendorRent) || undefined,
      tenderId: tender.id,
      assignedOfficerId: vehicleForm.assignedOfficerId,
      currentDriverId: vehicleForm.currentDriverId,
      currentOdometer: Number(vehicleForm.currentOdometer) || 10000,
      rtoFitnessExpiry: vehicleForm.rtoFitnessExpiry || '2028-12-31',
      insuranceExpiry: vehicleForm.insuranceExpiry || '2027-12-31',
      pucExpiry: vehicleForm.pucExpiry || '2026-12-31',
      roadTaxExpiry: vehicleForm.roadTaxExpiry || '2028-12-31',
      permitExpiry: vehicleForm.permitExpiry || '2028-12-31',
      status: 'active',
      fuelPolicy: vehicleForm.fuelPolicy || 'actual_reimbursement',
      documents: [],
    };
    onSaveVehicle(newVeh);
    if (vehicleForm.currentDriverId && onSaveDriver) {
      const drv = drivers.find((d) => d.id === vehicleForm.currentDriverId);
      if (drv) {
        onSaveDriver({
          ...drv,
          currentVehicleId: newVeh.id,
          status: 'active',
        });
      }
    }
    setActiveActionModal(null);
  };

  const handleSaveDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverForm.name || !driverForm.phone) return;
    const newDrv: Driver = {
      id: driverForm.id || `drv-${Date.now()}`,
      name: driverForm.name,
      phone: driverForm.phone,
      address: driverForm.address || 'Lucknow',
      licenseNumber: driverForm.licenseNumber || 'DL-UP32-2024-001928',
      licenseExpiry: driverForm.licenseExpiry || '2029-12-31',
      policeVerificationDate: driverForm.policeVerificationDate || '2026-01-01',
      policeVerificationExpiry: driverForm.policeVerificationExpiry || '2027-01-01',
      aadharNumber: driverForm.aadharNumber || '542019283741',
      joiningDate: driverForm.joiningDate || new Date().toISOString().slice(0, 10),
      monthlySalary: Number(driverForm.monthlySalary) || 16500,
      dailyDaRate: Number(driverForm.dailyDaRate) || 350,
      status: 'active',
      fuelPolicy: 'actual_reimbursement',
      monthlyFuelBudgetAmount: 12000,
    };
    onSaveDriver(newDrv);
    setActiveActionModal(null);
  };

  const handleReplaceVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceVehOldId) return;

    if (replaceVehSource === 'existing_fleet') {
      if (!replaceVehNewId) {
        alert('Please choose replacement vehicle from fleet');
        return;
      }
      const targetV = vehicles.find((v) => v.id === replaceVehNewId);
      if (!targetV) return;
      onReplaceVehicle(
        tender.id,
        replaceVehOldId,
        {
          id: targetV.id,
          vehicleNumber: targetV.vehicleNumber,
          makeModel: targetV.makeModel,
          ownershipType: targetV.ownershipType,
          fuelType: targetV.fuelType,
          vehicleType: targetV.vehicleType,
        },
        replaceVehReason,
        replaceVehDate,
        replaceVehNotes,
        replaceVehTransferOfficerAndDriver
      );
    } else {
      if (!replaceVehNewNumber) {
        alert('Please enter new vehicle registration number');
        return;
      }
      const selectedVendor = vendors.find((vnd) => vnd.id === replaceVehVendorId);
      onReplaceVehicle(
        tender.id,
        replaceVehOldId,
        {
          vehicleNumber: replaceVehNewNumber,
          makeModel: replaceVehNewModel,
          ownershipType: replaceVehOwnership,
          vendorId: replaceVehVendorId || undefined,
          vendorName: selectedVendor?.name,
          monthlyVendorRent: replaceVehVendorRent,
        },
        replaceVehReason,
        replaceVehDate,
        replaceVehNotes,
        replaceVehTransferOfficerAndDriver
      );
    }
    setActiveActionModal(null);
  };

  const handleReplaceDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceDrvVehId || !replaceDrvNewId) return;
    onReplaceDriver(replaceDrvVehId, replaceDrvNewId, replaceDrvReason, replaceDrvDate, replaceDrvNotes);
    setActiveActionModal(null);
  };

  const handleTransferOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferVehId) return;

    let newOffPayload:
      | { id?: string; name: string; designation: string; department?: string; mobile: string }
      | undefined;

    if (transferAction === 'reassign_new_officer') {
      if (newOfficerSource === 'existing') {
        const existOff = officers.find((o) => o.id === selectedExistingOfficerId);
        if (!existOff) {
          alert('कृपया सूची से अधिकारी का चयन करें');
          return;
        }
        newOffPayload = {
          id: existOff.id,
          name: existOff.name,
          designation: existOff.designation,
          department: existOff.department,
          mobile: existOff.mobile,
        };
      } else {
        if (!newOffName.trim() || !newOffMobile.trim()) {
          alert('कृपया नए अधिकारी का नाम व मोबाइल नंबर दर्ज करें');
          return;
        }
        newOffPayload = {
          name: newOffName.trim(),
          designation: newOffDesignation.trim() || 'Inspection Officer',
          department: newOffDept.trim() || tender.departmentName,
          mobile: newOffMobile.trim(),
        };
      }
    }

    onTransferOrRelieveOfficer(
      transferVehId,
      transferAction,
      transferDate,
      transferReason,
      transferOrderNo,
      transferNotes,
      newOffPayload,
      transferDriverAction
    );
    setActiveActionModal(null);
  };

  const handleReactivateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reactivateVehId) return;

    if (reactivateOfficerSource === 'existing') {
      if (!reactivateExistingOffId) {
        alert('कृपया अधिकारी का चयन करें');
        return;
      }
      onReactivateIdleVehicle(reactivateVehId, reactivateExistingOffId, reactivateDate, reactivateNotes);
    } else {
      if (!reactivateOffName.trim() || !reactivateOffMobile.trim()) {
        alert('कृपया नए अधिकारी का नाम व मोबाइल नंबर दर्ज करें');
        return;
      }
      onReactivateIdleVehicle(
        reactivateVehId,
        {
          name: reactivateOffName.trim(),
          designation: reactivateOffDesig.trim() || 'Inspection Officer',
          mobile: reactivateOffMobile.trim(),
          department: tender.departmentName,
        },
        reactivateDate,
        reactivateNotes
      );
    }
    setActiveActionModal(null);
  };

  const handleAddLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === logVehId);
    if (!veh) return;
    const off = officers.find((o) => o.assignedVehicleId === veh.id || o.id === veh.assignedOfficerId);
    const drv = drivers.find((d) => d.id === veh.currentDriverId);

    const kmRun = Math.max(0, logClosingKm - logOpeningKm);
    const [startH, startM] = logOpenTime.split(':').map(Number);
    const [endH, endM] = logCloseTime.split(':').map(Number);
    const totalMins = (endH * 60 + endM) - (startH * 60 + startM);
    const totalHours = Math.max(1, +(totalMins / 60).toFixed(1));

    const newLog: DailyLogEntry = {
      id: `log-${Date.now()}`,
      date: logDate,
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      driverId: drv?.id || 'drv-unassigned',
      driverName: drv?.name || 'Duty Driver',
      officerId: off?.id || 'off-unassigned',
      officerName: off?.name || 'Inspection Officer',
      tenderId: tender.id,
      openingKm: logOpeningKm,
      closingKm: logClosingKm,
      totalKm: kmRun,
      openingTime: logOpenTime,
      closingTime: logCloseTime,
      totalHours,
      startLocation: logStartLoc,
      endLocation: logEndLoc,
      purpose: logPurpose,
      dutyType: 'local',
      tollParkingCost: Number(logToll) || 0,
      driverDaNightHalt: 0,
      acUsed: true,
      slipNumber: logSlipNumber,
      isVerifiedByOfficer: true,
      officerRemarks: 'Duty slip verified and signed by officer.',
    };
    onAddLog(newLog);
    setActiveActionModal(null);
  };

  const handleAddFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === fuelVehId);
    if (!veh) return;
    const drv = drivers.find((d) => d.id === veh.currentDriverId);

    const totalAmt = fuelLiters * fuelRate;
    const newFuel: FuelRecord = {
      id: `fuel-${Date.now()}`,
      date: fuelDate,
      vehicleId: veh.id,
      vehicleNumber: veh.vehicleNumber,
      driverId: drv?.id || 'drv-unassigned',
      driverName: drv?.name || 'Driver',
      mode: 'slip',
      liters: fuelLiters,
      ratePerLiter: fuelRate,
      totalAmount: totalAmt,
      odometerKm: fuelOdo,
      fuelType: veh.fuelType === 'CNG' ? 'CNG' : veh.fuelType === 'Petrol' ? 'Petrol' : 'Diesel',
      fuelStation,
      receiptNumber: fuelReceipt,
      fullTank: true,
      notes: `Fueled under ${tender.departmentName} deployment.`,
    };
    onAddFuelRecord(newFuel);
    setActiveActionModal(null);
  };

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const veh = vehicles.find((v) => v.id === billVehId) || tenderVehicles[0];
    const off = officers.find((o) => o.assignedVehicleId === veh?.id || o.tenderId === tender.id);

    const allowedKm = tender.includedKms || 2000;
    const extraKm = Math.max(0, billTotalKm - allowedKm);
    const extraKmAmount = extraKm * (tender.extraKmRate || 12);

    const allowedHr = tender.includedHours || 250;
    const extraHr = Math.max(0, billTotalHrs - allowedHr);
    const extraHrAmount = extraHr * (tender.extraHourRate || 60);

    const nightAmount = billNightHalts * (tender.nightHaltRate || 400);
    const grossAmount = tender.baseMonthlyRate + extraKmAmount + extraHrAmount + nightAmount + billToll - billPenalty;
    const gstPercent = 5;
    const gstAmount = Math.round(grossAmount * 0.05);
    const tdsPercent = 2;
    const tdsAmount = Math.round(grossAmount * 0.02);
    const netPayable = grossAmount + gstAmount - tdsAmount;

    const prefix = tender.billSeriesPrefix || 'SF/BILL/2026/';
    const billNumber = `${prefix}${billMonth.replace('-', '')}/${veh?.vehicleNumber.replace(/\s+/g, '') || '01'}`;

    const newBill: MonthlyBill = {
      id: `bill-${Date.now()}`,
      billNumber,
      tenderId: tender.id,
      tenderName: tender.departmentName,
      departmentName: tender.departmentName,
      officerName: off?.name || 'Inspection Officer',
      vehicleId: veh?.id || '',
      vehicleNumber: veh?.vehicleNumber || '',
      monthYear: billMonth,
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      baseAmount: tender.baseMonthlyRate,
      totalKmsRun: billTotalKm,
      allowedKms: allowedKm,
      extraKms: extraKm,
      extraKmRate: tender.extraKmRate,
      extraKmAmount,
      totalHoursRun: billTotalHrs,
      allowedHours: allowedHr,
      extraHours: extraHr,
      extraHourRate: tender.extraHourRate,
      extraHourAmount: extraHrAmount,
      nightHaltsCount: billNightHalts,
      nightHaltRate: tender.nightHaltRate,
      nightHaltAmount: nightAmount,
      tollParkingAmount: billToll,
      penaltyDeductions: billPenalty,
      grossAmount,
      gstPercent,
      gstAmount,
      tdsPercent,
      tdsAmount,
      netPayableAmount: netPayable,
      paymentStatus: 'submitted',
    };
    onSaveBill(newBill);
    setActiveActionModal(null);
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const drv = drivers.find((d) => d.id === payDriverId);
    const newPay: DailyPaymentEntry = {
      id: `dpay-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      category: payCategory,
      amount: payAmount,
      paymentMode: payMode,
      payeeName: drv?.name || 'Driver',
      payeeType: 'driver',
      driverId: drv?.id,
      description: `${payDesc} (Tender: ${tender.departmentName})`,
      autoRoutedTo: 'Driver Advance Khata',
    };
    onAddDailyPayment(newPay);
    setActiveActionModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Header Banner */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-white/10 bg-[var(--color-ink)] p-4 text-white sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-teal-600/90 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
                WO: {tender.workOrderNumber || tender.tenderNumber}
              </span>
              <span className="badge badge-neutral !bg-white/10 !text-teal-200">
                Tender 360° hub
              </span>
              <span
                className={`badge ${
                  tender.status === 'active' ? 'badge-success' : 'badge-neutral'
                }`}
              >
                {tender.status}
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-base font-bold leading-tight tracking-tight sm:text-lg">
              {tender.departmentName}
            </h2>
            <p className="line-clamp-1 text-xs text-white/50">{tender.authorityOffice}</p>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            <div className="hidden text-right md:block">
              <span className="block text-[10px] uppercase tracking-wide text-white/40">Base rate / vehicle</span>
              <span className="text-sm font-bold text-teal-300">
                {formatCurrency(tender.baseMonthlyRate)}
                <span className="text-[10px] text-white/45"> /mo</span>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-1.5 text-white/60 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick actions — clear grid, no rainbow clutter */}
        <div className="shrink-0 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-3.5 sm:px-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <div>
              <span className="page-kicker">Quick actions</span>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                Create entries for this tender without leaving the hub.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {[
              { label: 'Add officer', icon: <Users className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_officer') },
              { label: 'Add vehicle', icon: <Car className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_vehicle') },
              { label: 'Add driver', icon: <UserCheck className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_driver') },
              { label: 'Change vehicle', icon: <ArrowRightLeft className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('replace_vehicle'), title: 'Replace vehicle assignment' },
              { label: 'Change driver', icon: <ArrowRightLeft className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('replace_driver'), title: 'Replace driver assignment' },
              { label: 'Duty log', icon: <FileText className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_log'), primary: true },
              { label: 'Fuel slip', icon: <Fuel className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_fuel') },
              { label: 'Govt bill', icon: <Receipt className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_bill'), primary: true },
              {
                label: 'Officer transfer',
                icon: <Building2 className="h-3.5 w-3.5" />,
                onClick: () => {
                  setTransferVehId(tenderVehicles[0]?.id || '');
                  setActiveActionModal('transfer_officer');
                },
                title: 'Transfer officer or halt vehicle',
              },
              {
                label: 'Driver hisab',
                icon: <IndianRupee className="h-3.5 w-3.5" />,
                onClick: () => {
                  const firstVeh = tenderVehicles[0];
                  const firstOff = officers.find((o) => o.assignedVehicleId === firstVeh?.id || o.id === firstVeh?.assignedOfficerId) || tenderOfficers[0];
                  setHisabModalConfig({
                    isOpen: true,
                    initialTab: 'payments',
                    vehicleId: firstVeh?.id,
                    officerId: firstOff?.id,
                    driverId: firstVeh?.currentDriverId,
                  });
                },
              },
              {
                label: 'Leave / relief',
                icon: <Calendar className="h-3.5 w-3.5" />,
                onClick: () => {
                  const firstVeh = tenderVehicles[0];
                  const firstOff = officers.find((o) => o.assignedVehicleId === firstVeh?.id || o.id === firstVeh?.assignedOfficerId) || tenderOfficers[0];
                  setHisabModalConfig({
                    isOpen: true,
                    initialTab: 'leaves',
                    vehicleId: firstVeh?.id,
                    officerId: firstOff?.id,
                    driverId: firstVeh?.currentDriverId,
                  });
                },
              },
              { label: 'Petty advance', icon: <CreditCard className="h-3.5 w-3.5" />, onClick: () => setActiveActionModal('add_payment') },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.title}
                onClick={a.onClick}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                  a.primary
                    ? 'border-teal-200 bg-teal-50 text-[var(--color-ink)] hover:border-teal-400 hover:bg-teal-100/80'
                    : 'border-[var(--color-line)] bg-white text-[var(--color-ink-soft)] hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface-muted)]'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    a.primary ? 'bg-teal-700 text-white' : 'bg-[var(--color-sand)] text-[var(--color-ink-soft)]'
                  }`}
                >
                  {a.icon}
                </span>
                <span className="leading-tight">{a.label}</span>
              </button>
            ))}

            {tenderVehicles.some((v) => v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary') && (
              <button
                type="button"
                onClick={() => {
                  const idleV = tenderVehicles.find((v) => v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary');
                  setReactivateVehId(idleV?.id || '');
                  setActiveActionModal('reactivate_vehicle');
                }}
                className="flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-700 px-3 py-2.5 text-left text-xs font-bold text-white transition-all hover:bg-teal-600"
                title="Reactivate halted vehicle"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">▶</span>
                Restart vehicle
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs — scroll cues when more tabs exist off-screen */}
        <div className="relative shrink-0 border-b border-[var(--color-line)] bg-white">
          {canScrollTabsLeft && (
            <button
              type="button"
              onClick={() => scrollHubTabs('left')}
              className="absolute left-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-line)] bg-white text-[var(--color-ink)] shadow-md transition hover:border-teal-300 hover:text-teal-700"
              aria-label="Scroll tabs left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {canScrollTabsRight && (
            <button
              type="button"
              onClick={() => scrollHubTabs('right')}
              className="absolute right-1 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-800 shadow-md transition hover:bg-teal-100"
              aria-label="Scroll tabs right — more options"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          <div
            className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white to-transparent transition-opacity ${
              canScrollTabsLeft ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <div
            className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-white to-transparent transition-opacity ${
              canScrollTabsRight ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            ref={hubTabsRef}
            className="flex min-h-12 items-stretch gap-0.5 overflow-x-auto scroll-smooth px-3 scrollbar-none"
            style={{ scrollbarWidth: 'none' }}
          >
            {(
              [
                { id: 'roster' as const, label: `Fleet & officers (${tenderVehicles.length})`, icon: <Car className="h-4 w-4 shrink-0" /> },
                { id: 'drivers' as const, label: `Drivers (${tenderDrivers.length}/${tenderVehicles.length})`, icon: <Users className="h-4 w-4 shrink-0" /> },
                { id: 'driver_hisab' as const, label: `Driver hisab (${tenderVehicles.length})`, icon: <IndianRupee className="h-4 w-4 shrink-0" /> },
                { id: 'officer_transfers' as const, label: `Transfers (${tenderOfficerHistory.length})`, icon: <Building2 className="h-4 w-4 shrink-0" /> },
                { id: 'vehicle_replacement' as const, label: `Vehicle history (${tenderVehicleHistory.length})`, icon: <ArrowRightLeft className="h-4 w-4 shrink-0" /> },
                { id: 'driver_replacement' as const, label: `Driver history (${tenderDriverHistory.length})`, icon: <UserCheck className="h-4 w-4 shrink-0" /> },
                { id: 'logs' as const, label: `Duty logs (${tenderLogs.length})`, icon: <FileText className="h-4 w-4 shrink-0" /> },
                { id: 'billing' as const, label: `Monthly bills (${tenderBills.length})`, icon: <Receipt className="h-4 w-4 shrink-0" /> },
                { id: 'fuel' as const, label: `Fuel & expenses (${tenderFuel.length})`, icon: <Fuel className="h-4 w-4 shrink-0" /> },
                { id: 'officers' as const, label: `Officers (${tenderOfficers.length})`, icon: <Users className="h-4 w-4 shrink-0" /> },
                { id: 'terms' as const, label: 'Terms & rates', icon: <Building2 className="h-4 w-4 shrink-0" /> },
              ]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex h-12 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-xs font-semibold leading-none transition-colors ${
                    isActive
                      ? 'border-teal-600 text-teal-800'
                      : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {tab.icon}
                  <span className="leading-none">{tab.label}</span>
                </button>
              );
            })}
            {canScrollTabsRight && (
              <span className="inline-flex h-12 shrink-0 items-center gap-1 px-2 text-[11px] font-bold text-teal-700">
                More
                <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
              </span>
            )}
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-sand)]/80 p-4 sm:p-6">
          {/* TAB 1: ROSTER (Vehicles & Officers) */}
          {activeTab === 'roster' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-[var(--color-ink)]">
                    Active fleet & officer deployments
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    {tender.departmentName} · vehicle, officer, driver & odometer
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {tenderVehicles.some((v) => !getAssignedDriverForVehicle(v, drivers, officers)) && (
                    <button
                      type="button"
                      onClick={handleAutoAssignDriversForTender}
                      className="btn btn-secondary"
                      title="Auto-link available drivers"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Auto-link drivers
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveActionModal('add_vehicle')}
                    className="btn btn-primary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add vehicle
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveActionModal('add_officer')}
                    className="btn btn-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add officer
                  </button>
                </div>
              </div>

              {tenderVehicles.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <Car className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    इस टेंडर में अभी कोई गाड़ी अटैच नहीं है।
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">
                    कृपया "गाड़ी जोड़ें" बटन दबाकर गाड़ी या वेंडर फ्लीट अटैच करें।
                  </p>
                  <button
                    onClick={() => setActiveActionModal('add_vehicle')}
                    className="px-4 py-2 bg-[var(--color-ink)] text-white rounded-lg text-xs font-bold"
                  >
                    + पहली गाड़ी जोड़ें
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenderVehicles.map((veh) => {
                    const assignedOfficer = officers.find(
                      (o) => o.assignedVehicleId === veh.id || o.id === veh.assignedOfficerId
                    );
                    const currentDriver = getAssignedDriverForVehicle(veh, drivers, officers);

                    return (
                      <div
                        key={veh.id}
                        className="panel panel-pad flex flex-col justify-between transition-all hover:border-teal-300"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {veh.vehicleNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                    currentDriver || veh.driverName
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-50 text-rose-700 border-rose-300'
                                  }`}
                                >
                                  <span>👨‍✈️ चालक: {currentDriver?.name || veh.driverName || 'अनावंटित'}</span>
                                  {onOpenProfileModal && (currentDriver?.id || veh.driverName) && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenProfileModal('driver', currentDriver?.id)}
                                      className="ml-0.5 hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-200/60 transition-colors cursor-pointer"
                                      title="चालक प्रोफ़ाइल एडिट करें"
                                    >
                                      <Edit2 className="w-2.5 h-2.5 text-emerald-700" />
                                    </button>
                                  )}
                                </span>
                              </div>
                              <p className="text-xs font-medium text-slate-600 mt-1">
                                {veh.makeModel} &bull; {veh.fuelType}
                              </p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                                veh.status === 'idle_officer_transferred'
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : veh.status === 'surrendered_temporary'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : veh.ownershipType === 'Company Owned'
                                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                                  : veh.ownershipType === 'Owner-Driver'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-teal-100 text-teal-800 border-teal-300'
                              }`}
                            >
                              {veh.status === 'idle_officer_transferred'
                                ? '🛑 तबादला - गाड़ी बंद'
                                : veh.status === 'surrendered_temporary'
                                ? 'अस्थायी सरेंडर'
                                : veh.ownershipType === 'Company Owned'
                                ? '🏢 Company Owned'
                                : veh.ownershipType === 'Owner-Driver'
                                ? '🚗 Owner-Driver'
                                : '🤝 Attached'}
                            </span>
                          </div>

                          {/* If vehicle is idle due to officer transfer */}
                          {veh.status === 'idle_officer_transferred' && (
                            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>अधिकारी का तबादला - गाड़ी बंद है</span>
                              </div>
                              <p className="text-[11px] text-rose-700">
                                <strong>रुकी हुई तिथि:</strong> {formatDate(veh.idleSinceDate || '')}
                              </p>
                              {veh.idleReason && (
                                <p className="text-[10px] text-rose-600 italic">"{veh.idleReason}"</p>
                              )}
                              {veh.transferOrderRef && (
                                <p className="text-[10px] font-mono text-rose-800">
                                  आदेश: {veh.transferOrderRef}
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setReactivateVehId(veh.id);
                                  setActiveActionModal('reactivate_vehicle');
                                }}
                                className="w-full mt-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                              >
                                <span>▶️ नया अधिकारी लगाएं व गाड़ी चालू करें</span>
                              </button>
                            </div>
                          )}

                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--color-muted)] text-[11px]">अधिकारी (Officer):</span>
                              <span
                                className={`font-semibold ${
                                  assignedOfficer ? 'text-slate-800' : 'text-rose-600 font-bold'
                                }`}
                              >
                                {assignedOfficer?.name || (veh.status === 'idle_officer_transferred' ? 'पद रिक्त (Vacant)' : 'Unassigned (रिक्त)')}
                              </span>
                            </div>
                            {assignedOfficer && (
                              <p className="text-[10px] text-[var(--color-muted)] text-right truncate">
                                {assignedOfficer.designation}
                              </p>
                            )}

                            {/* Driver display */}
                            {(currentDriver || veh.driverName) ? (
                              <div className="pt-1.5 border-t border-slate-200/60 flex items-start justify-between gap-1">
                                <span className="text-[var(--color-muted)] text-[11px] flex items-center gap-1">
                                  👨‍✈️ <strong>चालक (Driver):</strong>
                                </span>
                                <div className="text-right">
                                  <span className="font-bold text-slate-900 text-xs block">
                                    {currentDriver?.name || veh.driverName}
                                  </span>
                                  <div className="flex items-center gap-2 justify-end text-[10px] text-[var(--color-muted)] font-mono mt-0.5">
                                    {(currentDriver?.phone || veh.driverPhone) && (
                                      <a
                                        href={`tel:${currentDriver?.phone || veh.driverPhone}`}
                                        className="text-[var(--color-copper)] hover:underline"
                                      >
                                        📞 {currentDriver?.phone || veh.driverPhone}
                                      </a>
                                    )}
                                    <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                                      {formatCurrency(currentDriver?.monthlySalary ?? (veh.ownershipType === 'Owner-Driver' ? 0 : 16500))}/माह
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-1.5 border-t border-rose-200 bg-rose-50/70 p-2 rounded-lg space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-bold text-rose-700 flex items-center gap-1">
                                    ⚠️ चालक अनावंटित (No Driver Assigned)
                                  </span>
                                </div>
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleQuickAssignDriver(veh.id, e.target.value);
                                    }
                                  }}
                                  className="w-full text-xs px-2 py-1.5 bg-white border border-rose-300 rounded font-medium text-slate-800"
                                  defaultValue=""
                                >
                                  <option value="" disabled>चालक चुनें व तुरंत नियुक्त करें...</option>
                                  {drivers.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      👨‍✈️ {d.name} ({d.phone}) {d.status === 'active' ? '✓ Available' : `(${d.status})`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-[var(--color-muted)]">Current Odometer:</span>
                              <span className="font-mono font-bold text-slate-700">
                                {veh.currentOdometer.toLocaleString()} KM
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick row actions — unified style */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--color-line)] pt-3 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferVehId(veh.id);
                              setActiveActionModal('transfer_officer');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
                            title="Officer transfer / halt vehicle"
                          >
                            <Building2 className="h-3 w-3" />
                            Transfer
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplaceVehOldId(veh.id);
                              setActiveActionModal('replace_vehicle');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                            title="Change vehicle"
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                            Vehicle
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplaceDrvVehId(veh.id);
                              setActiveActionModal('replace_driver');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                          >
                            <UserCheck className="h-3 w-3" />
                            Driver
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              handleLogVehChange(veh.id);
                              setActiveActionModal('add_log');
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 transition-colors hover:bg-teal-100"
                          >
                            <Plus className="h-3 w-3" />
                            Log
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHisabModalConfig({
                                isOpen: true,
                                initialTab: 'payments',
                                vehicleId: veh.id,
                                officerId: assignedOfficer?.id,
                                driverId: currentDriver?.id,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                            title="Driver hisab & payment"
                          >
                            <IndianRupee className="h-3 w-3" />
                            Hisab
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setHisabModalConfig({
                                isOpen: true,
                                initialTab: 'leaves',
                                vehicleId: veh.id,
                                officerId: assignedOfficer?.id,
                                driverId: currentDriver?.id,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-2 py-1 text-[11px] font-semibold text-[var(--color-ink-soft)] transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                            title="Leave & relief driver"
                          >
                            <Calendar className="h-3 w-3" />
                            Leave
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DEPLOYED DRIVERS DIRECTORY (तैनात चालकों की विस्तृत सूची व प्रोफ़ाइल) */}
          {activeTab === 'drivers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                <div>
                  <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span>तैनात चालक सूची व ड्यूटी विवरण ({tender.departmentName})</span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    इस टेंडर में अटैच प्रत्येक गाड़ी के साथ अधिकृत चालक, उनका मोबाइल, वेतन, डीएल व स्थिति।
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {tenderVehicles.some((v) => !getAssignedDriverForVehicle(v, drivers, officers)) && (
                    <button
                      type="button"
                      onClick={handleAutoAssignDriversForTender}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-[var(--color-ink)] rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title="उपलब्ध खाली चालकों को गाड़ियों से ऑटो-लिंक करें"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ ऑटो-लिंक चालक</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveActionModal('add_driver')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नया ड्राइवर जोड़ें</span>
                  </button>
                </div>
              </div>

              {tenderVehicles.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <Users className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    इस टेंडर में अभी कोई गाड़ी या ड्राइवर अटैच नहीं है।
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">
                    गाड़ी अटैच करने के बाद चालक स्वतः यहाँ दिखाई देंगे।
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenderVehicles.map((veh) => {
                    const drv = getAssignedDriverForVehicle(veh, drivers, officers);
                    const off = officers.find(
                      (o) => o.assignedVehicleId === veh.id || o.id === veh.assignedOfficerId
                    );

                    return (
                      <div
                        key={veh.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-3"
                      >
                        <div>
                          {/* Driver Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-base text-slate-900">
                                  {drv ? drv.name : '⚠️ चालक अनावंटित'}
                                </span>
                                {drv && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    सक्रिय
                                  </span>
                                )}
                              </div>
                              {drv ? (
                                <a
                                  href={`tel:${drv.phone}`}
                                  className="text-xs font-mono font-bold text-[var(--color-copper)] hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  📞 {drv.phone}
                                </a>
                              ) : (
                                <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                                  इस गाड़ी पर कोई चालक नियुक्त नहीं है
                                </div>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block">
                                {veh.vehicleNumber}
                              </span>
                              <span className="text-[10px] text-[var(--color-muted)] block mt-0.5 truncate max-w-[120px]">
                                {veh.makeModel}
                              </span>
                            </div>
                          </div>

                          {/* Driver Quick Select if Unassigned */}
                          {!drv && (
                            <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg space-y-1.5">
                              <label className="block text-[11px] font-bold text-rose-900">
                                गाड़ी के लिए चालक नियुक्त करें:
                              </label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleQuickAssignDriver(veh.id, e.target.value);
                                  }
                                }}
                                className="w-full text-xs px-2.5 py-1.5 bg-white border border-rose-300 rounded-md font-medium text-slate-800"
                                defaultValue=""
                              >
                                <option value="" disabled>उपलब्ध चालकों में से चुनें...</option>
                                {drivers.map((d) => (
                                  <option key={d.id} value={d.id}>
                                    👨‍✈️ {d.name} &bull; {d.phone} ({d.status === 'active' ? 'Available' : d.status})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Driver Details List */}
                          {drv && (
                            <div className="mt-2.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--color-muted)]">मासिक वेतन:</span>
                                <span className="font-bold text-slate-900">
                                  {formatCurrency(drv.monthlySalary)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--color-muted)]">दैनिक DA:</span>
                                <span className="font-semibold text-slate-800">
                                  ₹{drv.dailyDaRate} / दिन
                                </span>
                              </div>
                              {drv.licenseNumber && (
                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                                  <span className="text-[var(--color-muted)]">ड्राइविंग लाइसेंस:</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {drv.licenseNumber}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                                <span className="text-[var(--color-muted)]">अधिकारी:</span>
                                <span className="font-medium text-[var(--color-copper)] truncate max-w-[150px]">
                                  {off ? `${off.name} (${off.designation})` : 'पद रिक्त (Vacant)'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setReplaceDrvVehId(veh.id);
                              setActiveActionModal('replace_driver');
                            }}
                            className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-[var(--color-copper)]" />
                            <span>बदलें</span>
                          </button>

                          {drv && (
                            <button
                              type="button"
                              onClick={() => {
                                setHisabModalConfig({
                                  isOpen: true,
                                  initialTab: 'payments',
                                  vehicleId: veh.id,
                                  officerId: off?.id,
                                  driverId: drv.id,
                                });
                              }}
                              className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              <IndianRupee className="w-3 h-3 text-emerald-600" />
                              <span>हिसाब/वेतन</span>
                            </button>
                          )}

                          {drv && (
                            <button
                              type="button"
                              onClick={() => {
                                setHisabModalConfig({
                                  isOpen: true,
                                  initialTab: 'leaves',
                                  vehicleId: veh.id,
                                  officerId: off?.id,
                                  driverId: drv.id,
                                });
                              }}
                              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="छुट्टी व बदली दर्ज करें"
                            >
                              <Calendar className="w-3 h-3 text-amber-600" />
                              <span>छुट्टी</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: DRIVER HISAB, PAYMENTS & LEAVES (DIRECT IN-TENDER VIEW) */}
          {activeTab === 'driver_hisab' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/80 p-4 rounded-xl border border-emerald-200">
                <div>
                  <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                    <span>चालक हिसाब, भुगतान व छुट्टी-बदली हब ({tender.departmentName})</span>
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    इस टेंडर के तहत तैनात सभी ड्राइवरों का हिसाब, अग्रिम भुगतान, छुट्टी की तारीखें, बदली ड्राइवर व उस दिन का हिसाब।
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const firstVeh = tenderVehicles[0];
                      const firstOff = officers.find((o) => o.assignedVehicleId === firstVeh?.id || o.id === firstVeh?.assignedOfficerId) || tenderOfficers[0];
                      setHisabModalConfig({
                        isOpen: true,
                        initialTab: 'payments',
                        vehicleId: firstVeh?.id,
                        officerId: firstOff?.id,
                        driverId: firstVeh?.currentDriverId,
                      });
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ भुगतान / पिछला रिकॉर्ड दर्ज करें</span>
                  </button>

                  <button
                    onClick={() => {
                      const firstVeh = tenderVehicles[0];
                      const firstOff = officers.find((o) => o.assignedVehicleId === firstVeh?.id || o.id === firstVeh?.assignedOfficerId) || tenderOfficers[0];
                      setHisabModalConfig({
                        isOpen: true,
                        initialTab: 'leaves',
                        vehicleId: firstVeh?.id,
                        officerId: firstOff?.id,
                        driverId: firstVeh?.currentDriverId,
                      });
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-[var(--color-ink)] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>+ छुट्टी व बदली दर्ज करें</span>
                  </button>
                </div>
              </div>

              {/* Roster of Drivers in this Tender with Hisab Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tenderVehicles.map((veh) => {
                  const off = officers.find((o) => o.assignedVehicleId === veh.id || o.id === veh.assignedOfficerId);
                  const drv = drivers.find((d) => d.id === veh.currentDriverId);
                  const leaves = driverLeaves.filter((l) => l.driverId === drv?.id);
                  const payments = khataTransactions.filter((t) => t.driverId === drv?.id);
                  const totalPaid = payments.filter(t => t.type !== 'penalty_deduction').reduce((s, t) => s + t.amount, 0);

                  return (
                    <div key={veh.id} className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {drv ? drv.name : 'ड्राइवर अनावंटित'}
                            </span>
                            {drv && (
                              <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                वेतन: {formatCurrency(drv.monthlySalary)}/माह
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-muted)] mt-0.5">
                            वाहन: <strong className="font-mono text-slate-800">{veh.vehicleNumber}</strong> ({veh.makeModel})
                          </div>
                          {off && (
                            <div className="text-xs text-[var(--color-copper)] mt-0.5 font-medium">
                              अधिकारी: {off.name} ({off.designation})
                            </div>
                          )}
                        </div>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[var(--color-copper)] border border-teal-200">
                          {payments.length} भुगतानों का रिकॉर्ड
                        </span>
                      </div>

                      {/* Stats snippet */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-center">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-[var(--color-muted)] block uppercase font-medium">छुट्टियां</span>
                          <span className="font-bold text-amber-700">
                            {leaves.reduce((s, l) => s + l.totalDays, 0)} दिन
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-[var(--color-muted)] block uppercase font-medium">कुल दिया भुगतान</span>
                          <span className="font-bold text-slate-900">
                            ₹{totalPaid.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-[var(--color-muted)] block uppercase font-medium">मासिक वेतन</span>
                          <span className="font-bold text-emerald-700">
                            {drv ? formatCurrency(drv.monthlySalary) : '-'}
                          </span>
                        </div>
                      </div>

                      {/* Direct Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => {
                            setHisabModalConfig({
                              isOpen: true,
                              initialTab: 'payments',
                              vehicleId: veh.id,
                              officerId: off?.id,
                              driverId: drv?.id,
                            });
                          }}
                          className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-[var(--color-copper)] border border-teal-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>💰 भुगतान / पिछला रिकॉर्ड</span>
                        </button>

                        <button
                          onClick={() => {
                            setHisabModalConfig({
                              isOpen: true,
                              initialTab: 'leaves',
                              vehicleId: veh.id,
                              officerId: off?.id,
                              driverId: drv?.id,
                            });
                          }}
                          className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>🗓️ छुट्टी व बदली ड्राइवर</span>
                        </button>

                        <button
                          onClick={() => {
                            setHisabModalConfig({
                              isOpen: true,
                              initialTab: 'monthly_hisab',
                              vehicleId: veh.id,
                              officerId: off?.id,
                              driverId: drv?.id,
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>मासिक पर्ची</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: OFFICER TRANSFER & VEHICLE HALT MANAGEMENT */}
          {activeTab === 'officer_transfers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-rose-50/80 p-4 rounded-xl border border-rose-200">
                <div>
                  <h3 className="font-bold text-rose-950 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-700" />
                    <span>अधिकारी तबादला, पद रिक्ति व वाहन संचालन प्रबंधन (Officer Transfer &amp; Vehicle Halt Hub)</span>
                  </h3>
                  <p className="text-xs text-rose-800 mt-0.5">
                    जब किसी अधिकारी का तबादला हो जाता है और नई तैनाती तक गाड़ी चलना बंद हो जाती है, या नया अधिकारी कार्यभार ग्रहण करता है
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTransferVehId(tenderVehicles[0]?.id || '');
                      setActiveActionModal('transfer_officer');
                    }}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ तबादला / अधिकारी परिवर्तन</span>
                  </button>

                  {tenderVehicles.some((v) => v.status === 'idle_officer_transferred') && (
                    <button
                      onClick={() => {
                        const idleV = tenderVehicles.find((v) => v.status === 'idle_officer_transferred');
                        setReactivateVehId(idleV?.id || '');
                        setActiveActionModal('reactivate_vehicle');
                      }}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
                    >
                      <span>▶️ रुकी गाड़ी चालू करें</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-[var(--color-muted)] font-medium block">सक्रिय तैनात अधिकारी</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {tenderOfficers.filter((o) => o.status !== 'transferred' && o.status !== 'retired').length}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-[var(--color-muted)] font-medium block">🛑 तबादला/रिक्त - रुकी गाड़ियाँ</span>
                  <span className="text-lg font-bold text-rose-600">
                    {tenderVehicles.filter((v) => v.status === 'idle_officer_transferred').length}
                  </span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-[var(--color-muted)] font-medium block">कुल गाड़ियाँ (टेंडर)</span>
                  <span className="text-lg font-bold text-slate-800">{tenderVehicles.length}</span>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] text-[var(--color-muted)] font-medium block">कुल तबादला/परिवर्तन रिकॉर्ड</span>
                  <span className="text-lg font-bold text-[var(--color-copper)]">{tenderOfficerHistory.length}</span>
                </div>
              </div>

              {/* Transfer History Timeline / Table */}
              {tenderOfficerHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <Building2 className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    इस टेंडर में अभी तक कोई अधिकारी तबादला या गाड़ी रोकने का रिकॉर्ड नहीं है।
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">
                    जब भी किसी अधिकारी का ट्रांसफर होगा और गाड़ी बंद होगी या नए अधिकारी को मिलेगी, तो उसका पूरा सरकारी आदेश और तारीख यहाँ दिखेगी।
                  </p>
                  <button
                    onClick={() => {
                      setTransferVehId(tenderVehicles[0]?.id || '');
                      setActiveActionModal('transfer_officer');
                    }}
                    className="px-4 py-2 bg-rose-600 text-white font-bold rounded-lg text-xs"
                  >
                    + पहला तबादला / बदलाव दर्ज करें
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenderOfficerHistory.map((item) => {
                    const linkedVeh = vehicles.find((v) => v.id === item.vehicleId);
                    const isCurrentlyIdle = linkedVeh?.status === 'idle_officer_transferred';

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-rose-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                              {item.vehicleNumber}
                            </span>

                            <span className="text-xs font-bold text-slate-800">
                              अधिकारी: {item.officerName}
                            </span>

                            <span className="text-[11px] text-[var(--color-muted)]">
                              ({item.officerDesignation})
                            </span>

                            {item.vehicleAction === 'halted_idle_post_vacant' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                                🛑 पद रिक्त - गाड़ी चलना बंद
                              </span>
                            ) : item.vehicleAction === 'reassigned_to_new_officer' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🔄 नवीन अधिकारी को आवंटित
                              </span>
                            ) : item.vehicleAction === 'vehicle_surrendered' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                📦 गाड़ी अस्थायी सरेंडर
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-300">
                                🅿️ स्टैंडबाय पूल में
                              </span>
                            )}

                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              कारण: {item.reason.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>
                              <strong>तारीख:</strong> {formatDate(item.assignedDate)}{' '}
                              {item.relievedDate ? `से ${formatDate(item.relievedDate)} (कार्यमुक्त)` : 'से अब तक (सक्रिय)'}
                            </span>
                            {item.transferOrderNumber && (
                              <span className="font-mono text-[11px] bg-slate-50 px-1.5 py-0.5 rounded text-slate-700 border border-slate-200">
                                📜 आदेश: {item.transferOrderNumber}
                              </span>
                            )}
                          </div>

                          {item.replacementOfficerName && (
                            <div className="mt-1 bg-emerald-50 text-emerald-900 p-2 rounded text-xs border border-emerald-200 flex items-center gap-2">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>
                                <strong>नवीन कार्यभार ग्रहणकर्ता:</strong> {item.replacementOfficerName}
                                {item.replacementOfficerDesignation ? ` (${item.replacementOfficerDesignation})` : ''}
                              </span>
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100">
                              "{item.notes}"
                            </p>
                          )}
                        </div>

                        {/* Quick action if vehicle is idle */}
                        {isCurrentlyIdle && (
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            <span className="text-[11px] text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded border border-rose-200">
                              गाड़ी अभी बंद है
                            </span>
                            <button
                              onClick={() => {
                                setReactivateVehId(item.vehicleId);
                                setActiveActionModal('reactivate_vehicle');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>▶️ नया अफ़सर लगाएं व शुरू करें</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VEHICLE REPLACEMENT HISTORY ("Kaun si gadi kab hati, kiski lagi") */}
          {activeTab === 'vehicle_replacement' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200/80">
                <div>
                  <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-amber-700" />
                    <span>गाड़ी बदलाव इतिहास (Kaun si Gadi Kab Hati, Kiski Lagi)</span>
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    टेंडर में सर्विस, खराबी, अफ़सर की मांग या फ़िटनेस रिन्यूअल के कारण हटाई व लगाई गई गाडियों का संपूर्ण रिकॉर्ड
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReplaceVehOldId(tenderVehicles[0]?.id || '');
                    setActiveActionModal('replace_vehicle');
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ गाड़ी बदलें / नयी गाड़ी लगाएं</span>
                </button>
              </div>

              {tenderVehicleHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">
                    इस टेंडर में अभी तक कोई गाड़ी बदली नहीं गई है।
                  </p>
                  <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">
                    जब भी कोई गाड़ी सर्विस, ब्रेकडाउन या अफ़सर की मांग पर बदलेगी, तो यहाँ उसका टाइमलाइन दर्ज होगा।
                  </p>
                  <button
                    onClick={() => {
                      setReplaceVehOldId(tenderVehicles[0]?.id || '');
                      setActiveActionModal('replace_vehicle');
                    }}
                    className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    + गाड़ी बदलाव दर्ज करें
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenderVehicleHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-amber-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                            {item.vehicleNumber}
                          </span>
                          <span className="text-xs font-semibold text-slate-700">
                            {item.makeModel}
                          </span>

                          {item.releasedDate ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                              हटी (Released on {formatDate(item.releasedDate)})
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              सक्रिय (Currently Active)
                            </span>
                          )}

                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                            कारण: {item.reasonForChange.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>तारीख:</strong> {formatDate(item.assignedDate)}{' '}
                            {item.releasedDate ? `से ${formatDate(item.releasedDate)} तक` : 'से अब तक'}
                          </span>
                          {item.officerName && (
                            <span>
                              <strong>नामित अफ़सर:</strong> {item.officerName}
                            </span>
                          )}
                          {item.driverName && (
                            <span>
                              <strong>ड्राइवर:</strong> {item.driverName}
                            </span>
                          )}
                        </div>

                        {item.replacementVehicleNumber && (
                          <div className="mt-1 bg-amber-50 text-amber-900 p-2 rounded text-xs border border-amber-100 flex items-center gap-2">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>
                              <strong>किसकी जगह / नयी गाड़ी:</strong> {item.replacementVehicleNumber} (
                              {item.replacementVehicleModel || 'Standby Vehicle'})
                            </span>
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs text-[var(--color-muted)] italic bg-slate-50 p-2 rounded">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DRIVER REPLACEMENT HISTORY */}
          {activeTab === 'driver_replacement' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50/70 p-4 rounded-xl border border-teal-200/80">
                <div>
                  <h3 className="font-bold text-[var(--color-ink)] text-sm flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-700" />
                    <span>ड्राइवर बदलाव टाइमलाइन (Kaun Kab Hata, Kaun Laga)</span>
                  </h3>
                  <p className="text-xs text-teal-800 mt-0.5">
                    छुट्टी, शिकायत या शिफ्ट बदलाव के कारण ड्राइवरों की तैनाती का संपूर्ण रिकॉर्ड
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReplaceDrvVehId(tenderVehicles[0]?.id || '');
                    setActiveActionModal('replace_driver');
                  }}
                  className="px-3.5 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नया ड्राइवर बदलें</span>
                </button>
              </div>

              {tenderDriverHistory.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">
                    इस टेंडर में अभी तक कोई ड्राइवर बदलाव दर्ज नहीं है।
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenderDriverHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs hover:border-teal-300 transition-all space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{item.driverName}</span>
                          <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {item.vehicleNumber}
                          </span>
                          <span className="text-xs text-slate-600">अधिकारी: {item.officerName}</span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.releasedDate
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.releasedDate
                            ? `हटाया गया (${formatDate(item.releasedDate)})`
                            : 'वर्तमान में तैनात'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                        <span>
                          <strong>तारीख:</strong> {formatDate(item.assignedDate)}{' '}
                          {item.releasedDate ? `से ${formatDate(item.releasedDate)}` : 'से अब तक'}
                        </span>
                        <span className="uppercase text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">
                          कारण: {item.reasonForChange.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-[var(--color-muted)] italic bg-slate-50 p-2 rounded">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DAILY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Duty Slips &amp; Daily Logs ({tenderLogs.length} Entries)
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    अधिकारियों द्वारा हस्ताक्षरित दैनिक ड्यूटी पर्चियां
                  </p>
                </div>

                <button
                  onClick={() => {
                    handleLogVehChange(tenderVehicles[0]?.id || '');
                    setActiveActionModal('add_log');
                  }}
                  className="px-3.5 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नया ड्यूटी लॉग जोड़ें</span>
                </button>
              </div>

              {tenderLogs.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">कोई ड्यूटी पर्ची दर्ज नहीं है।</p>
                  <button
                    onClick={() => setActiveActionModal('add_log')}
                    className="mt-3 px-4 py-2 bg-[var(--color-ink)] text-white rounded-lg text-xs font-bold"
                  >
                    + ड्यूटी लॉग जोड़ें
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3">तारीख / पर्ची #</th>
                          <th className="p-3">गाड़ी व ड्राइवर</th>
                          <th className="p-3">अधिकारी / प्रयोजन</th>
                          <th className="p-3">मीटर (Open - Close)</th>
                          <th className="p-3">कुल KM</th>
                          <th className="p-3">समय / टोल</th>
                          <th className="p-3 text-center">सत्यापन</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tenderLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50">
                            <td className="p-3">
                              <span className="font-semibold text-slate-900 block">
                                {formatDate(log.date)}
                              </span>
                              <span className="font-mono text-[10px] text-[var(--color-muted)]">
                                {log.slipNumber}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className="font-mono font-bold text-slate-900 block">
                                {log.vehicleNumber}
                              </span>
                              <span className="text-[var(--color-muted)]">{log.driverName}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-medium text-slate-800 block">
                                {log.officerName}
                              </span>
                              <span className="text-[11px] text-[var(--color-muted)] line-clamp-1">
                                {log.purpose}
                              </span>
                            </td>
                            <td className="p-3 font-mono">
                              {log.openingKm} &rarr; {log.closingKm}
                            </td>
                            <td className="p-3 font-bold text-[var(--color-copper)]">
                              {log.totalKm} KM
                            </td>
                            <td className="p-3">
                              <span className="block text-slate-600">{log.totalHours} Hrs</span>
                              {log.tollParkingCost > 0 && (
                                <span className="text-emerald-700 font-medium">
                                  ₹{log.tollParkingCost} Toll
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => onToggleLogVerified(log.id)}
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold cursor-pointer ${
                                  log.isVerifiedByOfficer
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {log.isVerifiedByOfficer ? '✓ Signed' : 'Pending'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Monthly Govt Invoices for {tender.departmentName}
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    स्वीकृत बिल, एक्स्ट्रा KM व भुगतान स्थिति
                  </p>
                </div>

                <button
                  onClick={() => setActiveActionModal('add_bill')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नया मासिक बिल जनरेट करें</span>
                </button>
              </div>

              {tenderBills.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">कोई बिल नहीं मिला।</p>
                  <button
                    onClick={() => setActiveActionModal('add_bill')}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                  >
                    + बिल बनाएं
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tenderBills.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {b.billNumber}
                          </span>
                          <p className="text-xs text-[var(--color-muted)]">Month: {b.monthYear}</p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            b.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.paymentStatus}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Vehicle:</span>
                          <span className="font-bold text-slate-800">{b.vehicleNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">Total Run:</span>
                          <span className="font-semibold text-slate-700">
                            {b.totalKmsRun} KM (Quota: {b.allowedKms} KM)
                          </span>
                        </div>
                        {b.extraKms > 0 && (
                          <div className="flex justify-between text-[var(--color-copper)] font-semibold">
                            <span>Extra KM Amount:</span>
                            <span>+{formatCurrency(b.extraKmAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm">
                          <span>Net Payable:</span>
                          <span className="text-emerald-700">
                            {formatCurrency(b.netPayableAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: FUEL & EXPENSES */}
          {activeTab === 'fuel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Fuel &amp; Operating Expenses</h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    इस टेंडर की गाडियों का ईंधन ख़र्च व रसीदें
                  </p>
                </div>
                <button
                  onClick={() => setActiveActionModal('add_fuel')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ ईंधन पर्ची जोड़ें</span>
                </button>
              </div>

              {tenderFuel.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">कोई ईंधन रिकॉर्ड नहीं है।</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3">तारीख</th>
                        <th className="p-3">गाड़ी व ड्राइवर</th>
                        <th className="p-3">मात्रा व दर</th>
                        <th className="p-3">कुल राशि</th>
                        <th className="p-3">पेट्रोल पंप व रसीद #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tenderFuel.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">{formatDate(f.date)}</td>
                          <td className="p-3">
                            <span className="font-mono font-bold block">{f.vehicleNumber}</span>
                            <span className="text-[var(--color-muted)]">{f.driverName}</span>
                          </td>
                          <td className="p-3">
                            {f.liters} Ltr @ ₹{f.ratePerLiter}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            {formatCurrency(f.totalAmount)}
                          </td>
                          <td className="p-3 text-[var(--color-muted)]">
                            {f.fuelStation} ({f.receiptNumber})
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: OFFICERS */}
          {activeTab === 'officers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Designated Officers ({tenderOfficers.length} Officers)
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    इस अनुबंध के तहत कैब सुविधा प्राप्त करने वाले सरकारी अधिकारी
                  </p>
                </div>
                <button
                  onClick={() => setActiveActionModal('add_officer')}
                  className="px-3.5 py-2 bg-[var(--color-ink)] hover:bg-[var(--color-ink-soft)] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नया अधिकारी जोड़ें</span>
                </button>
              </div>

              {tenderOfficers.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-semibold text-slate-700">कोई अधिकारी नामांकित नहीं है।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tenderOfficers.map((off) => {
                    const assignedVeh = vehicles.find((v) => v.id === off.assignedVehicleId);
                    return (
                      <div
                        key={off.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-sm text-slate-900">{off.name}</h4>
                            <p className="text-xs text-[var(--color-copper)] font-semibold">
                              {off.designation}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-[var(--color-muted)]">{off.officeAddress}</p>

                        <div className="bg-slate-50 p-2 rounded text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[var(--color-muted)]">Mobile:</span>
                            <span className="font-semibold text-slate-800">{off.mobile}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--color-muted)]">Assigned Vehicle:</span>
                            <span className="font-mono font-bold text-[var(--color-copper)]">
                              {assignedVeh?.vehicleNumber || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: TERMS */}
          {activeTab === 'terms' && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Contract Clauses &amp; SLA Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[var(--color-muted)] block text-[11px]">Monthly Quota</span>
                  <span className="text-sm font-bold text-slate-900">
                    {tender.includedKms} KM &bull; {tender.includedHours} Hours
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[var(--color-muted)] block text-[11px]">Extra Rate</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{tender.extraKmRate}/KM &bull; ₹{tender.extraHourRate}/Hr
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <span className="text-[var(--color-muted)] block text-[11px]">Night Halt DA</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{tender.nightHaltRate} / Night
                  </span>
                </div>
              </div>

              {tender.penaltyClauses && (
                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-900 border border-amber-200">
                  <strong>Penalty / SLA Clauses:</strong> {tender.penaltyClauses}
                </div>
              )}

              {tender.emdDetails && (
                <div className="p-3 bg-teal-50 rounded-lg text-xs text-teal-900 border border-teal-200">
                  <strong>EMD / Bank Guarantee:</strong> {tender.emdDetails}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-[var(--color-muted)]">
          <span>
            {tenderVehicles.length} Vehicles &bull; {tenderOfficers.length} Officers &bull;{' '}
            {tenderLogs.length} Logs recorded
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--color-sand-deep)] hover:bg-[var(--color-sand)] text-[var(--color-ink)] rounded-lg font-semibold"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>

      {/* POPUP ACTION MODAL: Add Officer */}
      {activeActionModal === 'add_officer' && (
        <form onSubmit={handleSaveOfficerSubmit}>
          <ActionModalShell
            title="अधिकारी जोड़ें (Add Officer)"
            subtitle={tender.departmentName}
            kickerIcon={<Users className="h-3.5 w-3.5" />}
            kickerLabel="Officer"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  अधिकारी सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>अधिकारी का नाम (Officer Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Sudhir Sharma"
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className={actionFieldClass}
                />
              </div>
              <div>
                <label className={actionLabelClass}>पदनाम (Designation)</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Engineer (Inspection)"
                  value={officerForm.designation}
                  onChange={(e) => setOfficerForm({ ...officerForm, designation: e.target.value })}
                  className={actionFieldClass}
                />
              </div>
              <div>
                <label className={actionLabelClass}>मोबाइल नंबर (Mobile) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9415012345"
                  value={officerForm.mobile}
                  onChange={(e) => setOfficerForm({ ...officerForm, mobile: e.target.value })}
                  className={actionFieldClass}
                />
              </div>
              <div>
                <label className={actionLabelClass}>गाड़ी असाइन करें (Optional)</label>
                <select
                  value={officerForm.assignedVehicleId || ''}
                  onChange={(e) => setOfficerForm({ ...officerForm, assignedVehicleId: e.target.value })}
                  className={actionSelectClass}
                >
                  <option value="">अभी कोई गाड़ी नहीं</option>
                  {tenderVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Add Vehicle */}
      {activeActionModal === 'add_vehicle' && (
        <form onSubmit={handleSaveVehicleSubmit}>
          <ActionModalShell
            title="गाड़ी तैनात / अटैच करें"
            subtitle={tender.departmentName}
            kickerIcon={<Car className="h-3.5 w-3.5" />}
            kickerLabel="Vehicle"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  गाड़ी सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>गाड़ी नंबर (Registration #) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP32 AB 1234"
                  value={vehicleForm.vehicleNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, vehicleNumber: e.target.value })}
                  className={`${actionFieldClass} uppercase`}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>मॉडल (Make &amp; Model)</label>
                  <input
                    type="text"
                    value={vehicleForm.makeModel}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, makeModel: e.target.value })}
                    className={actionFieldClass}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>गाड़ी का स्वामित्व (Ownership Type)</label>
                  <select
                    value={vehicleForm.ownershipType}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, ownershipType: e.target.value as any })}
                    className={actionSelectClass}
                  >
                    <option value="Company Owned">कंपनी की अपनी गाड़ी (Company Owned)</option>
                    <option value="Attached / Market Hire">वेंडर/मार्केट अटैच गाड़ी (Attached)</option>
                    <option value="Owner-Driver">मालिक-चालक गाड़ी (Owner-Driver)</option>
                  </select>
                </div>
              </div>

              {vehicleForm.ownershipType === 'Attached / Market Hire' && (
                <div>
                  <label className={actionLabelClass}>अटैच वेंडर चुनें</label>
                  <select
                    value={vehicleForm.vendorId || ''}
                    onChange={(e) => {
                      const sel = vendors.find((vnd) => vnd.id === e.target.value);
                      setVehicleForm({
                        ...vehicleForm,
                        vendorId: sel?.id,
                        vendorName: sel?.name,
                        monthlyVendorRent: sel?.monthlyAgreedRatePerVehicle || 31000,
                      });
                    }}
                    className={actionSelectClass}
                  >
                    <option value="">वेंडर चुनें...</option>
                    {vendors.map((vnd) => (
                      <option key={vnd.id} value={vnd.id}>
                        {vnd.name} (Rent: ₹{vnd.monthlyAgreedRatePerVehicle}/mo)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={actionLabelClass}>अधिकारी को असाइन करें (Optional)</label>
                <select
                  value={vehicleForm.assignedOfficerId || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, assignedOfficerId: e.target.value })}
                  className={actionSelectClass}
                >
                  <option value="">कोई अधिकारी नहीं</option>
                  {tenderOfficers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={actionLabelClass}>चालक नियुक्त करें (Assign Driver)</label>
                <select
                  value={vehicleForm.currentDriverId || ''}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, currentDriverId: e.target.value })}
                  className={actionSelectClass}
                >
                  <option value="">बाद में नियुक्त करें</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.phone} ({d.status === 'active' ? 'Available' : d.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Add Driver */}
      {activeActionModal === 'add_driver' && (
        <form onSubmit={handleSaveDriverSubmit}>
          <ActionModalShell
            title="नया चालक दर्ज करें (Register Driver)"
            subtitle="फ्लीट के लिए नया ड्राइवर पंजीकृत करें"
            kickerIcon={<UserCheck className="h-3.5 w-3.5" />}
            kickerLabel="Driver"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  चालक सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>चालक का नाम (Driver Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={driverForm.name}
                  onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                  className={actionFieldClass}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>फ़ोन (Phone) *</label>
                  <input
                    type="text"
                    required
                    placeholder="9839012345"
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className={actionFieldClass}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>मासिक वेतन (Monthly Salary ₹)</label>
                  <input
                    type="number"
                    value={driverForm.monthlySalary}
                    onChange={(e) => setDriverForm({ ...driverForm, monthlySalary: Number(e.target.value) })}
                    className={actionFieldClass}
                  />
                </div>
              </div>
              <div>
                <label className={actionLabelClass}>ड्राइविंग लाइसेंस नंबर</label>
                <input
                  type="text"
                  placeholder="UP32-2024-001928"
                  value={driverForm.licenseNumber}
                  onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                  className={`${actionFieldClass} uppercase`}
                />
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Replace Vehicle ("Kaun si gadi kab hati, kiski lagi") */}
      {activeActionModal === 'replace_vehicle' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-4 text-white sm:px-5">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="page-kicker !text-teal-300">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Vehicle swap
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  गाड़ी बदलें (Kaun si Gadi Kab Hati, Kiski Lagi)
                </h3>
                <p className="mt-1 text-[11px] text-white/65">
                  {tender.departmentName} में पुरानी गाड़ी को रिलीज़ करके नई गाड़ी तैनात करें
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleReplaceVehicleSubmit}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-sand)]/50 p-4 text-xs sm:p-5"
            >
              <div className="panel panel-pad space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--color-ink)]">
                    1. कौन सी गाड़ी हटानी है (Vehicle to Remove) *
                  </label>
                  <select
                    required
                    value={replaceVehOldId}
                    onChange={(e) => setReplaceVehOldId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                  >
                    {tenderVehicles.map((v) => {
                      const off = officers.find(
                        (o) => o.assignedVehicleId === v.id || o.id === v.assignedOfficerId
                      );
                      return (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.makeModel}) • अफ़सर: {off?.name || 'Unassigned'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2 rounded-xl border border-teal-200/70 bg-teal-50/50 p-3">
                  <label className="block text-xs font-bold text-teal-950">
                    2. नई गाड़ी कैसे लगानी है (Replacement Vehicle Source):
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-1.5 font-medium text-teal-900">
                      <input
                        type="radio"
                        name="vehSource"
                        checked={replaceVehSource === 'new_attached'}
                        onChange={() => setReplaceVehSource('new_attached')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>नई / वेंडर अटैच गाड़ी दर्ज करें</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 font-medium text-teal-900">
                      <input
                        type="radio"
                        name="vehSource"
                        checked={replaceVehSource === 'existing_fleet'}
                        onChange={() => setReplaceVehSource('existing_fleet')}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span>मौजूदा खाली फ़्लीट में से चुनें</span>
                    </label>
                  </div>

                  {replaceVehSource === 'new_attached' ? (
                    <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block font-semibold text-[var(--color-ink)]">नई गाड़ी नंबर *</label>
                        <input
                          type="text"
                          required
                          placeholder="UP32 CD 9988"
                          value={replaceVehNewNumber}
                          onChange={(e) => setReplaceVehNewNumber(e.target.value)}
                          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block font-semibold text-[var(--color-ink)]">मॉडल (Make &amp; Model)</label>
                        <input
                          type="text"
                          placeholder="Maruti Suzuki Dzire ZXi"
                          value={replaceVehNewModel}
                          onChange={(e) => setReplaceVehNewModel(e.target.value)}
                          className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <label className="mb-1 block font-semibold text-[var(--color-ink)]">खाली गाड़ी चुनें</label>
                      <select
                        value={replaceVehNewId}
                        onChange={(e) => setReplaceVehNewId(e.target.value)}
                        className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                      >
                        <option value="">खाली गाड़ी चुनें...</option>
                        {vehicles
                          .filter((v) => v.id !== replaceVehOldId)
                          .slice(0, 40)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.vehicleNumber} ({v.makeModel} • {v.ownershipType})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">
                      गाड़ी हटने/बदलने की तारीख *
                    </label>
                    <input
                      type="date"
                      required
                      value={replaceVehDate}
                      onChange={(e) => setReplaceVehDate(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">
                      बदलाव का कारण (Reason) *
                    </label>
                    <select
                      value={replaceVehReason}
                      onChange={(e) => setReplaceVehReason(e.target.value as any)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    >
                      <option value="breakdown_maintenance">खराबी / गैराज सर्विस (Breakdown)</option>
                      <option value="officer_request">अधिकारी के अनुरोध पर (Officer Request)</option>
                      <option value="accident">दुर्घटना / डेंटिंग पेंटिंग (Accident)</option>
                      <option value="fitness_rc_expiry">फ़िटनेस / आरसी समाप्ति (RTO Expiry)</option>
                      <option value="temporary_substitute">अस्थायी वैकल्पिक गाड़ी (Standby)</option>
                      <option value="contract_upgrade">कॉन्ट्रैक्ट अपग्रेड (SUV Deployment)</option>
                      <option value="vendor_fleet_rotation">वेंडर फ़्लीट रोटेशन</option>
                      <option value="other">अन्य कारण (Other)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[var(--color-ink)]">
                    रिमार्क्स व हैंडओवर नोट्स
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AC failure; sent to workshop, standby Dzire deployed"
                    value={replaceVehNotes}
                    onChange={(e) => setReplaceVehNotes(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>

                <label className="flex cursor-pointer items-center gap-2 pt-1 font-semibold text-[var(--color-ink)]">
                  <input
                    type="checkbox"
                    checked={replaceVehTransferOfficerAndDriver}
                    onChange={(e) => setReplaceVehTransferOfficerAndDriver(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>अधिकारी व वर्तमान ड्राइवर को नई गाड़ी में ऑटो-ट्रांसफर करें</span>
                </label>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-line)] pt-3">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="btn btn-secondary"
                >
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  गाड़ी बदलाव सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP ACTION MODAL: Replace Driver */}
      {activeActionModal === 'replace_driver' && (
        <form onSubmit={handleReplaceDriverSubmit}>
          <ActionModalShell
            title="ड्राइवर बदलें (Kaun Kab Hata, Kaun Laga)"
            subtitle="गाड़ी पर नया चालक तैनात करें"
            kickerIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
            kickerLabel="Driver swap"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  ड्राइवर बदलाव सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>गाड़ी चुनें *</label>
                <select
                  required
                  value={replaceDrvVehId}
                  onChange={(e) => setReplaceDrvVehId(e.target.value)}
                  className={actionSelectClass}
                >
                  {tenderVehicles.map((v) => {
                    const drv = getAssignedDriverForVehicle(v, drivers, officers);
                    return (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} (वर्तमान ड्राइवर: {drv?.name || 'Unassigned'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className={actionLabelClass}>नया ड्राइवर चुनें *</label>
                <select
                  required
                  value={replaceDrvNewId}
                  onChange={(e) => setReplaceDrvNewId(e.target.value)}
                  className={actionSelectClass}
                >
                  <option value="">नया ड्राइवर चुनें...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.phone} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>बदलाव की तारीख</label>
                  <input
                    type="date"
                    value={replaceDrvDate}
                    onChange={(e) => setReplaceDrvDate(e.target.value)}
                    className={actionFieldClass}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>कारण (Reason)</label>
                  <select
                    value={replaceDrvReason}
                    onChange={(e) => setReplaceDrvReason(e.target.value as any)}
                    className={actionSelectClass}
                  >
                    <option value="officer_request">Officer Request (अधिकारी की मांग)</option>
                    <option value="leave">Leave / Vacation (छुट्टी पर गया)</option>
                    <option value="performance">Performance / Feedback</option>
                    <option value="routine_shift">Routine Shift Change</option>
                    <option value="resigned">Resigned / Left Job</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={actionLabelClass}>रिमार्क्स</label>
                <input
                  type="text"
                  placeholder="e.g. Officer requested early morning duty driver"
                  value={replaceDrvNotes}
                  onChange={(e) => setReplaceDrvNotes(e.target.value)}
                  className={actionFieldClass}
                />
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Add Duty Log */}
      {activeActionModal === 'add_log' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-3 backdrop-blur-xs sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-4 text-white sm:px-5">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="page-kicker !text-teal-300">
                    <FileText className="h-3.5 w-3.5" />
                    Duty log
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  दैनिक ड्यूटी लॉग पर्ची जोड़ें
                </h3>
                <p className="mt-1 truncate text-[11px] text-white/65">{tender.departmentName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleAddLogSubmit}
              className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-sand)]/50 p-4 text-xs sm:p-5"
            >
              <div className="panel panel-pad space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">गाड़ी चुनें *</label>
                    <select
                      required
                      value={logVehId}
                      onChange={(e) => handleLogVehChange(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 font-semibold text-[var(--color-ink)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 sm:text-sm"
                    >
                      {tenderVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.makeModel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">ड्यूटी तारीख</label>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl border border-teal-200/70 bg-teal-50/50 p-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-teal-950">शुरुआती किमी (Opening KM) *</label>
                    <input
                      type="number"
                      required
                      value={logOpeningKm}
                      onChange={(e) => setLogOpeningKm(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-semibold text-teal-950">अंतिम किमी (Closing KM) *</label>
                    <input
                      type="number"
                      required
                      value={logClosingKm}
                      onChange={(e) => setLogClosingKm(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">शुरुआती समय (Opening Time)</label>
                    <input
                      type="time"
                      value={logOpenTime}
                      onChange={(e) => setLogOpenTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">समाप्ति समय (Closing Time)</label>
                    <input
                      type="time"
                      value={logCloseTime}
                      onChange={(e) => setLogCloseTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">ड्यूटी पर्ची / Duty Slip #</label>
                    <input
                      type="text"
                      value={logSlipNumber}
                      onChange={(e) => setLogSlipNumber(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-semibold text-[var(--color-ink)]">टोल / पार्किंग ख़र्च (₹)</label>
                    <input
                      type="number"
                      value={logToll}
                      onChange={(e) => setLogToll(Number(e.target.value))}
                      className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-[var(--color-ink)]">मार्ग व प्रयोजन (Route / Purpose)</label>
                  <input
                    type="text"
                    value={logPurpose}
                    onChange={(e) => setLogPurpose(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-3 py-2 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-line)] pt-3">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="btn btn-secondary"
                >
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  Duty Slip सुरक्षित करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP ACTION MODAL: Add Fuel */}
      {activeActionModal === 'add_fuel' && (
        <form onSubmit={handleAddFuelSubmit}>
          <ActionModalShell
            title="ईंधन पर्ची दर्ज करें"
            subtitle={tender.departmentName}
            kickerIcon={<Fuel className="h-3.5 w-3.5" />}
            kickerLabel="Fuel slip"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  ईंधन एंट्री सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>गाड़ी चुनें *</label>
                <select
                  value={fuelVehId}
                  onChange={(e) => setFuelVehId(e.target.value)}
                  className={`${actionSelectClass} font-semibold`}
                >
                  {tenderVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>लीटर (Liters) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(Number(e.target.value))}
                    className={`${actionFieldClass} font-bold`}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>दर प्रति लीटर (₹) *</label>
                  <input
                    type="number"
                    value={fuelRate}
                    onChange={(e) => setFuelRate(Number(e.target.value))}
                    className={`${actionFieldClass} font-bold`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>ओडोमीटर KM</label>
                  <input
                    type="number"
                    value={fuelOdo}
                    onChange={(e) => setFuelOdo(Number(e.target.value))}
                    className={`${actionFieldClass} font-mono`}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>रसीद / पर्ची #</label>
                  <input
                    type="text"
                    value={fuelReceipt}
                    onChange={(e) => setFuelReceipt(e.target.value)}
                    className={`${actionFieldClass} font-mono uppercase`}
                  />
                </div>
              </div>

              <div>
                <label className={actionLabelClass}>पेट्रोल पंप का नाम</label>
                <input
                  type="text"
                  value={fuelStation}
                  onChange={(e) => setFuelStation(e.target.value)}
                  className={actionFieldClass}
                />
              </div>

              <div className="rounded-xl border border-teal-200/70 bg-teal-50/60 p-2.5 text-center text-sm font-bold text-teal-900">
                कुल राशि: {formatCurrency(fuelLiters * fuelRate)}
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Create Monthly Bill */}
      {activeActionModal === 'add_bill' && (
        <form onSubmit={handleCreateBillSubmit}>
          <ActionModalShell
            title="सरकारी मासिक बिल जनरेट करें"
            subtitle={tender.departmentName}
            kickerIcon={<Receipt className="h-3.5 w-3.5" />}
            kickerLabel="Govt bill"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  बिल जनरेट करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>गाड़ी चुनें *</label>
                  <select
                    value={billVehId}
                    onChange={(e) => setBillVehId(e.target.value)}
                    className={actionSelectClass}
                  >
                    {tenderVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={actionLabelClass}>बिल महीना (YYYY-MM)</label>
                  <input
                    type="month"
                    value={billMonth}
                    onChange={(e) => setBillMonth(e.target.value)}
                    className={`${actionFieldClass} font-semibold`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>कुल चली KM (Total KMs)</label>
                  <input
                    type="number"
                    value={billTotalKm}
                    onChange={(e) => setBillTotalKm(Number(e.target.value))}
                    className={`${actionFieldClass} font-mono font-bold`}
                  />
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Included Quota: {tender.includedKms} KM
                  </span>
                </div>
                <div>
                  <label className={actionLabelClass}>कुल घंटे (Total Hours)</label>
                  <input
                    type="number"
                    value={billTotalHrs}
                    onChange={(e) => setBillTotalHrs(Number(e.target.value))}
                    className={`${actionFieldClass} font-mono font-bold`}
                  />
                  <span className="text-[10px] text-[var(--color-muted)]">
                    Included Quota: {tender.includedHours} Hrs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>टोल व पार्किंग (₹)</label>
                  <input
                    type="number"
                    value={billToll}
                    onChange={(e) => setBillToll(Number(e.target.value))}
                    className={actionFieldClass}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>नाइट हाल्ट (संख्या)</label>
                  <input
                    type="number"
                    value={billNightHalts}
                    onChange={(e) => setBillNightHalts(Number(e.target.value))}
                    className={actionFieldClass}
                  />
                </div>
              </div>

              <div className="space-y-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-3 text-[11px]">
                <div className="flex justify-between text-[var(--color-ink)]">
                  <span>Base Rate:</span>
                  <span>{formatCurrency(tender.baseMonthlyRate)}</span>
                </div>
                {billTotalKm > tender.includedKms && (
                  <div className="flex justify-between font-semibold text-teal-700">
                    <span>
                      Extra KM ({billTotalKm - tender.includedKms} KM @ ₹{tender.extraKmRate}):
                    </span>
                    <span>
                      +{formatCurrency((billTotalKm - tender.includedKms) * tender.extraKmRate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* POPUP ACTION MODAL: Add Payment */}
      {activeActionModal === 'add_payment' && (
        <form onSubmit={handleAddPaymentSubmit}>
          <ActionModalShell
            title="ड्राइवर एडवांस / भुगतान दर्ज करें"
            subtitle="Petty advance & driver payment"
            kickerIcon={<CreditCard className="h-3.5 w-3.5" />}
            kickerLabel="Payment"
            onClose={() => setActiveActionModal(null)}
            footer={
              <>
                <button type="button" onClick={() => setActiveActionModal(null)} className="btn btn-secondary">
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  भुगतान सुरक्षित करें
                </button>
              </>
            }
          >
            <div className="panel panel-pad space-y-3">
              <div>
                <label className={actionLabelClass}>ड्राइवर चुनें *</label>
                <select
                  value={payDriverId}
                  onChange={(e) => setPayDriverId(e.target.value)}
                  className={actionSelectClass}
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={actionLabelClass}>राशि (Amount ₹) *</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className={`${actionFieldClass} font-bold`}
                  />
                </div>
                <div>
                  <label className={actionLabelClass}>माध्यम (Mode)</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as any)}
                    className={actionSelectClass}
                  >
                    <option value="cash">Cash (नक़द)</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="bank_transfer">Bank Transfer (NEFT)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={actionLabelClass}>विवरण (Description)</label>
                <input
                  type="text"
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className={actionFieldClass}
                />
              </div>
            </div>
          </ActionModalShell>
        </form>
      )}

      {/* MODAL: OFFICER TRANSFER & VEHICLE HALT / REASSIGNMENT */}
      {activeActionModal === 'transfer_officer' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-4">
          <div className="my-6 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-4 text-white sm:px-5">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="page-kicker !text-teal-300">
                    <Building2 className="h-3.5 w-3.5" />
                    Officer transfer
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  अधिकारी तबादला व गाड़ी स्थिति प्रबंधन
                </h3>
                <p className="mt-1 text-[11px] text-white/65">
                  Officer Transfer &amp; Vehicle Halt / Reassignment Handover
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleTransferOfficerSubmit}
              className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-[var(--color-sand)]/50 p-4 text-xs sm:p-5"
            >
              {/* Select Vehicle */}
              <div>
                <label className={actionLabelClass}>
                  गाड़ी व वर्तमान अधिकारी चुनें (Vehicle &amp; Current Officer) *
                </label>
                <select
                  value={transferVehId}
                  onChange={(e) => setTransferVehId(e.target.value)}
                  className={actionSelectClass}
                  required
                >
                  {tenderVehicles.map((v) => {
                    const off = officers.find(
                      (o) => o.assignedVehicleId === v.id || o.id === v.assignedOfficerId
                    );
                    return (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel}) &mdash;{' '}
                        {off ? `${off.name} [${off.designation}]` : 'अधिकारी: रिक्त'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Action on Vehicle */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-900">
                  अधिकारी तबादला होने पर गाड़ी का क्या करना है? (Action on Vehicle) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                      transferAction === 'halt_car_post_vacant'
                        ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="transferAction"
                        checked={transferAction === 'halt_car_post_vacant'}
                        onChange={() => setTransferAction('halt_car_post_vacant')}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-xs text-rose-800">
                          🛑 पद रिक्त - गाड़ी बंद करें (Halted)
                        </span>
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          अधिकारी चला गया। जब तक नया अधिकारी नहीं आता, तब तक गाड़ी चलना बंद रहेगी।
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                      transferAction === 'reassign_new_officer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="transferAction"
                        checked={transferAction === 'reassign_new_officer'}
                        onChange={() => setTransferAction('reassign_new_officer')}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-xs text-emerald-800">
                          🔄 नए अधिकारी को चार्ज दें
                        </span>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          नया अधिकारी आ गया है। गाड़ी निर्बाध चलेगी और नए अधिकारी के नाम ट्रांसफर होगी।
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 border rounded-xl flex flex-col justify-between cursor-pointer transition-all ${
                      transferAction === 'surrender_vehicle'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="transferAction"
                        checked={transferAction === 'surrender_vehicle'}
                        onChange={() => setTransferAction('surrender_vehicle')}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-xs text-amber-900">
                          📦 अस्थायी सरेंडर
                        </span>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          विभाग को पत्र देकर गाड़ी अस्थायी रूप से सरेंडर कर दी गई।
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3 transition-all ${
                      transferAction === 'move_to_pool'
                        ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-xs'
                        : 'border-[var(--color-line)] hover:bg-[var(--color-surface-muted)]'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="transferAction"
                        checked={transferAction === 'move_to_pool'}
                        onChange={() => setTransferAction('move_to_pool')}
                        className="mt-0.5 text-teal-600"
                      />
                      <div>
                        <span className="block text-xs font-bold text-teal-800">
                          स्टैंडबाय पूल में रखें
                        </span>
                        <p className="mt-0.5 text-[11px] text-teal-700">
                          गाड़ी को जनरल पूल में रखकर आवश्यकतानुसार अन्य अफ़सरों को दी जाएगी।
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* If New Officer Reassignment */}
              {transferAction === 'reassign_new_officer' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-xs">
                      नवीन पदभार ग्रहणकर्ता अधिकारी विवरण
                    </span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="newOfficerSource"
                          checked={newOfficerSource === 'new'}
                          onChange={() => setNewOfficerSource('new')}
                        />
                        <span>नया अधिकारी दर्ज करें</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="newOfficerSource"
                          checked={newOfficerSource === 'existing'}
                          onChange={() => setNewOfficerSource('existing')}
                        />
                        <span>मौजूदा में से चुनें</span>
                      </label>
                    </div>
                  </div>

                  {newOfficerSource === 'existing' ? (
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        मौजूदा अधिकारी चुनें
                      </label>
                      <select
                        value={selectedExistingOfficerId}
                        onChange={(e) => setSelectedExistingOfficerId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white font-medium"
                      >
                        <option value="">-- अधिकारी चुनें --</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} &bull; {o.designation} ({o.department})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          अधिकारी का नाम (Full Name) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Er. Manoj Kumar Verma"
                          value={newOffName}
                          onChange={(e) => setNewOffName(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          required={transferAction === 'reassign_new_officer'}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          पदनाम (Designation) *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Executive Engineer / ADM"
                          value={newOffDesignation}
                          onChange={(e) => setNewOffDesignation(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          मोबाइल नंबर *
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 94150XXXXX"
                          value={newOffMobile}
                          onChange={(e) => setNewOffMobile(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                          required={transferAction === 'reassign_new_officer'}
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1 text-slate-700">
                          विभाग / कार्यालय
                        </label>
                        <input
                          type="text"
                          value={newOffDept}
                          onChange={(e) => setNewOffDept(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* If Halted: Driver Handling */}
              {transferAction === 'halt_car_post_vacant' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                  <span className="font-bold text-amber-900 block text-xs">
                    गाड़ी बंद होने पर ड्राइवर की स्थिति (Driver Status)
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="transferDriverAction"
                        checked={transferDriverAction === 'keep_on_vehicle'}
                        onChange={() => setTransferDriverAction('keep_on_vehicle')}
                      />
                      <span>ड्राइवर को गाड़ी के साथ रखें (हाजिरी/सैलरी जारी)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="transferDriverAction"
                        checked={transferDriverAction === 'free_to_pool'}
                        onChange={() => setTransferDriverAction('free_to_pool')}
                      />
                      <span>ड्राइवर को फ्री करके ड्राइवर पूल में भेजें</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Date & Order Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    कार्यमुक्ति / प्रभावी तारीख (Effective Date) *
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700">
                    कारण (Reason for Change/Halt) *
                  </label>
                  <select
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="routine_transfer">सामान्य स्थानांतरण (Routine Transfer)</option>
                    <option value="promotion_transfer">पदोन्नति उपरांत स्थानांतरण (Promotion Transfer)</option>
                    <option value="retirement">सेवानिवृत्ति (Retirement)</option>
                    <option value="relieved_transferred">कार्यमुक्त होकर अन्यत्र तैनाती (Relieved)</option>
                    <option value="post_vacant_car_stopped">पद रिक्त - गाड़ी बंद (Post Vacant)</option>
                    <option value="department_reallocation">विभाग आंतरिक पुनरावंटन (Reallocation)</option>
                    <option value="temporary_charge">अस्थायी प्रभार (Temporary Charge)</option>
                    <option value="vehicle_surrendered">वाहन समर्पण (Surrender)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  शासनादेश / स्थानांतरण कार्यालय आदेश संख्या (Transfer GO / Office Order Ref)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PWD/GO/2026/TRF-8104 या कार्यालय आदेश संख्या..."
                  value={transferOrderNo}
                  onChange={(e) => setTransferOrderNo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  हैंडओवर व शासकीय टिप्पणी (Handover Remarks &amp; Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. अधिकारी का तबादला वाराणसी परिक्षेत्र होने के कारण वाहन नवीन अधिकारी की पदस्थापना तक बंद रहेगा..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-line)] pt-3">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="btn btn-secondary"
                >
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  कार्रवाई सुरक्षित करें (Save Transfer)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REACTIVATE IDLE VEHICLE (REASSIGN TO INCOMING OFFICER) */}
      {activeActionModal === 'reactivate_vehicle' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-4">
          <div className="my-6 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-4 text-white sm:px-5">
              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="page-kicker !text-teal-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Reactivate
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold tracking-tight">
                  रुकी हुई गाड़ी पुनः शुरू करें
                </h3>
                <p className="mt-1 text-[11px] text-white/65">
                  Reactivate Idle Vehicle &amp; Assign Incoming Officer
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="rounded-lg bg-white/10 p-1.5 text-white/55 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleReactivateSubmit}
              className="min-h-0 flex-1 space-y-3.5 overflow-y-auto bg-[var(--color-sand)]/50 p-4 text-xs sm:p-5"
            >
              <div>
                <label className={actionLabelClass}>
                  गाड़ी चुनें (Select Idle Vehicle) *
                </label>
                <select
                  value={reactivateVehId}
                  onChange={(e) => setReactivateVehId(e.target.value)}
                  className={actionSelectClass}
                  required
                >
                  <option value="">-- गाड़ी चुनें --</option>
                  {tenderVehicles
                    .filter((v) => v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary' || v.status === 'idle')
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel}) &mdash;{' '}
                        {v.idleSinceDate ? `रुकी तिथि: ${formatDate(v.idleSinceDate)}` : 'Idle'}
                      </option>
                    ))}
                  {tenderVehicles.map((v) => (
                    <option key={`all-${v.id}`} value={v.id}>
                      [सभी सूची] {v.vehicleNumber} ({v.makeModel})
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Incoming Officer */}
              <div className="space-y-2.5 rounded-xl border border-teal-200/70 bg-teal-50/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-teal-900">
                    नया कार्यभार ग्रहणकर्ता अधिकारी
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="reactivateOfficerSource"
                        checked={reactivateOfficerSource === 'new'}
                        onChange={() => setReactivateOfficerSource('new')}
                      />
                      <span>नया अधिकारी दर्ज करें</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="reactivateOfficerSource"
                        checked={reactivateOfficerSource === 'existing'}
                        onChange={() => setReactivateOfficerSource('existing')}
                      />
                      <span>मौजूदा में से चुनें</span>
                    </label>
                  </div>
                </div>

                {reactivateOfficerSource === 'existing' ? (
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">
                      मौजूदा अधिकारी चुनें
                    </label>
                    <select
                      value={reactivateExistingOffId}
                      onChange={(e) => setReactivateExistingOffId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="">-- अधिकारी चुनें --</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} &bull; {o.designation} ({o.department})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold mb-1 text-slate-700">
                        अधिकारी का नाम (Full Name) *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Er. Anand Kumar Mishra"
                        value={reactivateOffName}
                        onChange={(e) => setReactivateOffName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        required={reactivateOfficerSource === 'new'}
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        पदनाम (Designation)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chief Engineer / SE"
                        value={reactivateOffDesig}
                        onChange={(e) => setReactivateOffDesig(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700">
                        मोबाइल नंबर *
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. 94150XXXXX"
                        value={reactivateOffMobile}
                        onChange={(e) => setReactivateOffMobile(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                        required={reactivateOfficerSource === 'new'}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  गाड़ी पुनः शुरू होने की तारीख (Resumption Date) *
                </label>
                <input
                  type="date"
                  value={reactivateDate}
                  onChange={(e) => setReactivateDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">
                  कार्यालय टिप्पणी / शासनादेश संदर्भ
                </label>
                <input
                  type="text"
                  value={reactivateNotes}
                  onChange={(e) => setReactivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-line)] pt-3">
                <button
                  type="button"
                  onClick={() => setActiveActionModal(null)}
                  className="btn btn-secondary"
                >
                  रद्द करें (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle className="h-4 w-4" />
                  गाड़ी पुनः चालू करें (Activate Vehicle)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified In-Place Driver Hisab, Payment & Leave Modal */}
      {hisabModalConfig?.isOpen && (
        <DriverHisabAndLeaveModal
          isOpen={hisabModalConfig.isOpen}
          onClose={() => setHisabModalConfig(null)}
          initialTab={hisabModalConfig.initialTab}
          preSelectedVehicleId={hisabModalConfig.vehicleId}
          preSelectedOfficerId={hisabModalConfig.officerId}
          preSelectedTenderId={tender.id}
          preSelectedDriverId={hisabModalConfig.driverId}
          tenders={[tender]}
          vehicles={vehicles}
          officers={officers}
          drivers={drivers}
          khataTransactions={khataTransactions}
          driverLeaves={driverLeaves}
          dailyPayments={dailyPayments}
          currentUser={currentUser}
          onAddTransaction={onAddTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onAddDailyPayment={onAddDailyPayment}
          onAddDriverLeave={onAddDriverLeave}
          onDeleteDriverLeave={onDeleteDriverLeave}
        />
      )}
    </div>
  );
};
