import React, { useState } from 'react';
import {
  Car,
  UserCheck,
  History,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  Shield,
  Phone,
  Building2,
  Calendar,
  Fuel,
  FileCheck,
  Wrench,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  FileText,
  UserX,
  PlayCircle,
  PauseCircle,
  AlertCircle,
  Info,
  IndianRupee,
  FileSpreadsheet,
  Briefcase,
  Download,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import {
  Vehicle,
  Officer,
  Driver,
  Vendor,
  Tender,
  DriverAllocationHistory,
  VehicleAllocationHistory,
  OfficerAllocationHistory,
  ReplacementReason,
  VehicleReplacementReason,
  OfficerTransferReason,
  DriverKhataTransaction,
  DriverLeaveRecord,
  DailyPaymentEntry,
  StaffUser,
} from '../types';
import { formatDate, getDaysDiff, formatCurrency, getAssignedDriverForVehicle } from '../utils/calculations';
import { downloadOfficerExcelTemplate, downloadVehicleExcelTemplate } from '../utils/excelTemplateHelper';
import {
  generateOfficerUniqueId,
  getOfficerDisplayCode,
  getDriverDisplayCode,
} from '../utils/idGenerator';
import { DocumentManagerModal } from './DocumentManagerModal';
import { FleetVehicleOnboardingModal, OnboardingType } from './FleetVehicleOnboardingModal';
import { BulkImportModal, BulkImportType } from './BulkImportModal';
import { DriverHisabAndLeaveModal } from './DriverHisabAndLeaveModal';

interface VehiclesOfficersViewProps {
  vehicles: Vehicle[];
  officers: Officer[];
  drivers: Driver[];
  tenders: Tender[];
  allocationHistory: DriverAllocationHistory[];
  vehicleAllocationHistory?: VehicleAllocationHistory[];
  officerAllocationHistory?: OfficerAllocationHistory[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onSaveOfficer: (officer: Officer) => void;
  onReplaceDriver: (
    vehicleId: string,
    newDriverId: string,
    reason: ReplacementReason,
    effectiveDate: string,
    notes: string
  ) => void;
  onReplaceVehicle?: (
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
  khataTransactions?: DriverKhataTransaction[];
  driverLeaves?: DriverLeaveRecord[];
  dailyPayments?: DailyPaymentEntry[];
  currentUser?: StaffUser;
  vendors?: Vendor[];
  onSaveVendor?: (vendor: Vendor) => void;
  onSaveDriver?: (driver: Driver) => void;
  onBulkImportVehicles?: (vehicles: Vehicle[], vendors?: Vendor[]) => void;
  onBulkImportDrivers?: (drivers: Driver[]) => void;
  onBulkImportOfficers?: (officers: Officer[]) => void;
  onAddTransaction?: (tx: DriverKhataTransaction) => void;
  onDeleteTransaction?: (txId: string) => void;
  onAddDailyPayment?: (entry: DailyPaymentEntry) => void;
  onAddDriverLeave?: (leave: DriverLeaveRecord) => void;
  onDeleteDriverLeave?: (leaveId: string) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

export const VehiclesOfficersView: React.FC<VehiclesOfficersViewProps> = ({
  vehicles,
  officers,
  drivers,
  tenders,
  allocationHistory,
  vehicleAllocationHistory = [],
  officerAllocationHistory = [],
  khataTransactions = [],
  driverLeaves = [],
  dailyPayments = [],
  currentUser,
  vendors = [],
  onSaveVehicle,
  onSaveOfficer,
  onSaveDriver,
  onSaveVendor,
  onBulkImportVehicles = () => {},
  onBulkImportDrivers = () => {},
  onBulkImportOfficers = () => {},
  onReplaceDriver,
  onReplaceVehicle = () => {},
  onTransferOrRelieveOfficer = () => {},
  onReactivateIdleVehicle = () => {},
  onAddTransaction = () => {},
  onDeleteTransaction = () => {},
  onAddDailyPayment = () => {},
  onAddDriverLeave = () => {},
  onDeleteDriverLeave = () => {},
  onOpenProfileModal,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'history' | 'vehicle_history' | 'officer_history'>('roster');
  const [selectedVehicleForHistory, setSelectedVehicleForHistory] = useState<string>('all');
  const [selectedVehicleForOfficerHistory, setSelectedVehicleForOfficerHistory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contextual Driver Hisab & Leave Modal State
  const [hisabModalConfig, setHisabModalConfig] = useState<{
    isOpen: boolean;
    initialTab: 'payments' | 'leaves' | 'monthly_hisab';
    vehicleId?: string;
    officerId?: string;
    tenderId?: string;
    driverId?: string;
  } | null>(null);
  const [selectedTenderFilter, setSelectedTenderFilter] = useState<string>('all');
  const [selectedFuelFilter, setSelectedFuelFilter] = useState<string>('all');
  const [ownershipFilter, setOwnershipFilter] = useState<string>('all');
  const [expiryFilter, setExpiryFilter] = useState<string>('all');
  const [operationalStatusFilter, setOperationalStatusFilter] = useState<string>('all');
  const [selectedVehicleForAssetModal, setSelectedVehicleForAssetModal] = useState<Vehicle | null>(null);
  const [selectedVehicleForDocs, setSelectedVehicleForDocs] = useState<Vehicle | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Officer Transfer & Vehicle Halt Modal State
  const [isOfficerTransferModalOpen, setIsOfficerTransferModalOpen] = useState(false);
  const [selectedVehicleForTransfer, setSelectedVehicleForTransfer] = useState<Vehicle | null>(null);
  const [transferAction, setTransferAction] = useState<'halt_car_post_vacant' | 'reassign_new_officer' | 'surrender_vehicle' | 'move_to_pool'>('halt_car_post_vacant');
  const [transferEffectiveDate, setTransferEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [transferReason, setTransferReason] = useState<OfficerTransferReason>('post_vacant_car_stopped');
  const [transferOrderNumber, setTransferOrderNumber] = useState<string>(`GOVT/PWD/2026/TRF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferDriverAction, setTransferDriverAction] = useState<'keep_on_vehicle' | 'free_to_pool' | 'driver_on_leave'>('keep_on_vehicle');
  const [newOfficerSource, setNewOfficerSource] = useState<'new' | 'existing'>('new');
  const [selectedExistingOfficerId, setSelectedExistingOfficerId] = useState<string>('');
  const [newOffName, setNewOffName] = useState<string>('');
  const [newOffDesignation, setNewOffDesignation] = useState<string>('');
  const [newOffMobile, setNewOffMobile] = useState<string>('');
  const [newOffDept, setNewOffDept] = useState<string>('');

  // Reactivate Halted Vehicle Modal State
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [selectedVehicleForReactivate, setSelectedVehicleForReactivate] = useState<Vehicle | null>(null);
  const [reactivateDate, setReactivateDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reactivateOfficerSource, setReactivateOfficerSource] = useState<'new' | 'existing'>('new');
  const [reactivateExistingOffId, setReactivateExistingOffId] = useState<string>('');
  const [reactivateOffName, setReactivateOffName] = useState<string>('');
  const [reactivateOffDesignation, setReactivateOffDesignation] = useState<string>('');
  const [reactivateOffMobile, setReactivateOffMobile] = useState<string>('');
  const [reactivateOffDept, setReactivateOffDept] = useState<string>('');
  const [reactivateNotes, setReactivateNotes] = useState<string>('');

  // Replace Driver Modal State
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replaceVehicleId, setReplaceVehicleId] = useState<string>('');
  const [newDriverId, setNewDriverId] = useState<string>('');
  const [driverModalSearch, setDriverModalSearch] = useState<string>('');
  const [replaceReason, setReplaceReason] = useState<ReplacementReason>('officer_request');
  const [replaceEffectiveDate, setReplaceEffectiveDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [replaceNotes, setReplaceNotes] = useState<string>('');

  // Add / Edit Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleFormData, setVehicleFormData] = useState<Partial<Vehicle>>({});

  // Smart Fleet Onboarding Modal (Owner-Driver, Car Owner Only, Company Vehicle)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardingInitialType, setOnboardingInitialType] = useState<OnboardingType>('owner_driver');

  // Excel Bulk Import Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkModalInitialType, setBulkModalInitialType] = useState<BulkImportType>('vehicles');

  // Manual Add Officer Modal State
  const [isAddOfficerModalOpen, setIsAddOfficerModalOpen] = useState(false);
  const [officerFormData, setOfficerFormData] = useState<Partial<Officer>>({
    officerCode: '',
    name: '',
    designation: '',
    department: '',
    officeAddress: '',
    mobile: '',
    alternatePhone: '',
    email: '',
    tenderId: '',
    assignedVehicleId: '',
    reportingTime: '09:30 AM',
    specialInstructions: '',
  });

  const handleOpenAddOfficerModal = (preselectedVehicleId?: string) => {
    const autoCode = generateOfficerUniqueId(officers);
    const defaultTender = tenders[0]?.id || '';
    setOfficerFormData({
      officerCode: autoCode,
      name: '',
      designation: '',
      department: tenders[0]?.departmentName || 'Public Works Department (PWD)',
      officeAddress: tenders[0]?.authorityOffice || 'Nirman Bhawan',
      mobile: '',
      alternatePhone: '',
      email: '',
      tenderId: defaultTender,
      assignedVehicleId: preselectedVehicleId || '',
      reportingTime: '09:30 AM',
      specialInstructions: '',
    });
    setIsAddOfficerModalOpen(true);
  };

  const handleSaveOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerFormData.name || !officerFormData.mobile) {
      alert('अधिकारी का नाम और मोबाइल नंबर आवश्यक है (Officer name and mobile are required).');
      return;
    }

    const finalCode = officerFormData.officerCode?.trim().toUpperCase() || generateOfficerUniqueId(officers);
    const newOff: Officer = {
      id: finalCode,
      officerCode: finalCode,
      name: officerFormData.name.trim(),
      designation: officerFormData.designation?.trim() || 'Officer',
      department: officerFormData.department?.trim() || tenders[0]?.departmentName || 'Government Department',
      officeAddress: officerFormData.officeAddress?.trim() || 'Government Office',
      mobile: officerFormData.mobile.trim(),
      alternatePhone: officerFormData.alternatePhone?.trim() || undefined,
      email: officerFormData.email?.trim() || undefined,
      tenderId: officerFormData.tenderId || tenders[0]?.id || '',
      assignedVehicleId: officerFormData.assignedVehicleId || undefined,
      reportingTime: officerFormData.reportingTime || '09:30 AM',
      status: 'active',
      specialInstructions: officerFormData.specialInstructions?.trim() || undefined,
    };

    onSaveOfficer(newOff);

    // If an assigned vehicle was selected, link it
    if (newOff.assignedVehicleId) {
      const targetVeh = vehicles.find((v) => v.id === newOff.assignedVehicleId);
      if (targetVeh) {
        onSaveVehicle({
          ...targetVeh,
          assignedOfficerId: newOff.id,
          status: targetVeh.status === 'idle_officer_transferred' ? 'active' : targetVeh.status,
        });
      }
    }

    setIsAddOfficerModalOpen(false);
  };

  const handleOpenOnboardingModal = (type: OnboardingType = 'owner_driver') => {
    setOnboardingInitialType(type);
    setIsOnboardingModalOpen(true);
  };

  const handleOpenBulkModal = (type: BulkImportType = 'vehicles') => {
    setBulkModalInitialType(type);
    setIsBulkModalOpen(true);
  };

  // Helper check for servicing due
  const checkServiceDue = (v: Vehicle) => {
    if (v.nextServiceDueKm && v.currentOdometer) {
      if (v.nextServiceDueKm - v.currentOdometer <= 1000) return true;
    }
    if (v.nextServiceDueDate) {
      const diff = getDaysDiff(v.nextServiceDueDate);
      if (diff <= 15) return true;
    }
    return false;
  };

  // Filtered vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const off = officers.find((o) => o.id === v.assignedOfficerId);
    const drv = drivers.find((d) => d.id === v.currentDriverId);
    const tender = tenders.find((t) => t.id === v.tenderId);

    const matchesTender = selectedTenderFilter === 'all' || v.tenderId === selectedTenderFilter;
    const matchesFuel = selectedFuelFilter === 'all' || v.fuelPolicy === selectedFuelFilter;
    const matchesOwnership = ownershipFilter === 'all' || v.ownershipType === ownershipFilter;

    // Document compliance / expiries match
    let matchesExpiry = true;
    const fitDiff = v.rtoFitnessExpiry ? getDaysDiff(v.rtoFitnessExpiry) : 999;
    const insDiff = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : 999;
    const pucDiff = v.pucExpiry ? getDaysDiff(v.pucExpiry) : 999;
    const isServicingDue = checkServiceDue(v);

    if (expiryFilter === 'expiring_30') {
      matchesExpiry = (insDiff >= 0 && insDiff <= 30) || (pucDiff >= 0 && pucDiff <= 30) || (fitDiff >= 0 && fitDiff <= 30);
    } else if (expiryFilter === 'expired') {
      matchesExpiry = insDiff < 0 || pucDiff < 0 || fitDiff < 0;
    } else if (expiryFilter === 'service_due') {
      matchesExpiry = isServicingDue;
    }

    let matchesStatus = true;
    if (operationalStatusFilter === 'active') {
      matchesStatus = !v.status || v.status === 'active' || v.status === 'in_service';
    } else if (operationalStatusFilter === 'idle_officer_transferred') {
      matchesStatus = v.status === 'idle_officer_transferred';
    } else if (operationalStatusFilter === 'surrendered_or_standby') {
      matchesStatus = v.status === 'surrendered_temporary' || v.status === 'standby_pool';
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      v.vehicleNumber.toLowerCase().includes(q) ||
      v.makeModel.toLowerCase().includes(q) ||
      (v.chassisNumber && v.chassisNumber.toLowerCase().includes(q)) ||
      (v.insurancePolicyNo && v.insurancePolicyNo.toLowerCase().includes(q)) ||
      (off && off.name.toLowerCase().includes(q)) ||
      (drv && drv.name.toLowerCase().includes(q)) ||
      (tender && tender.departmentName.toLowerCase().includes(q));

    return matchesTender && matchesFuel && matchesOwnership && matchesExpiry && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredVehicles.length / pageSize) || 1;
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpenTransferModal = (v: Vehicle) => {
    setSelectedVehicleForTransfer(v);
    setTransferAction('halt_car_post_vacant');
    setTransferEffectiveDate(new Date().toISOString().slice(0, 10));
    setTransferReason('post_vacant_car_stopped');
    setTransferOrderNumber(`GOVT/PWD/2026/TRF-${Math.floor(1000 + Math.random() * 9000)}`);
    setTransferNotes('');
    setTransferDriverAction('keep_on_vehicle');
    setNewOfficerSource('new');
    setSelectedExistingOfficerId('');
    setNewOffName('');
    setNewOffDesignation('');
    setNewOffMobile('');
    const tender = tenders.find((t) => t.id === v.tenderId);
    setNewOffDept(tender?.departmentName || '');
    setIsOfficerTransferModalOpen(true);
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForTransfer) return;

    let newOffData = undefined;
    if (transferAction === 'reassign_new_officer') {
      if (newOfficerSource === 'existing') {
        const existingOff = officers.find((o) => o.id === selectedExistingOfficerId);
        if (!existingOff) {
          alert('कृपया मौजूदा अधिकारी का चयन करें।');
          return;
        }
        newOffData = {
          id: existingOff.id,
          name: existingOff.name,
          designation: existingOff.designation,
          department: existingOff.department,
          mobile: existingOff.mobile,
          reportingTime: existingOff.reportingTime,
        };
      } else {
        if (!newOffName || !newOffDesignation) {
          alert('नवीन अधिकारी का नाम व पदनाम आवश्यक है।');
          return;
        }
        newOffData = {
          name: newOffName.trim(),
          designation: newOffDesignation.trim(),
          department: newOffDept.trim(),
          mobile: newOffMobile.trim(),
          reportingTime: '09:30 AM',
        };
      }
    }

    onTransferOrRelieveOfficer(
      selectedVehicleForTransfer.id,
      transferAction,
      transferEffectiveDate,
      transferReason,
      transferOrderNumber,
      transferNotes,
      newOffData,
      transferDriverAction
    );

    setIsOfficerTransferModalOpen(false);
    setSelectedVehicleForTransfer(null);
  };

  const handleOpenReactivateModal = (v: Vehicle) => {
    setSelectedVehicleForReactivate(v);
    setReactivateDate(new Date().toISOString().slice(0, 10));
    setReactivateOfficerSource('new');
    setReactivateExistingOffId('');
    setReactivateOffName('');
    setReactivateOffDesignation('');
    setReactivateOffMobile('');
    const tender = tenders.find((t) => t.id === v.tenderId);
    setReactivateOffDept(tender?.departmentName || '');
    setReactivateNotes('');
    setIsReactivateModalOpen(true);
  };

  const handleSubmitReactivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForReactivate) return;

    if (reactivateOfficerSource === 'existing') {
      if (!reactivateExistingOffId) {
        alert('कृपया अधिकारी का चयन करें।');
        return;
      }
      onReactivateIdleVehicle(
        selectedVehicleForReactivate.id,
        reactivateExistingOffId,
        reactivateDate,
        reactivateNotes
      );
    } else {
      if (!reactivateOffName || !reactivateOffDesignation) {
        alert('नवीन पदभार ग्रहण करने वाले अधिकारी का नाम व पदनाम अनिवार्य है।');
        return;
      }
      onReactivateIdleVehicle(
        selectedVehicleForReactivate.id,
        {
          name: reactivateOffName.trim(),
          designation: reactivateOffDesignation.trim(),
          department: reactivateOffDept.trim(),
          mobile: reactivateOffMobile.trim(),
        },
        reactivateDate,
        reactivateNotes
      );
    }

    setIsReactivateModalOpen(false);
    setSelectedVehicleForReactivate(null);
  };

  const handleOpenReplaceModal = (vId: string) => {
    setReplaceVehicleId(vId);
    setNewDriverId('');
    setDriverModalSearch('');
    setReplaceReason('officer_request');
    setReplaceEffectiveDate(new Date().toISOString().slice(0, 10));
    setReplaceNotes('');
    setIsReplaceModalOpen(true);
  };

  const handleConfirmReplacement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceVehicleId || !newDriverId) {
      alert('Please select a driver.');
      return;
    }
    onReplaceDriver(
      replaceVehicleId,
      newDriverId,
      replaceReason,
      replaceEffectiveDate,
      replaceNotes
    );
    setIsReplaceModalOpen(false);
  };

  const handleOpenAddVehicle = () => {
    setVehicleFormData({
      id: `veh-${Date.now()}`,
      vehicleNumber: '',
      makeModel: '',
      vehicleType: 'Sedan',
      fuelType: 'Diesel',
      color: 'White',
      modelYear: 2024,
      ownershipType: 'Company Owned',
      tenderId: tenders[0]?.id || '',
      currentOdometer: 10000,
      rtoFitnessExpiry: '',
      insuranceExpiry: '',
      pucExpiry: '',
      roadTaxExpiry: '',
      permitExpiry: '',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFixedFuelAmount: 12000,
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleFormData.vehicleNumber || !vehicleFormData.makeModel) {
      alert('Vehicle Number and Model are required.');
      return;
    }
    onSaveVehicle(vehicleFormData as Vehicle);
    setIsVehicleModalOpen(false);
  };

  const filteredHistory =
    selectedVehicleForHistory === 'all'
      ? allocationHistory
      : allocationHistory.filter((h) => h.vehicleId === selectedVehicleForHistory);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-600" />
            <span>Vehicles &amp; Officers &bull; गाड़ी व अधिकारी अलॉटमेंट</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            किस अधिकारी के साथ कौन सी गाड़ी चल रही है, कौन सा ड्राइवर लगा है व कब-कब बदला गया
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('roster')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'roster'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Roster (वर्तमान अलॉटमेंट)
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>ड्राइवर बदलाव ({allocationHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('vehicle_history')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'vehicle_history'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>गाड़ी कब हटी किसकी लगी ({vehicleAllocationHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('officer_history')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'officer_history'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              <span>अधिकारी तबादला व गाड़ी बंद ({officerAllocationHistory.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenOnboardingModal('owner_driver')}
              className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="मालिक-चालक: गाड़ी भी अपनी और खुद ही चलाएगा"
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>+ मालिक-चालक जोड़ें</span>
            </button>

            <button
              onClick={() => handleOpenOnboardingModal('car_owner')}
              className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="केवल गाड़ी मालिक: गाड़ी वेंडर की, ड्राइवर अलग रहेगा"
            >
              <Car className="w-4 h-4 text-indigo-200" />
              <span>+ केवल गाड़ी मालिक जोड़ें</span>
            </button>

            <button
              onClick={() => handleOpenOnboardingModal('company_vehicle')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="कंपनी की खुद की गाड़ी जोड़ें"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>+ कंपनी गाड़ी</span>
            </button>

            {/* Direct Add Officer Modal */}
            <button
              onClick={() => handleOpenAddOfficerModal()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="सरकारी अधिकारी का विवरण मैन्युअली जोड़ें"
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>+ नया अधिकारी</span>
            </button>

            {/* Officer Excel Template Download */}
            <button
              onClick={downloadOfficerExcelTemplate}
              className="px-2.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="सरकारी अधिकारियों की एक्सेल शीट (.xlsx) डाउनलोड करें"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>अधिकारी शीट (.xlsx)</span>
            </button>

            <button
              onClick={() => handleOpenBulkModal('officers')}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="सरकारी अधिकारियों की एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके जोड़ें"
            >
              <Briefcase className="w-4 h-4 text-amber-100" />
              <span>+ अधिकारी एक्सेल बल्क</span>
            </button>

            <button
              onClick={() => handleOpenBulkModal('vehicles')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके एक साथ दर्जनों गाड़ियाँ व ड्राइवर जोड़ें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>📥 एक्सेल बल्क अपलोड</span>
            </button>

            {onOpenProfileModal && (
              <button
                type="button"
                onClick={() => onOpenProfileModal('driver')}
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                title="चालक, वेंडर, अधिकारी व गाड़ी प्रोफाइल सीधे एडिट व प्रबंधित करें (Manage / Edit Profiles)"
              >
                <Edit2 className="w-4 h-4 text-indigo-200" />
                <span>👤 प्रोफाइल एडिट / प्रबंधन</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'roster' && (
        <>
          {/* Quick Bilingual Guidance Banner for Owner-Driver vs Attached Car Owner */}
          <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0 text-sm">
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <span>केस A: ड्राइवर खुद अपनी गाड़ी चलाएगा (Owner-Driver)</span>
                  </h4>
                  <button
                    onClick={() => handleOpenOnboardingModal('owner_driver')}
                    className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-0.5 rounded shadow-2xs transition-colors"
                  >
                    + अभी जोड़ें
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  अगर कोई ड्राइवर अपनी खुद की गाड़ी लेकर आया है और वह <strong>खुद ही गाड़ी चलाएगा</strong>, तो <strong>मालिक-चालक</strong> जोड़ें। इससे ड्राइवर, गाड़ी व वेंडर तीनों 1-क्लिक में एक साथ लिंक हो जाएंगे और 1% TDS या 194C(6) छूट लागू होगी।
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shrink-0 text-sm">
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-indigo-400 flex items-center gap-1.5">
                    <span>केस B: केवल गाड़ी मालिक (Vehicle Owner Only)</span>
                  </h4>
                  <button
                    onClick={() => handleOpenOnboardingModal('car_owner')}
                    className="text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded shadow-2xs transition-colors"
                  >
                    + अभी जोड़ें
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  अगर किसी बंदे की केवल गाड़ी अटैच हो रही है और वह <strong>खुद गाड़ी नहीं चलाएगा</strong>, तो <strong>केवल गाड़ी मालिक</strong> जोड़ें। वेंडर के खाते में तयशुदा मासिक किराया जाएगा और गाड़ी पर कोई अन्य ड्राइवर तैनात रहेगा।
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Import Quick Banner Strip */}
          <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>सरकारी अधिकारी, गाड़ियाँ या ड्राइवर थोक में जोड़ने हैं?</strong> हमारी एक्सेल शीट डाउनलोड करें, डेटा भरें और 1-क्लिक में अपलोड करें।
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={downloadOfficerExcelTemplate}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                title="अधिकारी एक्सेल टेम्पलेट (.xlsx) डाउनलोड करें"
              >
                <Download className="w-3 h-3" />
                <span>अधिकारी शीट (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenBulkModal('officers')}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
              >
                <span>📥 एक्सेल बल्क अपलोड सेंटर</span>
              </button>
            </div>
          </div>
          {/* Company Fleet & Compliance Summary Cards */}
          {(() => {
            const companyVehicles = vehicles.filter((v) => v.ownershipType === 'Company Owned');
            const totalCompanyValuation = companyVehicles.reduce((sum, v) => sum + (v.purchaseCost || 0), 0);
            const haltedVehicles = vehicles.filter(
              (v) => v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary'
            );
            const insAlertCount = vehicles.filter((v) => {
              const diff = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : 999;
              return diff <= 30;
            }).length;
            const pucAlertCount = vehicles.filter((v) => {
              const diff = v.pucExpiry ? getDaysDiff(v.pucExpiry) : 999;
              return diff <= 30;
            }).length;
            const serviceDueCount = vehicles.filter((v) => checkServiceDue(v)).length;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                    Company Owned Fleet
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {companyVehicles.length} Cars
                    </span>
                    <span className="text-[11px] text-indigo-600 font-semibold">Self-Owned</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Asset Val: <strong>{formatCurrency(totalCompanyValuation || 250000000)}</strong>
                  </p>
                </div>

                <div
                  onClick={() => {
                    setOperationalStatusFilter(
                      operationalStatusFilter === 'idle_officer_transferred' ? 'all' : 'idle_officer_transferred'
                    );
                    setCurrentPage(1);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all shadow-xs ${
                    haltedVehicles.length > 0
                      ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-200 hover:bg-rose-100/70'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <span className="text-rose-700 text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1">
                    <UserX className="w-3 h-3 text-rose-600" />
                    गाड़ी बंद / तबादला
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-rose-800 font-mono">
                      {haltedVehicles.length} Cars
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-rose-200 text-rose-900 rounded">
                      {haltedVehicles.length > 0 ? 'Halted / Idle' : 'Zero Halted'}
                    </span>
                  </div>
                  <p className="text-[10px] text-rose-700 mt-1">
                    अधिकारी तबादला उपरांत खड़ी
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                    Insurance Renewals
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-amber-700 font-mono">
                      {insAlertCount} Cars
                    </span>
                    <span className={`text-[10px] font-semibold ${insAlertCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {insAlertCount > 0 ? 'Due < 30 Days' : 'All Valid'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    United India / ICICI
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                    PUC Pollution Expiries
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-rose-700 font-mono">
                      {pucAlertCount} Cars
                    </span>
                    <span className={`text-[10px] font-semibold ${pucAlertCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {pucAlertCount > 0 ? 'Action Needed' : 'Valid'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Online RTO Parivahan
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                    Servicing Schedule Due
                  </span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-purple-700 font-mono">
                      {serviceDueCount} Cars
                    </span>
                    <span className="text-[10px] text-purple-600 font-semibold">Maintenance</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 truncate">
                    Due in &le; 1,000 KM
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Search, Ownership, Tender & Compliance Filter Controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              <div className="lg:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Search Vehicle, Officer, Driver, or Policy No:
                </label>
                <input
                  type="text"
                  placeholder="e.g. UP32, UP78, Innova, Dzire, Alok, Sharma, MA3EYD..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  गाड़ी स्थिति (Status):
                </label>
                <select
                  value={operationalStatusFilter}
                  onChange={(e) => {
                    setOperationalStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Fleet Status</option>
                  <option value="active">सक्रिय गाड़ियां (Active Running)</option>
                  <option value="idle_officer_transferred">🛑 गाड़ी बंद (Officer Transferred)</option>
                  <option value="surrendered_or_standby">⏸️ सरेंडर / स्टैंडबाय (Surrendered/Pool)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ownership Model:
                </label>
                <select
                  value={ownershipFilter}
                  onChange={(e) => {
                    setOwnershipFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Fleet ({vehicles.length})</option>
                  <option value="Company Owned">Company Owned (खुद की गाड़ियां)</option>
                  <option value="Attached / Market Hire">Vendor Attached (अटैच)</option>
                  <option value="Owner-Driver">Driver-cum-Owner (DCO)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expiries &amp; Servicing:
                </label>
                <select
                  value={expiryFilter}
                  onChange={(e) => {
                    setExpiryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Documents Status</option>
                  <option value="expiring_30">Expiring in &le; 30 Days (चेतावनी)</option>
                  <option value="expired">Expired / Overdue (समाप्त)</option>
                  <option value="service_due">Servicing Due (&le; 1000 KM)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tender / Dept:
                </label>
                <select
                  value={selectedTenderFilter}
                  onChange={(e) => {
                    setSelectedTenderFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="all">All Tenders ({tenders.length})</option>
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.departmentName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2.5">
              <span>
                Found <strong>{filteredVehicles.length}</strong> vehicles matching filters (Total fleet: {vehicles.length})
              </span>
              {(searchQuery || selectedTenderFilter !== 'all' || selectedFuelFilter !== 'all' || ownershipFilter !== 'all' || expiryFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTenderFilter('all');
                    setSelectedFuelFilter('all');
                    setOwnershipFilter('all');
                    setExpiryFilter('all');
                    setCurrentPage(1);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  Reset All Filters &times;
                </button>
              )}
            </div>
          </div>

          {/* Live Vehicles and Officers Roster Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedVehicles.map((v) => {
            const off = officers.find((o) => o.id === v.assignedOfficerId);
            const drv = getAssignedDriverForVehicle(v, drivers, officers);
            const tender = tenders.find((t) => t.id === v.tenderId);

            // Document Expiries status
            const fitDiff = v.rtoFitnessExpiry ? getDaysDiff(v.rtoFitnessExpiry) : null;
            const insDiff = v.insuranceExpiry ? getDaysDiff(v.insuranceExpiry) : null;
            const pucDiff = v.pucExpiry ? getDaysDiff(v.pucExpiry) : null;

            return (
              <div
                key={v.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  {/* Vehicle Halted / Officer Transferred Warning Alert */}
                  {(v.status === 'idle_officer_transferred' || v.status === 'surrendered_temporary' || v.status === 'standby_pool') && (
                    <div className="mb-3.5 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="font-bold text-xs flex items-center gap-1.5 text-rose-800">
                          <PauseCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            🛑 गाड़ी चलना बंद &bull; {v.status === 'idle_officer_transferred' ? 'अधिकारी तबादला (पद रिक्त)' : v.status === 'surrendered_temporary' ? 'अस्थायी सरेंडर' : 'स्टैंडबाय पूल'}
                          </span>
                        </span>
                        <button
                          onClick={() => handleOpenReactivateModal(v)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] shadow-2xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          गाड़ी पुनः चालू करें
                        </button>
                      </div>
                      <div className="mt-2 text-[11px] text-rose-800 space-y-0.5 border-t border-rose-200/60 pt-1.5">
                        <div className="flex flex-wrap gap-x-3">
                          <span><strong>बंद तिथि:</strong> {v.idleSinceDate ? formatDate(v.idleSinceDate) : 'लागू'}</span>
                          {v.transferOrderRef && <span><strong>आदेश क्र.:</strong> {v.transferOrderRef}</span>}
                        </div>
                        <div className="text-[10px] text-rose-700 italic">
                          कारण: {v.idleReason || 'अधिकारी तबादला उपरांत नवीन तैनाती तक गाड़ी खड़ी।'}
                        </div>
                        <div className="text-[10px] font-semibold text-rose-900 bg-rose-100/80 p-1.5 rounded mt-1">
                          ⚠️ सरकारी बिलिंग सूचना: यदि गाड़ी माह के कुछ दिन या पूरा माह बंद रही, तो बिल बनाते समय प्रो-राटा कटौती या टेंडर नियम अनुसार बिल तैयार करें।
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Bar: Reg No & Model */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                          {v.vehicleNumber}
                        </span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                          👨‍✈️ चालक: {drv?.name || v.driverName || 'अनावंटित'}
                          {onOpenProfileModal && (drv?.id || v.driverName) && (
                            <button
                              type="button"
                              onClick={() => onOpenProfileModal('driver', drv?.id)}
                              className="ml-1 hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-200/60 transition-colors cursor-pointer"
                              title="चालक प्रोफ़ाइल एडिट करें"
                            >
                              <Edit2 className="w-3 h-3 text-emerald-700" />
                            </button>
                          )}
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {v.ownershipType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium mt-1">
                        {v.makeModel} &bull; {v.vehicleType} ({v.modelYear})
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-500 block">
                        Odo: {v.currentOdometer.toLocaleString()} KM
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold uppercase">
                        {v.fuelType}
                      </span>
                    </div>
                  </div>

                  {/* Tender & Department Tag */}
                  <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      Tender / Work Order
                    </div>
                    <div className="font-semibold text-slate-900">
                      {tender?.departmentName || 'Not Assigned'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {tender?.authorityOffice} &bull; {tender?.tenderNumber}
                    </div>
                  </div>

                  {/* Assigned Officer Block */}
                  <div className={`mt-3 p-3 rounded-lg border ${
                    v.status === 'idle_officer_transferred'
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-indigo-100 bg-indigo-50/40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-indigo-800 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Assigned Govt Officer (संबंधित अधिकारी)
                      </span>
                      <div className="flex items-center gap-1.5">
                        {off && (
                          <span className="text-[10px] text-slate-500">
                            Rep: {off.reportingTime}
                          </span>
                        )}
                        <button
                          onClick={() => handleOpenTransferModal(v)}
                          className="text-[10px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1 transition-colors"
                          title="अधिकारी तबादला या गाड़ी बंद दर्ज करें"
                        >
                          <UserX className="w-3 h-3" />
                          तबादला / गाड़ी बंद
                        </button>
                      </div>
                    </div>
                    {off ? (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900">{off.name}</span>
                          <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded">
                            {getOfficerDisplayCode(off)}
                          </span>
                          {onOpenProfileModal && (
                            <button
                              type="button"
                              onClick={() => onOpenProfileModal('officer', off.id)}
                              className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 hover:underline cursor-pointer"
                              title="अधिकारी प्रोफ़ाइल एडिट करें"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                              <span>एडिट प्रोफाइल</span>
                            </button>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">{off.designation}</div>
                        <div className="text-[11px] text-slate-500">{off.officeAddress}</div>
                        <div className="text-xs font-semibold text-indigo-700 pt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{off.mobile}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-600 font-medium mt-1.5 flex items-center justify-between">
                        <span>⚠️ पद रिक्त - कोई अधिकारी सम्बद्ध नहीं (गाड़ी बंद)</span>
                        <button
                          onClick={() => handleOpenReactivateModal(v)}
                          className="text-[11px] underline font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          + नया अधिकारी जोड़ें
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Current Driver Block with Change Button */}
                  <div className="mt-3 p-3 rounded-lg border border-slate-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-600 flex items-center gap-1">
                        Current Driver (वर्तमान चालक)
                      </span>
                      <button
                        onClick={() => handleOpenReplaceModal(v.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        Swap / Replace Driver
                      </button>
                    </div>

                    {drv ? (
                      <div className="mt-1.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900">{drv.name}</span>
                              <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                {getDriverDisplayCode(drv)}
                              </span>
                              {onOpenProfileModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenProfileModal('driver', drv.id)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 hover:underline cursor-pointer"
                                  title="चालक प्रोफ़ाइल एडिट करें"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                  <span>एडिट प्रोफाइल</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Mobile: {drv.phone} &bull; License: {drv.licenseNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Monthly Salary: {formatCurrency(drv.monthlySalary)} &bull; DA: ₹{drv.dailyDaRate}/night
                            </div>
                          </div>
                        </div>

                        {/* Direct In-Place Contextual Driver Hisab & Leave Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              setHisabModalConfig({
                                isOpen: true,
                                initialTab: 'payments',
                                vehicleId: v.id,
                                officerId: off?.id,
                                tenderId: v.tenderId,
                                driverId: drv.id,
                              })
                            }
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="चालक को पिछला या नया भुगतान दर्ज करें"
                          >
                            <CreditCard className="w-3 h-3 text-indigo-600" />
                            <span>💰 हिसाब व भुगतान</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setHisabModalConfig({
                                isOpen: true,
                                initialTab: 'leaves',
                                vehicleId: v.id,
                                officerId: off?.id,
                                tenderId: v.tenderId,
                                driverId: drv.id,
                              })
                            }
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg text-[11px] border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="चालक छुट्टी व बदली ड्राइवर दर्ज करें"
                          >
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>🗓️ छुट्टी व बदली</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setHisabModalConfig({
                                isOpen: true,
                                initialTab: 'monthly_hisab',
                                vehicleId: v.id,
                                officerId: off?.id,
                                tenderId: v.tenderId,
                                driverId: drv.id,
                              })
                            }
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                            title="मासिक हिसाब शीट व पर्ची"
                          >
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>📊 पर्ची</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-600 font-semibold mt-1">
                        ⚠️ No driver attached! Vehicle cannot report for duty.
                      </div>
                    )}
                  </div>

                  {/* Fuel Policy Badge */}
                  <div className="mt-3 flex items-center justify-between text-xs px-1">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Fuel className="w-3.5 h-3.5 text-slate-400" /> Fuel Mode:
                    </span>
                    {v.fuelPolicy === 'monthly_fixed_budget' ? (
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                        Fixed Budget: {formatCurrency(v.monthlyFixedFuelAmount || 0)} / mo
                      </span>
                    ) : (
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        Actual Slips Reimbursement
                      </span>
                    )}
                  </div>

                  {/* Compliance & Document Expiries Strip */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-5 gap-1.5 text-[10px]">
                    <div className="p-1 rounded border text-center bg-slate-50 border-slate-200 text-slate-700">
                      <span className="block text-slate-400 text-[8px] uppercase font-semibold">RC Book</span>
                      <span className="truncate block font-mono text-[9px]">{v.rcNumber || 'Verified'}</span>
                    </div>

                    <div
                      className={`p-1 rounded border text-center ${
                        insDiff !== null && insDiff <= 20
                          ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="block text-slate-400 text-[8px] uppercase font-semibold">Insurance</span>
                      <span className="text-[9px]">{formatDate(v.insuranceExpiry).slice(0, 6)}</span>
                    </div>

                    <div
                      className={`p-1 rounded border text-center ${
                        pucDiff !== null && pucDiff <= 7
                          ? 'bg-rose-50 border-rose-200 text-rose-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="block text-slate-400 text-[8px] uppercase font-semibold">PUC</span>
                      <span className="text-[9px]">{formatDate(v.pucExpiry).slice(0, 6)}</span>
                    </div>

                    <div
                      className={`p-1 rounded border text-center ${
                        fitDiff !== null && fitDiff <= 30
                          ? 'bg-rose-50 border-rose-200 text-rose-800 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="block text-slate-400 text-[8px] uppercase font-semibold">Fitness</span>
                      <span className="text-[9px]">{formatDate(v.rtoFitnessExpiry).slice(0, 6)}</span>
                    </div>

                    <div className="p-1 rounded border text-center bg-slate-50 border-slate-200 text-slate-700">
                      <span className="block text-slate-400 text-[8px] uppercase font-semibold">Road Tax</span>
                      <span className="text-[9px]">{v.roadTaxExpiry ? formatDate(v.roadTaxExpiry).slice(0, 6) : 'Paid'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {onOpenProfileModal && (
                      <button
                        type="button"
                        onClick={() => onOpenProfileModal('vehicle', v.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-300 rounded-lg flex items-center gap-1 shadow-2xs text-[11px] transition-colors cursor-pointer"
                        title="गाड़ी की पूरी प्रोफ़ाइल व विवरण एडिट करें"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>✏️ गाड़ी एडिट</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedVehicleForDocs(v)}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 rounded-lg flex items-center gap-1.5 shadow-2xs text-[11px] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>RC / Documents ({v.documents?.length || 6})</span>
                    </button>

                    <button
                      onClick={() =>
                        setHisabModalConfig({
                          isOpen: true,
                          initialTab: 'payments',
                          vehicleId: v.id,
                          officerId: off?.id,
                          tenderId: v.tenderId,
                          driverId: drv?.id,
                        })
                      }
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 rounded-lg flex items-center gap-1 shadow-2xs text-[11px] transition-colors cursor-pointer"
                      title="चालक का पिछला/नया भुगतान व छुट्टी हिसाब"
                    >
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>चालक हिसाब</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVehicleForHistory(v.id);
                      setActiveTab('history');
                    }}
                    className="text-slate-600 hover:text-indigo-600 font-medium text-xs flex items-center gap-1"
                  >
                    History &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Navigation Bar */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
              <strong>{Math.min(currentPage * pageSize, filteredVehicles.length)}</strong> of{' '}
              <strong>{filteredVehicles.length}</strong> vehicles (Page {currentPage} of {totalPages})
            </span>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                &laquo; First
              </button>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                &lsaquo; Prev
              </button>
              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-100">
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Next &rsaquo;
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Last &raquo;
              </button>
            </div>
          </div>
        )}
      </>
      )}

      {activeTab === 'history' && (
        /* Driver Replacement History: "Kaun Kab Hata, Kaun Kab Laga" */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Driver Allocation &amp; Replacement Audit Trail (ड्राइवर बदलाव का संपूर्ण रिकॉर्ड)
              </h3>
              <p className="text-xs text-slate-500">
                कौन सा ड्राइवर किस तारीख को लगा, किस तारीख को हटा और हटाने का क्या कारण था
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Filter by Vehicle:</label>
              <select
                value={selectedVehicleForHistory}
                onChange={(e) => setSelectedVehicleForHistory(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Vehicles (सभी गाड़ियाँ)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.makeModel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Vehicle &amp; Tender</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Driver Name</th>
                  <th className="py-3 px-4">Tenure (अवधि)</th>
                  <th className="py-3 px-4">Reason For Change (कारण)</th>
                  <th className="py-3 px-4">Audit Notes / Officer Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredHistory.map((item) => {
                  const isCurrent = !item.releasedDate;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 font-mono">{item.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-500">{item.tenderName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.officerName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-indigo-900">{item.driverName}</div>
                        {isCurrent && (
                          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200 mt-0.5">
                            Currently Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium">
                          From: <span className="text-slate-900">{formatDate(item.assignedDate)}</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          To: {item.releasedDate ? formatDate(item.releasedDate) : 'Till Date (वर्तमान)'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            item.reasonForChange === 'officer_request'
                              ? 'bg-rose-100 text-rose-800'
                              : item.reasonForChange === 'leave'
                              ? 'bg-amber-100 text-amber-800'
                              : item.reasonForChange === 'discipline'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.reasonForChange.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {item.notes || '-'}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vehicle Replacement History: "Kaun Si Gadi Kab Hati, Kiski Lagi" */}
      {activeTab === 'vehicle_history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                <span>गाड़ी बदलाव इतिहास (Kaun Si Gadi Kab Hati, Kiski Lagi)</span>
              </h3>
              <p className="text-xs text-slate-500">
                टेंडर में किसी भी अफ़सर के साथ कौन सी गाड़ी कब हटी, किसकी जगह कौन सी नई गाड़ी लगी और उसका कारण क्या था
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                कुल बदलाव रिकॉर्ड: {vehicleAllocationHistory.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">गाड़ी नंबर व मॉडल</th>
                  <th className="p-3">विभाग / टेंडर</th>
                  <th className="p-3">अधिकारी व ड्राइवर</th>
                  <th className="p-3">हटने / लगने की तारीख</th>
                  <th className="p-3">स्थिति (Status)</th>
                  <th className="p-3">कारण (Reason)</th>
                  <th className="p-3">नयी गाड़ी / किसकी जगह लगी</th>
                  <th className="p-3">हैंडओवर नोट्स</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleAllocationHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 block">
                        {item.vehicleNumber}
                      </span>
                      <span className="text-slate-500 text-[11px]">{item.makeModel}</span>
                      <span className="text-[10px] text-slate-400 block">{item.ownershipType}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 line-clamp-2">
                        {item.tenderName}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 block">
                        {item.officerName || 'Unassigned'}
                      </span>
                      <span className="text-indigo-600 text-[11px]">
                        ड्राइवर: {item.driverName || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-slate-700 block">
                        <strong>लगी:</strong> {formatDate(item.assignedDate)}
                      </span>
                      {item.releasedDate ? (
                        <span className="text-red-700 font-semibold block">
                          <strong>हटी:</strong> {formatDate(item.releasedDate)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 text-[11px] block font-medium">
                          (वर्तमान में चल रही है)
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.releasedDate
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.releasedDate ? 'हटी (Released)' : 'सक्रिय (Active)'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 capitalize">
                        {item.reasonForChange.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3">
                      {item.replacementVehicleNumber ? (
                        <div className="bg-amber-50 text-amber-900 p-1.5 rounded text-[11px] border border-amber-200/70 font-mono">
                          <strong>{item.replacementVehicleNumber}</strong>
                          <span className="block text-[10px] font-sans text-amber-800">
                            {item.replacementVehicleModel || 'Standby vehicle'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="text-[11px] text-slate-600 italic">
                        {item.notes || '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Officer Transfer & Vehicle Halt History: "Adhikari Kaun Kab Hata, Kab Naya Laga, Gadi Kab Band Hui" */}
      {activeTab === 'officer_history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <UserX className="w-4 h-4 text-rose-600" />
                <span>अधिकारी तबादला व गाड़ी बंद/री-असाइनमेंट इतिहास (Officer Transfer &amp; Vehicle Halt Audit Trail)</span>
              </h3>
              <p className="text-xs text-slate-500">
                जब किसी अधिकारी का ट्रांसफर होता है या पद रिक्त होने पर गाड़ी चलना बंद होती है, उसका शासकीय आदेश सहित संपूर्ण रिकॉर्ड
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Filter by Vehicle:</label>
              <select
                value={selectedVehicleForOfficerHistory}
                onChange={(e) => setSelectedVehicleForOfficerHistory(e.target.value)}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="all">All Vehicles ({vehicles.length})</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.makeModel})
                  </option>
                ))}
              </select>
              <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg">
                कुल तबादला/बंद रिकॉर्ड: {officerAllocationHistory.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">गाड़ी नंबर व विभाग</th>
                  <th className="p-3">अधिकारी (तबादला/पूर्व)</th>
                  <th className="p-3">तबादला / कार्यमुक्ति तारीख</th>
                  <th className="p-3">वाहन पर कार्रवाई (Action)</th>
                  <th className="p-3">तबादले का कारण</th>
                  <th className="p-3">शासकीय आदेश क्रमांक</th>
                  <th className="p-3">नवीन अधिकारी (यदि लगा)</th>
                  <th className="p-3">ऑडिट / बिलिंग रिमार्क्स</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officerAllocationHistory
                  .filter((item) =>
                    selectedVehicleForOfficerHistory === 'all'
                      ? true
                      : item.vehicleId === selectedVehicleForOfficerHistory
                  )
                  .map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-slate-900 block">
                          {item.vehicleNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-1">
                          {item.tenderName}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-900 block">
                          {item.officerName}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {item.officerDesignation}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.department}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {formatDate(item.relievedDate || item.assignedDate)}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {item.relievedDate ? 'तबादला / कार्यमुक्त' : 'पदभार ग्रहण'}
                        </span>
                      </td>

                      <td className="p-3">
                        {item.vehicleAction === 'halted_idle_post_vacant' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                            <PauseCircle className="w-3 h-3 text-rose-600" />
                            गाड़ी चलना बंद (पद रिक्त)
                          </span>
                        )}
                        {item.vehicleAction === 'reassigned_to_new_officer' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <PlayCircle className="w-3 h-3 text-emerald-600" />
                            नवीन अधिकारी को आवंटित
                          </span>
                        )}
                        {item.vehicleAction === 'vehicle_surrendered' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            अस्थायी सरेंडर
                          </span>
                        )}
                        {item.vehicleAction === 'transferred_to_pool' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                            <Building2 className="w-3 h-3 text-purple-600" />
                            स्टैंडबाय पूल
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 capitalize">
                          {item.reason === 'post_vacant_car_stopped'
                            ? 'पद रिक्त (गाड़ी बंद)'
                            : item.reason === 'routine_transfer'
                            ? 'सामान्य स्थानांतरण'
                            : item.reason === 'promotion_transfer'
                            ? 'पदोन्नति स्थानांतरण'
                            : item.reason === 'retirement'
                            ? 'सेवानिवृत्ति'
                            : item.reason === 'new_joining'
                            ? 'नवीन पदभार'
                            : item.reason.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block truncate max-w-[140px]">
                          {item.transferOrderNumber || 'शासन आदेश'}
                        </span>
                      </td>

                      <td className="p-3">
                        {item.replacementOfficerName ? (
                          <div className="bg-emerald-50 text-emerald-900 p-1.5 rounded text-[11px] border border-emerald-200">
                            <strong>{item.replacementOfficerName}</strong>
                            <span className="block text-[10px] text-emerald-700">
                              {item.replacementOfficerDesignation || 'कार्यभार ग्रहण'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">कोई नहीं (पद रिक्त)</span>
                        )}
                      </td>

                      <td className="p-3 max-w-xs">
                        <p className="text-[11px] text-slate-600 italic">
                          {item.notes || '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isReplaceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <span>Replace Driver &bull; ड्राइवर बदलें</span>
              </h3>
              <button
                onClick={() => setIsReplaceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmReplacement} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Selected Vehicle:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {vehicles.find((v) => v.id === replaceVehicleId)?.vehicleNumber}
                </span>
                <span className="text-slate-500 ml-2">
                  (Current Driver: {drivers.find((d) => d.id === vehicles.find((v) => v.id === replaceVehicleId)?.currentDriverId)?.name || 'None'})
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select New Driver to Assign (नया ड्राइवर चुनें) *
                </label>
                <input
                  type="text"
                  placeholder="Quick search driver by name or phone..."
                  value={driverModalSearch}
                  onChange={(e) => setDriverModalSearch(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg mb-2 text-xs"
                />
                <select
                  required
                  size={5}
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs"
                >
                  <option value="">-- Choose from {drivers.length} drivers --</option>
                  {drivers
                    .filter((d) => {
                      const matchesStatus = d.status === 'active';
                      const q = driverModalSearch.toLowerCase();
                      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.phone.includes(q);
                      return matchesStatus && matchesSearch;
                    })
                    .slice(0, 50)
                    .map((drv) => (
                      <option key={drv.id} value={drv.id}>
                        {drv.name} ({drv.phone}) - {drv.currentVehicleId ? 'Assigned' : 'Available/Standby'}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Effective Date (प्रभावी तिथि) *
                  </label>
                  <input
                    type="date"
                    required
                    value={replaceEffectiveDate}
                    onChange={(e) => setReplaceEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reason for Replacement (कारण) *
                  </label>
                  <select
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value as ReplacementReason)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="officer_request">Officer Request (अधिकारी का अनुरोध)</option>
                    <option value="leave">Driver On Leave (छुट्टी पर गया)</option>
                    <option value="performance">Performance / Punctuality Issue</option>
                    <option value="discipline">Discipline / Behavior Issue</option>
                    <option value="routine_shift">Routine Rotation (सामान्य बदलाव)</option>
                    <option value="resigned">Driver Resigned / Left</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason Description (विवरण) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={replaceNotes}
                  onChange={(e) => setReplaceNotes(e.target.value)}
                  placeholder="e.g. Officer requested replacement due to morning reporting delays. Old driver shifted to standby pool."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsReplaceModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Confirm &amp; Record Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Add Vehicle to Govt Fleet (सरकारी फ्लीट में गाड़ी जोड़ें)
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveVehicleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vehicle Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UP32 AB 1234"
                    value={vehicleFormData.vehicleNumber || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, vehicleNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Make &amp; Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maruti Swift Dzire VXi"
                    value={vehicleFormData.makeModel || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, makeModel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    value={vehicleFormData.fuelType || 'Diesel'}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Petrol">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="Electric">Electric (EV)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ownership Type
                  </label>
                  <select
                    value={vehicleFormData.ownershipType || 'Company Owned'}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, ownershipType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Company Owned">Company Owned (खुद की गाड़ी)</option>
                    <option value="Attached / Market Hire">Attached / Market Hire (अटैच गाड़ी)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Attach to Govt Tender
                  </label>
                  <select
                    value={vehicleFormData.tenderId || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, tenderId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.departmentName} ({t.tenderNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Current Odometer (KM)
                  </label>
                  <input
                    type="number"
                    value={vehicleFormData.currentOdometer || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, currentOdometer: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Fuel Arrangement */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block font-bold text-slate-800 mb-2">
                  Fuel Arrangement for this Vehicle &amp; Driver (ईंधन व्यवस्था)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Fuel Mode</label>
                    <select
                      value={vehicleFormData.fuelPolicy || 'monthly_fixed_budget'}
                      onChange={(e) =>
                        setVehicleFormData({
                          ...vehicleFormData,
                          fuelPolicy: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="monthly_fixed_budget">
                        Monthly Fixed Fuel Amount (ड्राइवर को फिक्स फ्यूल बजट)
                      </option>
                      <option value="actual_reimbursement">
                        Actual Slips Reimbursement (पेट्रोल पंप पर्ची के आधार पर)
                      </option>
                    </select>
                  </div>

                  {vehicleFormData.fuelPolicy === 'monthly_fixed_budget' && (
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">
                        Fixed Monthly Fuel Amount (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 12000"
                        value={vehicleFormData.monthlyFixedFuelAmount || ''}
                        onChange={(e) =>
                          setVehicleFormData({
                            ...vehicleFormData,
                            monthlyFixedFuelAmount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Document Expiry Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    RTO Fitness Expiry Date
                  </label>
                  <input
                    type="date"
                    value={vehicleFormData.rtoFitnessExpiry || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, rtoFitnessExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    value={vehicleFormData.insuranceExpiry || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PUC Pollution Expiry Date
                  </label>
                  <input
                    type="date"
                    value={vehicleFormData.pucExpiry || ''}
                    onChange={(e) => setVehicleFormData({ ...vehicleFormData, pucExpiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Fleet Onboarding Modal (Owner-Driver, Attached Car Owner, Company Vehicle) */}
      <FleetVehicleOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        initialType={onboardingInitialType}
        tenders={tenders}
        drivers={drivers}
        vendors={vendors}
        onSaveVehicle={onSaveVehicle}
        onSaveDriver={onSaveDriver}
        onSaveVendor={onSaveVendor}
      />

      {/* Excel Bulk Import Modal (Vehicles, Drivers & Officers) */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType={bulkModalInitialType}
        existingVehicles={vehicles}
        existingDrivers={drivers}
        existingOfficers={officers}
        tenders={tenders}
        vendors={vendors}
        onImportVehicles={onBulkImportVehicles}
        onImportDrivers={onBulkImportDrivers}
        onImportOfficers={onBulkImportOfficers}
      />
      {/* Officer Transfer & Vehicle Halt Modal */}
      {isOfficerTransferModalOpen && selectedVehicleForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserX className="w-5 h-5 text-rose-600" />
                  <span>अधिकारी तबादला / गाड़ी बंद या री-असाइनमेंट</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  तबादला होने पर गाड़ी चलना बंद करना या नवीन अधिकारी को सौंपना
                </p>
              </div>
              <button
                onClick={() => setIsOfficerTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTransfer} className="mt-4 space-y-4 text-xs">
              {/* Vehicle & Current Officer Context Card */}
              {(() => {
                const curOff = officers.find(
                  (o) =>
                    o.assignedVehicleId === selectedVehicleForTransfer.id ||
                    o.id === selectedVehicleForTransfer.assignedOfficerId
                );
                const curDrv = drivers.find((d) => d.id === selectedVehicleForTransfer.currentDriverId);
                const tender = tenders.find((t) => t.id === selectedVehicleForTransfer.tenderId);

                return (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                        {selectedVehicleForTransfer.vehicleNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-700">
                        {tender?.departmentName}
                      </span>
                    </div>
                    <div className="text-slate-700">
                      <strong>वर्तमान अधिकारी:</strong> {curOff ? `${curOff.name} (${curOff.designation})` : 'कोई नहीं (पद रिक्त)'}
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      <strong>संबद्ध चालक:</strong> {curDrv ? `${curDrv.name} (${curDrv.phone})` : 'कोई नहीं'}
                    </div>
                  </div>
                );
              })()}

              {/* Action Selection */}
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  कार्रवाई चुनें (Select Vehicle Action on Officer Transfer) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => {
                      setTransferAction('halt_car_post_vacant');
                      setTransferReason('post_vacant_car_stopped');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      transferAction === 'halt_car_post_vacant'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                      <PauseCircle className="w-4 h-4 text-rose-600" />
                      <span>पद रिक्त - गाड़ी चलना बंद</span>
                    </div>
                    <p className="text-[11px] text-rose-700 mt-1">
                      तबादला हो गया, नवीन अधिकारी की तैनाती तक गाड़ी खड़ी रहेगी (Vehicle Halted)
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setTransferAction('reassign_new_officer');
                      setTransferReason('routine_transfer');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      transferAction === 'reassign_new_officer'
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                      <span>नवीन अधिकारी को सौंपें</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      पुराने हटे व नये अधिकारी ने तुरंत गाड़ी का कार्यभार ग्रहण कर लिया
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setTransferAction('surrender_vehicle');
                      setTransferReason('vehicle_surrendered');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      transferAction === 'surrender_vehicle'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>विभाग को अस्थायी समर्पित</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      विभाग के पत्र अनुसार गाड़ी को अस्थायी रूप से सरेंडर किया गया
                    </p>
                  </div>

                  <div
                    onClick={() => {
                      setTransferAction('move_to_pool');
                      setTransferReason('department_reallocation');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      transferAction === 'move_to_pool'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-indigo-800 text-xs">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>स्टैंडबाय पूल में डालें</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      टेंडर के रिजर्व पूल में गाड़ी रखें ताकि आवश्यकता पड़ने पर इस्तेमाल हो
                    </p>
                  </div>
                </div>
              </div>

              {/* If halting car: Driver disposition options */}
              {transferAction === 'halt_car_post_vacant' && (
                <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 space-y-2">
                  <label className="block font-bold text-rose-900">
                    गाड़ी बंद रहने के दौरान चालक (Driver) की स्थिति:
                  </label>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="driverHaltAction"
                        checked={transferDriverAction === 'keep_on_vehicle'}
                        onChange={() => setTransferDriverAction('keep_on_vehicle')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>चालक को गाड़ी के साथ ड्यूटी पर बनाए रखें (वेतन चालू / वाहन की देखरेख)</span>
                    </label>
                    <label className="flex items-center gap-2 text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="driverHaltAction"
                        checked={transferDriverAction === 'free_to_pool'}
                        onChange={() => setTransferDriverAction('free_to_pool')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>चालक को स्टैंडबाय पूल / अन्य गाड़ी हेतु मुक्त करें (Free to Pool)</span>
                    </label>
                  </div>
                  <div className="text-[10px] text-rose-700 bg-rose-100/70 p-2 rounded mt-1">
                    ℹ️ <strong>सरकारी बिलिंग परामर्श:</strong> गाड़ी बंद होने की अवधि में मासिक बिल में अनुबंध शर्त अनुसार प्रो-राटा कटौती (Pro-rata Deduction) या न्यूनतम रिटेंशन चार्ज लागू होता है।
                  </div>
                </div>
              )}

              {/* If assigning new officer: Input details */}
              {transferAction === 'reassign_new_officer' && (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-900">
                      नवीन कार्यभार ग्रहण करने वाले अधिकारी का विवरण:
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="newOfficerSource"
                          checked={newOfficerSource === 'new'}
                          onChange={() => setNewOfficerSource('new')}
                        />
                        <span>नया अधिकारी दर्ज करें</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                        <input
                          type="radio"
                          name="newOfficerSource"
                          checked={newOfficerSource === 'existing'}
                          onChange={() => setNewOfficerSource('existing')}
                        />
                        <span>मौजूदा सूची से चुनें</span>
                      </label>
                    </div>
                  </div>

                  {newOfficerSource === 'existing' ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        अधिकारी चुनें *
                      </label>
                      <select
                        value={selectedExistingOfficerId}
                        onChange={(e) => setSelectedExistingOfficerId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">-- अधिकारी चुनें --</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name} ({o.designation}) - {o.department}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            अधिकारी का नाम (Name) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Er. Vivek Saxena"
                            value={newOffName}
                            onChange={(e) => setNewOffName(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            पदनाम (Designation) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Superintending Engineer (Circle 1)"
                            value={newOffDesignation}
                            onChange={(e) => setNewOffDesignation(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            मोबाइल नंबर (Mobile)
                          </label>
                          <input
                            type="tel"
                            placeholder="e.g. 9415012345"
                            value={newOffMobile}
                            onChange={(e) => setNewOffMobile(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            विभाग / कार्यालय (Department)
                          </label>
                          <input
                            type="text"
                            value={newOffDept}
                            onChange={(e) => setNewOffDept(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transfer Dates, Order & Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    तबादला / कार्यमुक्ति प्रभावी तारीख *
                  </label>
                  <input
                    type="date"
                    required
                    value={transferEffectiveDate}
                    onChange={(e) => setTransferEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    तबादले का कारण (Reason) *
                  </label>
                  <select
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value as OfficerTransferReason)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="post_vacant_car_stopped">पद रिक्त - गाड़ी चलना बंद</option>
                    <option value="routine_transfer">सामान्य स्थानांतरण (Routine Transfer)</option>
                    <option value="promotion_transfer">पदोन्नति उपरांत स्थानांतरण (Promotion)</option>
                    <option value="retirement">सेवानिवृत्ति (Retirement)</option>
                    <option value="relieved_transferred">कार्यमुक्त होकर अन्य जनपद रवानगी</option>
                    <option value="department_reallocation">विभाग आंतरिक पुनरावंटन</option>
                    <option value="temporary_charge">अस्थायी प्रभार समाप्ति</option>
                    <option value="vehicle_surrendered">गाड़ी विभाग को समर्पित</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  शासकीय तबादला / कार्यमुक्ति आदेश संख्या (Govt Order Number) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PWD/GO/2026/TRF-4912"
                  value={transferOrderNumber}
                  onChange={(e) => setTransferOrderNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ऑडिट विवरण व हैंडओवर नोट्स (Audit Notes / Department Remarks)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. पूर्व अधिकारी के वाराणसी स्थानांतरण उपरांत नवीन पदस्थापना तक गाड़ी निरुद्ध/खड़ी की गई।"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOfficerTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  दर्ज करें व सुरक्षित करें (Save Record)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reactivate Halted Vehicle Modal: "Gadi Dobara Chalu Karein" */}
      {isReactivateModalOpen && selectedVehicleForReactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-emerald-600" />
                  <span>बंद गाड़ी पुनः शुरू करें (Reactivate Vehicle)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  नवीन अधिकारी की तैनाती उपरांत गाड़ी को पुनः सक्रिय व ड्यूटी पर लगाएं
                </p>
              </div>
              <button
                onClick={() => setIsReactivateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitReactivate} className="mt-4 space-y-4 text-xs">
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {selectedVehicleForReactivate.vehicleNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    {selectedVehicleForReactivate.makeModel}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-800">
                  <strong>वर्तमान स्थिति:</strong> गाड़ी चलना बंद (तारीख: {selectedVehicleForReactivate.idleSinceDate ? formatDate(selectedVehicleForReactivate.idleSinceDate) : 'लागू'} से खड़ी)
                </div>
                {selectedVehicleForReactivate.idleReason && (
                  <div className="text-[10px] text-emerald-700 italic">
                    कारण: {selectedVehicleForReactivate.idleReason}
                  </div>
                )}
              </div>

              {/* Incoming Officer Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    नवीन पदभार ग्रहण करने वाले अधिकारी का विवरण:
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="reactivateOffSource"
                        checked={reactivateOfficerSource === 'new'}
                        onChange={() => setReactivateOfficerSource('new')}
                      />
                      <span>नया अधिकारी जोड़ें</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer text-slate-700">
                      <input
                        type="radio"
                        name="reactivateOffSource"
                        checked={reactivateOfficerSource === 'existing'}
                        onChange={() => setReactivateOfficerSource('existing')}
                      />
                      <span>मौजूदा सूची से</span>
                    </label>
                  </div>
                </div>

                {reactivateOfficerSource === 'existing' ? (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      अधिकारी चुनें *
                    </label>
                    <select
                      value={reactivateExistingOffId}
                      onChange={(e) => setReactivateExistingOffId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">-- अधिकारी चुनें --</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.designation}) - {o.department}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          अधिकारी का नाम (Officer Name) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Er. Akhilesh Yadav"
                          value={reactivateOffName}
                          onChange={(e) => setReactivateOffName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          पदनाम (Designation) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Executive Engineer (Civil)"
                          value={reactivateOffDesignation}
                          onChange={(e) => setReactivateOffDesignation(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          मोबाइल नंबर (Mobile)
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 9839012345"
                          value={reactivateOffMobile}
                          onChange={(e) => setReactivateOffMobile(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          विभाग (Department)
                        </label>
                        <input
                          type="text"
                          value={reactivateOffDept}
                          onChange={(e) => setReactivateOffDept(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  गाड़ी पुनः चालू करने / पदभार ग्रहण की तारीख *
                </label>
                <input
                  type="date"
                  required
                  value={reactivateDate}
                  onChange={(e) => setReactivateDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  हैंडओवर / संचालन आरंभ नोट्स (Joining Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. नवीन अधिशासी अभियंता द्वारा वाहन का विधिवत कार्यभार ग्रहण किया गया व दैनिक ड्यूटी प्रारंभ हुई।"
                  value={reactivateNotes}
                  onChange={(e) => setReactivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReactivateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  गाड़ी शुरू करें व अलॉट करें (Activate Vehicle)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vehicle Documents & RC Vault Modal */}
      {selectedVehicleForDocs && (
        <DocumentManagerModal
          isOpen={!!selectedVehicleForDocs}
          onClose={() => setSelectedVehicleForDocs(null)}
          entityType="vehicle"
          entity={selectedVehicleForDocs}
          onUpdateEntity={(updatedVeh) => {
            onSaveVehicle(updatedVeh);
            setSelectedVehicleForDocs(updatedVeh);
          }}
        />
      )}

      {/* Unified In-Place Driver Hisab, Payment & Leave Modal */}
      {hisabModalConfig?.isOpen && (
        <DriverHisabAndLeaveModal
          isOpen={hisabModalConfig.isOpen}
          onClose={() => setHisabModalConfig(null)}
          initialTab={hisabModalConfig.initialTab}
          preSelectedVehicleId={hisabModalConfig.vehicleId}
          preSelectedOfficerId={hisabModalConfig.officerId}
          preSelectedTenderId={hisabModalConfig.tenderId}
          preSelectedDriverId={hisabModalConfig.driverId}
          tenders={tenders}
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

      {/* Manual Add Officer Modal */}
      {isAddOfficerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-amber-600" />
                <span>+ नया सरकारी अधिकारी जोड़ें (Add Government Officer)</span>
              </h3>
              <button
                onClick={() => setIsAddOfficerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveOfficerSubmit} className="mt-4 space-y-4 text-xs">
              {/* Unique Officer ID / Code */}
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>अधिकारी यूनिक कोड (Officer Unique ID / Code) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✨ स्वतः तैयार (Auto-Generated)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={officerFormData.officerCode || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, officerCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. OFF-101"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg font-mono font-bold text-slate-900 bg-white uppercase tracking-wider text-sm shadow-2xs focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setOfficerFormData({ ...officerFormData, officerCode: generateOfficerUniqueId(officers) })}
                    className="px-3 py-2 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 flex items-center gap-1 shadow-2xs transition-colors"
                    title="नया यूनिक कोड पुनः जनरेट करें"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>नया कोड</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  यह अद्वितीय अधिकारी कोड लॉगबुक, टेंडर अलॉटमेंट, बिलिंग और तबादला हिस्ट्री पर हमेशा दर्ज रहेगा।
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Officer Full Name (अधिकारी का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Ramesh Chandra Sharma"
                  value={officerFormData.name || ''}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Designation (पदनाम) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chief Engineer (Roads)"
                    value={officerFormData.designation || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department (विभाग) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PWD Nirman Bhawan"
                    value={officerFormData.department || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9415011223"
                    value={officerFormData.mobile || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9839011223"
                    value={officerFormData.alternatePhone || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, alternatePhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tender / Contract *
                  </label>
                  <select
                    value={officerFormData.tenderId || tenders[0]?.id || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, tenderId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.departmentName} ({t.tenderNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assigned Vehicle (तैनात गाड़ी)
                  </label>
                  <select
                    value={officerFormData.assignedVehicleId || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, assignedVehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs"
                  >
                    <option value="">-- बाद में अलॉट करें (Unassigned) --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.makeModel})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Office Room / Address (कार्यालय कक्ष व पता)
                </label>
                <input
                  type="text"
                  placeholder="e.g. कक्ष संख्या 304, निर्माण भवन, लखनऊ"
                  value={officerFormData.officeAddress || ''}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, officeAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Reporting Time (रिपोर्टिंग समय)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09:30 AM"
                    value={officerFormData.reportingTime || '09:30 AM'}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, reportingTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. ce.pwd@up.gov.in"
                    value={officerFormData.email || ''}
                    onChange={(e) => setOfficerFormData({ ...officerFormData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Instructions / Duties (विशेष निर्देश / ड्यूटी रूट)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. दैनिक कार्यालय आवागमन व राज्यमार्ग साइट निरीक्षण"
                  value={officerFormData.specialInstructions || ''}
                  onChange={(e) => setOfficerFormData({ ...officerFormData, specialInstructions: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOfficerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  अधिकारी सुरक्षित करें (Save Officer)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
