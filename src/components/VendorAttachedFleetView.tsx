import React, { useState } from 'react';
import {
  Handshake,
  Plus,
  Car,
  Printer,
  Calendar,
  IndianRupee,
  Building2,
  FileCheck,
  CheckCircle2,
  Phone,
  CreditCard,
  Search,
  Filter,
  Users,
  UserCheck,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  FileSpreadsheet,
  Copy,
  Check,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import {
  Vendor,
  Vehicle,
  VendorSettlement,
  DailyLogEntry,
  Driver,
  Tender,
  Officer,
} from '../types';
import { formatCurrency, formatDate } from '../utils/calculations';
import {
  generateVendorUniqueId,
  getVendorDisplayCode,
  generateDriverUniqueId,
  getDriverDisplayCode,
} from '../utils/idGenerator';
import { FleetVehicleOnboardingModal } from './FleetVehicleOnboardingModal';
import { BulkImportModal } from './BulkImportModal';

interface VendorAttachedFleetViewProps {
  vendors: Vendor[];
  vehicles: Vehicle[];
  vendorSettlements: VendorSettlement[];
  dailyLogs: DailyLogEntry[];
  drivers: Driver[];
  tenders: Tender[];
  officers: Officer[];
  onSaveVendor: (vendor: Vendor) => void;
  onSaveVehicle?: (vehicle: Vehicle) => void;
  onSaveDriver?: (driver: Driver) => void;
  onBulkImportVehicles?: (vehicles: Vehicle[], vendors?: Vendor[]) => void;
  onBulkImportDrivers?: (drivers: Driver[]) => void;
  onSaveSettlement: (settlement: VendorSettlement) => void;
  onPaySettlement: (settlementId: string, paymentRef: string) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

export const VendorAttachedFleetView: React.FC<VendorAttachedFleetViewProps> = ({
  vendors,
  vehicles,
  vendorSettlements,
  dailyLogs,
  drivers,
  tenders,
  officers,
  onSaveVendor,
  onSaveVehicle,
  onSaveDriver,
  onBulkImportVehicles = () => {},
  onBulkImportDrivers = () => {},
  onSaveSettlement,
  onPaySettlement,
  onOpenProfileModal,
}) => {
  const [activeTab, setActiveTab] = useState<'partners' | 'attached_logs' | 'settlements'>('partners');
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(
    vendors[0] || null
  );

  // Attached Logs Filters & State
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [ownershipLogFilter, setOwnershipLogFilter] = useState<string>('all');
  const [selectedVendorLogFilter, setSelectedVendorLogFilter] = useState<string>('all');
  const [attachedLogPage, setAttachedLogPage] = useState<number>(1);
  const attachedLogsPerPage = 20;

  // Modals State
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [isAddOwnerDriverModalOpen, setIsAddOwnerDriverModalOpen] = useState(false);
  const [isAddCarOwnerModalOpen, setIsAddCarOwnerModalOpen] = useState(false);

  const [selectedSettlementForPrint, setSelectedSettlementForPrint] = useState<VendorSettlement | null>(
    vendorSettlements[0] || null
  );

  // Form State: 1. Owner-Driver (मालिक-चालक: गाड़ी भी अपनी, चलाएगा भी खुद)
  const [ownerDriverForm, setOwnerDriverForm] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '2030-12-31',
    vehicleNumber: '',
    makeModel: '',
    vehicleType: 'Sedan' as 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV',
    fuelType: 'Diesel' as 'Diesel' | 'Petrol' | 'CNG' | 'Electric',
    tenderId: tenders[0]?.id || '',
    currentOdometer: 35000,
    monthlyAgreedRatePerVehicle: 32000,
    panNumber: '',
    isTdsApplicable: true,
    tdsRate: 1, // 1% default for individual contractor/owner-driver
    tdsSection: '194C',
    tdsExemptionReason: 'Section 194C(6) - 10 से कम वाहन स्वामी घोषणा (Nil TDS Declaration)',
    bankAccountDetails: '',
    notes: '',
  });

  // Form State: 2. Attached Car Owner (केवल गाड़ी मालिक: गाड़ी वेंडर की, ड्राइवर अलग रहेगा)
  const [carOwnerForm, setCarOwnerForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    address: '',
    panNumber: '',
    gstin: '',
    vendorType: 'fleet_vendor' as 'fleet_vendor' | 'owner_driver',
    monthlyAgreedRatePerVehicle: 32000,
    isTdsApplicable: true,
    tdsRate: 2, // 2% for company/firm
    tdsSection: '194C',
    tdsExemptionReason: '',
    bankAccountDetails: '',
    notes: '',
    attachVehicleNow: true,
    vehicleNumber: '',
    makeModel: '',
    vehicleType: 'Sedan' as 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV',
    fuelType: 'Diesel' as 'Diesel' | 'Petrol' | 'CNG' | 'Electric',
    tenderId: tenders[0]?.id || '',
    currentOdometer: 35000,
    assignedDriverId: '',
  });

  // Settlement Form State
  const [settleVehicleId, setSettleVehicleId] = useState<string>(
    vehicles.find((v) => v.ownershipType !== 'Company Owned')?.id || ''
  );
  const [settleMonthYear, setSettleMonthYear] = useState<string>('2026-08');
  const [settleAgreedRent, setSettleAgreedRent] = useState<number>(31000);
  const [settleExtraKmShare, setSettleExtraKmShare] = useState<number>(1000);
  const [settleAdvancesDeduction, setSettleAdvancesDeduction] = useState<number>(0);
  const [settleFuelDeduction, setSettleFuelDeduction] = useState<number>(0);
  const [settleFastagDeduction, setSettleFastagDeduction] = useState<number>(0);
  const [settleIsTdsApplicable, setSettleIsTdsApplicable] = useState<boolean>(true);
  const [settleTdsPercent, setSettleTdsPercent] = useState<number>(2);
  const [settleTdsSection, setSettleTdsSection] = useState<string>('194C');
  const [settleTdsExemptionReason, setSettleTdsExemptionReason] = useState<string>('');

  const [copiedVendorCode, setCopiedVendorCode] = useState(false);

  // Vendor Form State (Add / Edit)
  const [vendorFormData, setVendorFormData] = useState<Partial<Vendor>>({
    vendorCode: '',
    name: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    panNumber: '',
    gstin: '',
    address: '',
    bankAccountDetails: '',
    vendorType: 'fleet_vendor',
    monthlyAgreedRatePerVehicle: 31000,
    isTdsApplicable: true,
    tdsRate: 2,
    tdsSection: '194C',
    tdsExemptionReason: '',
    status: 'active',
    notes: '',
  });

  const handleOpenAddVendor = () => {
    setIsEditingVendor(false);
    const autoCode = generateVendorUniqueId(vendors, 'fleet_vendor');
    setVendorFormData({
      vendorCode: autoCode,
      name: '',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      panNumber: '',
      gstin: '',
      address: '',
      bankAccountDetails: '',
      vendorType: 'fleet_vendor',
      monthlyAgreedRatePerVehicle: 31000,
      isTdsApplicable: true,
      tdsRate: 2,
      tdsSection: '194C',
      tdsExemptionReason: '',
      status: 'active',
      notes: '',
    });
    setIsAddVendorModalOpen(true);
  };

  const handleOpenEditVendor = (vnd: Vendor) => {
    setIsEditingVendor(true);
    const isTds = vnd.isTdsApplicable !== false && vnd.tdsRate !== 0;
    setVendorFormData({
      ...vnd,
      vendorCode: vnd.vendorCode || getVendorDisplayCode(vnd),
      isTdsApplicable: isTds,
      tdsRate: vnd.tdsRate,
      tdsSection: vnd.tdsSection || '194C',
      tdsExemptionReason: vnd.tdsExemptionReason || (isTds ? '' : 'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)'),
    });
    setIsAddVendorModalOpen(true);
  };

  const handleCopyVendorCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVendorCode(true);
    setTimeout(() => setCopiedVendorCode(false), 2000);
  };

  // Calculate settlement preview in modal
  const selectedVehicle = vehicles.find((v) => v.id === settleVehicleId);
  const selectedVendor = vendors.find((vnd) => vnd.id === selectedVehicle?.vendorId);

  const totalEarned = settleAgreedRent + settleExtraKmShare;
  const totalDeductions =
    settleAdvancesDeduction + settleFuelDeduction + settleFastagDeduction;
  const taxableAmount = Math.max(0, totalEarned - totalDeductions);
  const effectiveTdsPercent = settleIsTdsApplicable ? settleTdsPercent : 0;
  const calculatedTds = Math.round((taxableAmount * effectiveTdsPercent) / 100);
  const netPayable = Math.round(taxableAmount - calculatedTds);

  // Attached vehicles counts
  const attachedVehicles = vehicles.filter((v) => v.ownershipType !== 'Company Owned');
  const attachedVehicleIds = new Set(attachedVehicles.map((v) => v.id));
  const attachedLogs = dailyLogs.filter((l) => attachedVehicleIds.has(l.vehicleId));
  const ownerDriverVehicles = vehicles.filter((v) => v.ownershipType === 'Owner-Driver');
  const fleetVendorVehicles = vehicles.filter((v) => v.ownershipType === 'Attached / Market Hire');

  const filteredVendors = vendors.filter((vnd) => {
    const matchesType = vendorTypeFilter === 'all' || vnd.vendorType === vendorTypeFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      vnd.name.toLowerCase().includes(q) ||
      vnd.contactPerson.toLowerCase().includes(q) ||
      vnd.phone.includes(q) ||
      vnd.panNumber.toLowerCase().includes(q);

    return matchesType && matchesSearch;
  });

  const handleVehicleSelectInSettlement = (vId: string) => {
    const veh = vehicles.find((v) => v.id === vId);
    if (!veh) return;
    const vnd = vendors.find((x) => x.id === veh.vendorId);
    setSettleVehicleId(vId);
    setSettleAgreedRent(veh.monthlyVendorRent || vnd?.monthlyAgreedRatePerVehicle || 31000);
    const isTds = vnd ? (vnd.isTdsApplicable !== false && vnd.tdsRate !== 0) : true;
    setSettleIsTdsApplicable(isTds);
    setSettleTdsPercent(isTds ? (vnd?.tdsRate ?? (vnd?.vendorType === 'owner_driver' ? 1 : 2)) : 0);
    setSettleTdsSection(vnd?.tdsSection || '194C');
    setSettleTdsExemptionReason(vnd?.tdsExemptionReason || '');
  };

  const handleSaveSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !selectedVendor) {
      alert('कृपया अनुबंधित गाड़ी व वेंडर का चयन करें।');
      return;
    }

    const newSettlement: VendorSettlement = {
      id: `vset-${Date.now()}`,
      voucherNumber: `VSET-${settleMonthYear.replace('-', '')}-${selectedVehicle.vehicleNumber.slice(-4)}`,
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      vehicleId: selectedVehicle.id,
      vehicleNumber: selectedVehicle.vehicleNumber,
      monthYear: settleMonthYear,
      settlementDate: new Date().toISOString().slice(0, 10),
      agreedBaseRent: settleAgreedRent,
      extraKmShare: settleExtraKmShare,
      totalEarned,
      deductionsAdvances: settleAdvancesDeduction,
      deductionsFuelByContractor: settleFuelDeduction,
      deductionsFastagByContractor: settleFastagDeduction,
      deductionsOther: 0,
      isTdsApplicable: settleIsTdsApplicable,
      tdsPercent: effectiveTdsPercent,
      tdsAmount: calculatedTds,
      tdsSection: settleIsTdsApplicable ? settleTdsSection : undefined,
      tdsExemptionReason: !settleIsTdsApplicable ? (settleTdsExemptionReason || 'Nil TDS Declaration under Section 194C(6)') : undefined,
      netPayableToVendor: netPayable,
      paymentStatus: 'draft',
      remarks: 'Settlement calculated as per monthly GPS run, agreed rent and TDS settings.',
    };

    onSaveSettlement(newSettlement);
    setIsSettlementModalOpen(false);
    setSelectedSettlementForPrint(newSettlement);
  };

  const handleSaveVendorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorFormData.name || !vendorFormData.phone) {
      alert('Vendor Name and Phone are required.');
      return;
    }

    const isTds = vendorFormData.isTdsApplicable !== false;
    const finalTdsRate = isTds ? Number(vendorFormData.tdsRate ?? 2) : 0;
    const finalCode = (vendorFormData.vendorCode?.trim().toUpperCase()) ||
      (isEditingVendor && vendorFormData.id ? vendorFormData.id : generateVendorUniqueId(vendors, vendorFormData.vendorType));

    const newV: Vendor = {
      id: isEditingVendor && vendorFormData.id ? vendorFormData.id : finalCode,
      vendorCode: finalCode,
      name: vendorFormData.name.trim(),
      contactPerson: (vendorFormData.contactPerson || vendorFormData.name).trim(),
      phone: vendorFormData.phone.trim(),
      alternatePhone: vendorFormData.alternatePhone?.trim() || undefined,
      panNumber: (vendorFormData.panNumber || '').toUpperCase().trim(),
      gstin: vendorFormData.gstin?.trim() || undefined,
      address: (vendorFormData.address || '').trim(),
      bankAccountDetails: (vendorFormData.bankAccountDetails || '').trim(),
      vendorType: (vendorFormData.vendorType as any) || 'fleet_vendor',
      monthlyAgreedRatePerVehicle: Number(vendorFormData.monthlyAgreedRatePerVehicle) || 31000,
      isTdsApplicable: isTds,
      tdsRate: finalTdsRate,
      tdsSection: isTds ? (vendorFormData.tdsSection || '194C') : undefined,
      tdsExemptionReason: !isTds
        ? (vendorFormData.tdsExemptionReason || 'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)')
        : undefined,
      status: vendorFormData.status || 'active',
      notes: vendorFormData.notes?.trim() || undefined,
    };

    onSaveVendor(newV);
    setIsAddVendorModalOpen(false);
    setSelectedVendorForDetail(newV);
  };

  const handleSaveOwnerDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerDriverForm.name || !ownerDriverForm.phone || !ownerDriverForm.vehicleNumber || !ownerDriverForm.makeModel) {
      alert('कृपया चालक का नाम, मोबाइल नंबर, गाड़ी नंबर व मॉडल दर्ज करें।');
      return;
    }

    const generatedVndId = generateVendorUniqueId(vendors, 'owner_driver');
    const generatedDrvId = generateDriverUniqueId(drivers);
    const cleanVehNum = ownerDriverForm.vehicleNumber.trim().toUpperCase();
    const vId = `veh-${cleanVehNum.replace(/\s+/g, '')}`;
    const dId = generatedDrvId;
    const vndId = generatedVndId;
    const cleanDrvName = ownerDriverForm.name.trim();

    const isTds = ownerDriverForm.isTdsApplicable !== false && Number(ownerDriverForm.tdsRate) > 0;
    const finalTdsRate = isTds ? Number(ownerDriverForm.tdsRate) : 0;

    // 1. Create Vendor Record
    const newVendor: Vendor = {
      id: vndId,
      vendorCode: vndId,
      name: `${cleanDrvName} (मालिक-चालक)`,
      contactPerson: cleanDrvName,
      phone: ownerDriverForm.phone.trim(),
      alternatePhone: ownerDriverForm.alternatePhone.trim() || undefined,
      panNumber: (ownerDriverForm.panNumber || '').trim().toUpperCase() || 'PAN-ON-FILE',
      address: ownerDriverForm.address.trim() || 'Uttar Pradesh',
      bankAccountDetails: ownerDriverForm.bankAccountDetails.trim() || 'A/C Details to be provided',
      vendorType: 'owner_driver',
      monthlyAgreedRatePerVehicle: Number(ownerDriverForm.monthlyAgreedRatePerVehicle) || 32000,
      isTdsApplicable: isTds,
      tdsRate: finalTdsRate,
      tdsSection: isTds ? (ownerDriverForm.tdsSection || '194C') : undefined,
      tdsExemptionReason: !isTds
        ? (ownerDriverForm.tdsExemptionReason || 'Section 194C(6) - 10 से कम वाहन स्वामी घोषणा (Nil TDS Declaration)')
        : undefined,
      status: 'active',
      notes: ownerDriverForm.notes.trim() || `मालिक-चालक। अपनी गाड़ी ${cleanVehNum} खुद चलाते हैं।`,
    };

    // 2. Create Driver Record
    const newDriver: Driver = {
      id: dId,
      driverCode: dId,
      name: cleanDrvName,
      phone: ownerDriverForm.phone.trim(),
      alternatePhone: ownerDriverForm.alternatePhone.trim() || undefined,
      address: ownerDriverForm.address.trim() || 'Uttar Pradesh',
      licenseNumber: ownerDriverForm.licenseNumber.trim().toUpperCase() || `DL-OD-${Date.now().toString().slice(-6)}`,
      licenseExpiry: ownerDriverForm.licenseExpiry || '2030-12-31',
      policeVerificationDate: new Date().toISOString().slice(0, 10),
      policeVerificationExpiry: '2027-12-31',
      aadharNumber: 'Aadhaar on record',
      panNumber: (ownerDriverForm.panNumber || '').trim().toUpperCase() || undefined,
      joiningDate: new Date().toISOString().slice(0, 10),
      monthlySalary: 0, // No company salary; compensated through vehicle hire monthly settlement
      dailyDaRate: 350,
      status: 'active',
      currentVehicleId: vId,
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFuelBudgetAmount: 0,
      bankAccountDetails: ownerDriverForm.bankAccountDetails.trim() || undefined,
      employmentType: 'owner_driver',
    };

    // 3. Create Vehicle Record
    const newVehicle: Vehicle = {
      id: vId,
      vehicleNumber: cleanVehNum,
      makeModel: ownerDriverForm.makeModel.trim(),
      vehicleType: ownerDriverForm.vehicleType || 'Sedan',
      fuelType: ownerDriverForm.fuelType || 'Diesel',
      color: 'White',
      modelYear: 2024,
      ownershipType: 'Owner-Driver',
      registrationType: 'Commercial',
      vendorId: vndId,
      vendorName: newVendor.name,
      monthlyVendorRent: Number(ownerDriverForm.monthlyAgreedRatePerVehicle) || 32000,
      tenderId: ownerDriverForm.tenderId || tenders[0]?.id || '',
      currentDriverId: dId,
      currentOdometer: Number(ownerDriverForm.currentOdometer) || 35000,
      rtoFitnessExpiry: '2027-06-30',
      insuranceExpiry: '2026-12-31',
      pucExpiry: '2026-11-30',
      roadTaxExpiry: '2028-12-31',
      permitExpiry: '2027-08-31',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
    };

    onSaveVendor(newVendor);
    if (onSaveDriver) onSaveDriver(newDriver);
    if (onSaveVehicle) onSaveVehicle(newVehicle);

    setIsAddOwnerDriverModalOpen(false);
    setSelectedVendorForDetail(newVendor);
    setOwnerDriverForm({
      name: '',
      phone: '',
      alternatePhone: '',
      address: '',
      licenseNumber: '',
      licenseExpiry: '2030-12-31',
      vehicleNumber: '',
      makeModel: '',
      vehicleType: 'Sedan',
      fuelType: 'Diesel',
      tenderId: tenders[0]?.id || '',
      currentOdometer: 35000,
      monthlyAgreedRatePerVehicle: 32000,
      panNumber: '',
      isTdsApplicable: true,
      tdsRate: 1,
      tdsSection: '194C',
      tdsExemptionReason: 'Section 194C(6) - 10 से कम वाहन स्वामी घोषणा (Nil TDS Declaration)',
      bankAccountDetails: '',
      notes: '',
    });
  };

  const handleSaveCarOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!carOwnerForm.name || !carOwnerForm.phone) {
      alert('कृपया वेंडर/मालिक का नाम व मोबाइल नंबर दर्ज करें।');
      return;
    }

    const generatedVndId = generateVendorUniqueId(vendors, carOwnerForm.vendorType || 'fleet_vendor');
    const vndId = generatedVndId;
    const isTds = carOwnerForm.isTdsApplicable !== false && Number(carOwnerForm.tdsRate) > 0;
    const finalTdsRate = isTds ? Number(carOwnerForm.tdsRate) : 0;

    const newVendor: Vendor = {
      id: vndId,
      vendorCode: vndId,
      name: carOwnerForm.name.trim(),
      contactPerson: (carOwnerForm.contactPerson || carOwnerForm.name).trim(),
      phone: carOwnerForm.phone.trim(),
      alternatePhone: carOwnerForm.alternatePhone.trim() || undefined,
      panNumber: (carOwnerForm.panNumber || '').trim().toUpperCase() || 'PAN-ON-FILE',
      gstin: carOwnerForm.gstin.trim() || undefined,
      address: carOwnerForm.address.trim() || 'Uttar Pradesh',
      bankAccountDetails: carOwnerForm.bankAccountDetails.trim() || 'A/C Details to be provided',
      vendorType: carOwnerForm.vendorType || 'fleet_vendor',
      monthlyAgreedRatePerVehicle: Number(carOwnerForm.monthlyAgreedRatePerVehicle) || 32000,
      isTdsApplicable: isTds,
      tdsRate: finalTdsRate,
      tdsSection: isTds ? (carOwnerForm.tdsSection || '194C') : undefined,
      tdsExemptionReason: !isTds
        ? (carOwnerForm.tdsExemptionReason || 'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)')
        : undefined,
      status: 'active',
      notes: carOwnerForm.notes.trim() || undefined,
    };

    onSaveVendor(newVendor);

    if (carOwnerForm.attachVehicleNow && carOwnerForm.vehicleNumber.trim()) {
      const vId = `veh-${Date.now()}`;
      const newVehicle: Vehicle = {
        id: vId,
        vehicleNumber: carOwnerForm.vehicleNumber.trim().toUpperCase(),
        makeModel: carOwnerForm.makeModel.trim() || 'Commercial Taxi',
        vehicleType: carOwnerForm.vehicleType || 'Sedan',
        fuelType: carOwnerForm.fuelType || 'Diesel',
        color: 'White',
        modelYear: 2024,
        ownershipType: 'Attached / Market Hire',
        registrationType: 'Commercial',
        vendorId: vndId,
        vendorName: newVendor.name,
        monthlyVendorRent: Number(carOwnerForm.monthlyAgreedRatePerVehicle) || 32000,
        tenderId: carOwnerForm.tenderId || tenders[0]?.id || '',
        currentDriverId: carOwnerForm.assignedDriverId || undefined,
        currentOdometer: Number(carOwnerForm.currentOdometer) || 35000,
        rtoFitnessExpiry: '2027-06-30',
        insuranceExpiry: '2026-12-31',
        pucExpiry: '2026-11-30',
        roadTaxExpiry: '2028-12-31',
        permitExpiry: '2027-08-31',
        status: 'active',
        fuelPolicy: 'monthly_fixed_budget',
      };
      if (onSaveVehicle) onSaveVehicle(newVehicle);
    }

    setIsAddCarOwnerModalOpen(false);
    setSelectedVendorForDetail(newVendor);
    setCarOwnerForm({
      name: '',
      contactPerson: '',
      phone: '',
      alternatePhone: '',
      address: '',
      panNumber: '',
      gstin: '',
      vendorType: 'fleet_vendor',
      monthlyAgreedRatePerVehicle: 32000,
      isTdsApplicable: true,
      tdsRate: 2,
      tdsSection: '194C',
      tdsExemptionReason: '',
      bankAccountDetails: '',
      notes: '',
      attachVehicleNow: true,
      vehicleNumber: '',
      makeModel: '',
      vehicleType: 'Sedan',
      fuelType: 'Diesel',
      tenderId: tenders[0]?.id || '',
      currentOdometer: 35000,
      assignedDriverId: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Market Attached Fleet &amp; Owner-Drivers Hub (अनुबंधित गाड़ियाँ व वेंडर)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            सरकारी टेंडरों में लगी अनुबंधित गाड़ियों, वेंडरों, एवं अपनी गाड़ी खुद चलाने वाले मालिक-चालकों का सम्पूर्ण प्रबंधन व टीडीएस हिसाब
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('partners')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'partners'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              वेंडर व गाड़ियाँ ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab('attached_logs')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'attached_logs'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              लॉग बुक रन ({attachedLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('settlements')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeTab === 'settlements'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              मासिक सेटलमेंट वाउचर ({vendorSettlements.length})
            </button>
          </div>

          {/* Quick Action Buttons for adding Owner-Driver vs Car Owner */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddOwnerDriverModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="मालिक-चालक: गाड़ी भी अपनी और खुद ही चलाएगा"
            >
              <UserCheck className="w-4 h-4 text-emerald-200" />
              <span>+ मालिक-चालक जोड़ें</span>
            </button>

            <button
              onClick={() => setIsAddCarOwnerModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="केवल गाड़ी मालिक: गाड़ी वेंडर की, ड्राइवर अलग रहेगा"
            >
              <Car className="w-4 h-4 text-indigo-200" />
              <span>+ केवल गाड़ी मालिक जोड़ें</span>
            </button>

            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
              title="एक्सेल शीट डाउनलोड करें या भरी हुई शीट अपलोड करके एक साथ दर्जनों गाड़ियाँ व ड्राइवर जोड़ें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>📥 एक्सेल बल्क अपलोड</span>
            </button>

            <button
              onClick={handleOpenAddVendor}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-300 transition-colors"
              title="अन्य वेंडर मास्टर"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">वेंडर मास्टर</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helpful Bilingual Visual Guidance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-xl border border-slate-700/80 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300 font-black text-sm">
            1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-emerald-300 uppercase tracking-wide flex items-center gap-1">
                <span>केस 1: मालिक-चालक (Owner-Driver)</span>
              </h4>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/30 font-medium">
                गाड़ी + ड्राइवर खुद
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              अगर कोई व्यक्ति अपनी खुद की गाड़ी लाया है और वह <strong>खुद ही गाड़ी चलाएगा</strong>, तो ऊपर दिए गए <strong className="text-emerald-300">"+ मालिक-चालक जोड़ें"</strong> बटन को दबाएं। इससे वेंडर, ड्राइवर और गाड़ी तीनों एक साथ लिंक हो जाएंगे और 1% TDS (धारा 194C) अथवा 10 से कम वाहन होने पर 0% छूट लागू होगी।
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t md:border-t-0 md:border-l border-slate-700/60 pt-3 md:pt-0 md:pl-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-300 font-black text-sm">
            2
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-wide flex items-center gap-1">
                <span>केस 2: केवल गाड़ी मालिक (Attached Car Owner)</span>
              </h4>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded border border-indigo-400/30 font-medium">
                गाड़ी वेंडर की, ड्राइवर अलग
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              अगर किसी व्यक्ति या ट्रेवल्स कंपनी की <strong>सिर्फ गाड़ी लगी है</strong> और ड्राइवर कंपनी का या अलग चालक है, तो <strong className="text-indigo-300">"+ केवल गाड़ी मालिक जोड़ें"</strong> चुनें। इससे वेंडर का मासिक किराया (2% या 1% TDS) तय होगा और गाड़ी को अलग से ड्राइवर अलॉट किया जा सकेगा।
            </p>
          </div>
        </div>
      </div>

      {/* High-Level Partner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            Total Attached Fleet
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{attachedVehicles.length}</span>
            <span className="text-xs text-indigo-600 font-semibold">
              {Math.round((attachedVehicles.length / (vehicles.length || 1)) * 100)}% of total fleet
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {fleetVendorVehicles.length} Fleet Vendors &bull; {ownerDriverVehicles.length} Owner-Drivers
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            Active Vendor Partners
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-700">{vendors.length}</span>
            <span className="text-xs text-purple-600 font-medium">100% Verified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            TDS Settings, PAN, GST &amp; Bank Details
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            Avg Monthly Rent Payout
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">₹31,500</span>
            <span className="text-xs text-slate-500">Per Car / Month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Agreed contractor-to-vendor hiring rate
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
            Settled Vouchers
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{vendorSettlements.length}</span>
            <span className="text-xs text-emerald-600 font-semibold">Processed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Reconciled with advances &amp; TDS deductions
          </p>
        </div>
      </div>

      {activeTab === 'partners' ? (
        /* Partners and Attached Fleet View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Vendors List */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="border-b border-slate-100 pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">
                  Partners ({filteredVendors.length})
                </h3>
                <select
                  value={vendorTypeFilter}
                  onChange={(e) => setVendorTypeFilter(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded bg-white"
                >
                  <option value="all">All Partners</option>
                  <option value="fleet_vendor">Fleet Vendors</option>
                  <option value="owner_driver">Owner-Drivers</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search vendor name, PAN, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[580px] pr-1">
              {filteredVendors.map((vnd) => {
                const isSelected = selectedVendorForDetail?.id === vnd.id;
                const vndVehicles = vehicles.filter((v) => v.vendorId === vnd.id);

                return (
                  <div
                    key={vnd.id}
                    onClick={() => setSelectedVendorForDetail(vnd)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{vnd.name}</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                            {getVendorDisplayCode(vnd)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{vnd.contactPerson} &bull; {vnd.phone}</div>
                      </div>
                    <div className="flex items-center gap-1.5">
                      {onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenProfileModal('vendor', vnd.id);
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="वेंडर प्रोफ़ाइल एडिट करें"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          vnd.vendorType === 'owner_driver'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {vnd.vendorType.replace('_', ' ')}
                      </span>
                    </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                      <span>PAN: <strong className="font-mono text-slate-900">{vnd.panNumber || 'N/A'}</strong></span>
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {vndVehicles.length} Attached Cars
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[10px]">
                      {vnd.isTdsApplicable === false || vnd.tdsRate === 0 ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-semibold">
                          TDS: नहीं (0% छूट)
                        </span>
                      ) : (
                        <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-semibold">
                          TDS: {vnd.tdsRate}% ({vnd.tdsSection || '194C'})
                        </span>
                      )}
                      <span className="text-slate-500 font-mono">₹{vnd.monthlyAgreedRatePerVehicle?.toLocaleString('en-IN')}/गाड़ी</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Selected Vendor Profile & Attached Vehicles Grid */}
          <div className="lg:col-span-2 space-y-6">
            {selectedVendorForDetail ? (
              <>
                {/* Vendor Profile Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          {selectedVendorForDetail.name}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold shadow-2xs">
                          <span>🆔 {getVendorDisplayCode(selectedVendorForDetail)}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyVendorCode(getVendorDisplayCode(selectedVendorForDetail))}
                            className="hover:text-indigo-950 p-0.5 rounded transition-colors text-indigo-500 hover:bg-indigo-100"
                            title="यूनिक वेंडर कोड कॉपी करें"
                          >
                            {copiedVendorCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                          PAN: {selectedVendorForDetail.panNumber || 'N/A'}
                        </span>
                        {selectedVendorForDetail.isTdsApplicable === false || selectedVendorForDetail.tdsRate === 0 ? (
                          <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            TDS छूट (Nil TDS)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                            TDS {selectedVendorForDetail.tdsRate}% ({selectedVendorForDetail.tdsSection || '194C'})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Contact Person: <strong>{selectedVendorForDetail.contactPerson}</strong> &bull; Phone: {selectedVendorForDetail.phone}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {onOpenProfileModal && (
                        <button
                          type="button"
                          onClick={() => onOpenProfileModal('vendor', selectedVendorForDetail.id)}
                          className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="वेंडर या मालिक की प्रोफ़ाइल, संपर्क, पैन, बैंक खाता एडिट करें"
                        >
                          <Edit2 className="w-4 h-4 text-indigo-200" />
                          <span>✏️ वेंडर प्रोफ़ाइल एडिट करें (Edit Profile)</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditVendor(selectedVendorForDetail)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-300 shadow-2xs"
                      >
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        TDS व वेंडर सेटिंग बदलें
                      </button>
                      <button
                        onClick={() => {
                          const firstVeh = vehicles.find((v) => v.vendorId === selectedVendorForDetail.id);
                          if (firstVeh) {
                            handleVehicleSelectInSettlement(firstVeh.id);
                          }
                          setIsSettlementModalOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <IndianRupee className="w-4 h-4" />
                        Generate Monthly Payout Voucher
                      </button>
                    </div>
                  </div>

                  {/* Commercial Terms Strip */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-slate-500 text-[10px] block uppercase font-semibold">
                        Agreed Monthly Rent
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(selectedVendorForDetail.monthlyAgreedRatePerVehicle)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">/ vehicle / month</span>
                    </div>

                    <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <span className="text-indigo-700 text-[10px] block uppercase font-semibold">
                        Attached Fleet Size
                      </span>
                      <span className="text-base font-bold text-indigo-900">
                        {vehicles.filter((v) => v.vendorId === selectedVendorForDetail.id).length} Cars
                      </span>
                      <span className="text-[10px] text-indigo-600 block mt-0.5">Deployed in tenders</span>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                      <span className="text-purple-700 text-[10px] block uppercase font-semibold">
                        TDS कटौती दर (TDS Rate)
                      </span>
                      <span className="text-base font-bold text-purple-900">
                        {selectedVendorForDetail.isTdsApplicable === false || selectedVendorForDetail.tdsRate === 0
                          ? '0% (TDS छूट)'
                          : `${selectedVendorForDetail.tdsRate}% (${selectedVendorForDetail.tdsSection || '194C'})`}
                      </span>
                      <span className="text-[10px] text-purple-600 block mt-0.5 truncate" title={selectedVendorForDetail.tdsExemptionReason || 'Income Tax Sec 194C'}>
                        {selectedVendorForDetail.isTdsApplicable === false || selectedVendorForDetail.tdsRate === 0
                          ? (selectedVendorForDetail.tdsExemptionReason || 'Nil TDS Declaration (Sec 194C(6))')
                          : (selectedVendorForDetail.vendorType === 'owner_driver' ? 'Individual (1%)' : 'Company/Firm (2%)')}
                      </span>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <span className="text-emerald-700 text-[10px] block uppercase font-semibold">
                        Bank Details
                      </span>
                      <span className="text-xs font-medium text-emerald-900 block truncate" title={selectedVendorForDetail.bankAccountDetails}>
                        {selectedVendorForDetail.bankAccountDetails || 'Not specified'}
                      </span>
                      <span className="text-[10px] text-emerald-600 block mt-0.5">For RTGS / NEFT</span>
                    </div>
                  </div>
                </div>

                {/* Attached Vehicles Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Vehicles Attached by this Partner ({vehicles.filter((v) => v.vendorId === selectedVendorForDetail.id).length})
                    </h4>
                    <span className="text-xs text-slate-500">Live deployment &amp; tender assignments</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Vehicle Number</th>
                          <th className="py-2.5 px-3">Make / Model</th>
                          <th className="py-2.5 px-3">Attached Tender &amp; Dept</th>
                          <th className="py-2.5 px-3">Assigned Officer</th>
                          <th className="py-2.5 px-3">Driver</th>
                          <th className="py-2.5 px-3 text-right">Agreed Rent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {vehicles
                          .filter((v) => v.vendorId === selectedVendorForDetail.id)
                          .map((veh) => {
                            const tender = tenders.find((t) => t.id === veh.tenderId);
                            const off = officers.find((o) => o.id === veh.assignedOfficerId);
                            const drv = drivers.find((d) => d.id === veh.currentDriverId);

                            return (
                              <tr key={veh.id} className="hover:bg-slate-50/70">
                                <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                                  {veh.vehicleNumber}
                                </td>
                                <td className="py-2.5 px-3">
                                  {veh.makeModel} ({veh.fuelType})
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-900">{tender?.departmentName || '-'}</div>
                                  <div className="text-[10px] text-slate-500">{tender?.tenderNumber}</div>
                                </td>
                                <td className="py-2.5 px-3 text-slate-800">
                                  {off?.name || 'Pool / Transit'}
                                </td>
                                <td className="py-2.5 px-3">
                                  {drv?.name || <span className="text-rose-600">No Driver</span>}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                                  {formatCurrency(veh.monthlyVendorRent || selectedVendorForDetail.monthlyAgreedRatePerVehicle)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : activeTab === 'attached_logs' ? (
        /* Attached Fleet Duty Log Book Tab */
        <div className="space-y-5">
          {(() => {
            const attachedVehiclesList = vehicles.filter((v) => v.ownershipType !== 'Company Owned');
            const attachedVehMap = new Map(attachedVehiclesList.map((v) => [v.id, v]));
            
            const rawAttachedLogs = dailyLogs.filter((l) => attachedVehMap.has(l.vehicleId));

            const filteredAttachedLogs = rawAttachedLogs.filter((l) => {
              const veh = attachedVehMap.get(l.vehicleId);
              const matchesOwnership =
                ownershipLogFilter === 'all' || veh?.ownershipType === ownershipLogFilter;
              const matchesVendor =
                selectedVendorLogFilter === 'all' || veh?.vendorId === selectedVendorLogFilter;
              const q = logSearchQuery.toLowerCase();
              const matchesQuery =
                !q ||
                l.vehicleNumber.toLowerCase().includes(q) ||
                l.driverName.toLowerCase().includes(q) ||
                l.officerName.toLowerCase().includes(q) ||
                l.slipNumber.toLowerCase().includes(q) ||
                l.purpose.toLowerCase().includes(q);

              return matchesOwnership && matchesVendor && matchesQuery;
            });

            const totalAttachedKm = filteredAttachedLogs.reduce((sum, l) => sum + l.totalKm, 0);
            const totalAttachedHours = filteredAttachedLogs.reduce((sum, l) => sum + l.totalHours, 0);
            const verifiedCount = filteredAttachedLogs.filter((l) => l.isVerifiedByOfficer).length;
            const totalTollParking = filteredAttachedLogs.reduce((sum, l) => sum + l.tollParkingCost, 0);

            const totalLogPages = Math.ceil(filteredAttachedLogs.length / attachedLogsPerPage) || 1;
            const paginatedAttachedLogs = filteredAttachedLogs.slice(
              (attachedLogPage - 1) * attachedLogsPerPage,
              attachedLogPage * attachedLogsPerPage
            );

            return (
              <>
                {/* Summary Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Attached Running KM
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-slate-900 font-mono">
                        {totalAttachedKm.toLocaleString()} KM
                      </span>
                      <span className="text-xs text-indigo-600 font-semibold">
                        {filteredAttachedLogs.length} Slips
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Certified distance run in govt duty
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Duty Hours Clocked
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-purple-700 font-mono">
                        {totalAttachedHours} Hrs
                      </span>
                      <span className="text-xs text-purple-600 font-medium">Recorded</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Includes camp &amp; outstation duty
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Officer Certified
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-emerald-700 font-mono">
                        {verifiedCount} / {filteredAttachedLogs.length}
                      </span>
                      <span className="text-xs text-emerald-600 font-semibold">
                        {filteredAttachedLogs.length > 0 ? Math.round((verifiedCount / filteredAttachedLogs.length) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Signed duty slips for billing claim
                    </p>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">
                      Toll &amp; Fastag Borne
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-bold text-amber-700 font-mono">
                        {formatCurrency(totalTollParking)}
                      </span>
                      <span className="text-xs text-amber-600 font-medium">Reimbursable</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Highway &amp; bridge toll slips
                    </p>
                  </div>
                </div>

                {/* Filters Toolbar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="lg:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">
                        Search Attached Duty Logs:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search vehicle number, driver, officer name, or slip..."
                          value={logSearchQuery}
                          onChange={(e) => {
                            setLogSearchQuery(e.target.value);
                            setAttachedLogPage(1);
                          }}
                          className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ownership Model:
                      </label>
                      <select
                        value={ownershipLogFilter}
                        onChange={(e) => {
                          setOwnershipLogFilter(e.target.value);
                          setAttachedLogPage(1);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      >
                        <option value="all">All Attached Types ({rawAttachedLogs.length})</option>
                        <option value="Owner-Driver">Driver-cum-Owner (DCO)</option>
                        <option value="Attached / Market Hire">Fleet Vendor Attached</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Filter by Partner / Vendor:
                      </label>
                      <select
                        value={selectedVendorLogFilter}
                        onChange={(e) => {
                          setSelectedVendorLogFilter(e.target.value);
                          setAttachedLogPage(1);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs"
                      >
                        <option value="all">All Vendors ({vendors.length})</option>
                        {vendors.map((vnd) => (
                          <option key={vnd.id} value={vnd.id}>
                            {vnd.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Showing <strong>{filteredAttachedLogs.length}</strong> duty logs for attached vehicles and owner-drivers
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Attached Duty Log Sheet
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date &amp; Slip</th>
                          <th className="py-2.5 px-3">Vehicle &amp; Model</th>
                          <th className="py-2.5 px-3">Ownership / Partner</th>
                          <th className="py-2.5 px-3">Assigned Officer</th>
                          <th className="py-2.5 px-3">Driver</th>
                          <th className="py-2.5 px-3 text-right">Odometer (Open &rarr; Close)</th>
                          <th className="py-2.5 px-3 text-right">Run &amp; Hours</th>
                          <th className="py-2.5 px-3 text-right">Toll</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {paginatedAttachedLogs.map((log) => {
                          const veh = attachedVehMap.get(log.vehicleId);
                          const vnd = vendors.find((v) => v.id === veh?.vendorId);

                          return (
                            <tr key={log.id} className="hover:bg-slate-50/70">
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900">{formatDate(log.date)}</div>
                                <span className="font-mono text-[10px] text-slate-500">Slip #{log.slipNumber}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-bold font-mono text-slate-900">{log.vehicleNumber}</div>
                                <div className="text-[10px] text-slate-500">{veh?.makeModel}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-800 truncate max-w-[150px]" title={vnd?.name}>
                                  {vnd?.name || 'Attached Vendor'}
                                </div>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                    veh?.ownershipType === 'Owner-Driver'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {veh?.ownershipType === 'Owner-Driver' ? 'Owner-Driver' : 'Vendor Attached'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-slate-900">{log.officerName}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={log.purpose}>
                                  {log.purpose}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-slate-800">{log.driverName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                {log.openingKm} &rarr; <strong>{log.closingKm}</strong>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="font-bold font-mono text-indigo-700">{log.totalKm} KM</div>
                                <div className="text-[10px] text-slate-500 font-mono">{log.totalHours} hrs</div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                                {log.tollParkingCost > 0 ? formatCurrency(log.tollParkingCost) : '-'}
                              </td>
                              <td className="py-2.5 px-3">
                                {log.isVerifiedByOfficer ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Officer Verified
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-semibold w-fit">
                                    Pending Sign
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalLogPages > 1 && (
                    <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                      <span>
                        Page <strong>{attachedLogPage}</strong> of <strong>{totalLogPages}</strong>
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setAttachedLogPage((p) => Math.max(1, p - 1))}
                          disabled={attachedLogPage === 1}
                          className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setAttachedLogPage((p) => Math.min(totalLogPages, p + 1))}
                          disabled={attachedLogPage === totalLogPages}
                          className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        /* Monthly Partner Settlements & Payout Vouchers Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Settlement Vouchers List */}
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Partner Settlements ({vendorSettlements.length})
              </h3>
              <button
                onClick={() => setIsSettlementModalOpen(true)}
                className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
              >
                + New Settlement
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {vendorSettlements.map((vset) => {
                const isSelected = selectedSettlementForPrint?.id === vset.id;

                return (
                  <div
                    key={vset.id}
                    onClick={() => setSelectedSettlementForPrint(vset)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-mono">{vset.voucherNumber}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                          vset.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {vset.paymentStatus}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 mt-1">{vset.vendorName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {vset.vehicleNumber} &bull; Month: {vset.monthYear}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Net Payable:</span>
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {formatCurrency(vset.netPayableToVendor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Printable Payout Voucher */}
          <div className="lg:col-span-2">
            {selectedSettlementForPrint ? (
              <div className="bg-white rounded-xl border border-slate-300 shadow-sm p-6 print:p-0 print:border-none space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
                  <div>
                    <span className="text-xs text-slate-500 uppercase font-semibold">
                      Attached Vehicle Payout Voucher
                    </span>
                    <h3 className="font-bold text-base text-slate-900 font-mono">
                      {selectedSettlementForPrint.voucherNumber}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-3">
                    {selectedSettlementForPrint.paymentStatus !== 'paid' && (
                      <button
                        onClick={() => {
                          const ref = prompt('Enter Bank Payment UTR / Transaction Reference:');
                          if (ref) onPaySettlement(selectedSettlementForPrint.id, ref);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Mark as Paid (भुगतान करें)
                      </button>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Printer className="w-4 h-4" />
                      Print Voucher
                    </button>
                  </div>
                </div>

                {/* Printable Document Body */}
                <div className="border border-slate-300 p-6 rounded-lg space-y-5 bg-white text-slate-900">
                  <div className="text-center border-b-2 border-slate-800 pb-3">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                      ATTACHED VEHICLE MONTHLY HIRING SETTLEMENT VOUCHER
                    </span>
                    <h2 className="text-lg font-black uppercase mt-0.5">
                      SARKARI FLEET SERVICES
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Tender Transport Contractor &bull; 42, Transport Nagar, Lucknow
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Vendor / Partner:</span>
                      <strong className="text-sm text-slate-900 block">{selectedSettlementForPrint.vendorName}</strong>
                      <span className="text-slate-600">Vehicle No: </span>
                      <strong className="font-mono">{selectedSettlementForPrint.vehicleNumber}</strong>
                    </div>

                    <div className="text-right">
                      <div><span className="text-slate-500">Voucher No: </span><strong className="font-mono">{selectedSettlementForPrint.voucherNumber}</strong></div>
                      <div><span className="text-slate-500">Billing Month: </span><strong>{selectedSettlementForPrint.monthYear}</strong></div>
                      <div><span className="text-slate-500">Date: </span><strong>{formatDate(selectedSettlementForPrint.settlementDate)}</strong></div>
                    </div>
                  </div>

                  {/* Calculation Breakdown Table */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 text-left">Earnings / Inclusions</th>
                          <th className="p-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2">Monthly Fixed Agreed Vehicle Rent</td>
                          <td className="p-2 text-right font-semibold font-mono">
                            {formatCurrency(selectedSettlementForPrint.agreedBaseRent)}
                          </td>
                        </tr>
                        {selectedSettlementForPrint.extraKmShare > 0 && (
                          <tr>
                            <td className="p-2">Extra KM Share (Reconciled from tender log)</td>
                            <td className="p-2 text-right font-semibold font-mono">
                              +{formatCurrency(selectedSettlementForPrint.extraKmShare)}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-bold">
                          <td className="p-2">Gross Payout Due</td>
                          <td className="p-2 text-right font-mono">
                            {formatCurrency(selectedSettlementForPrint.totalEarned)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="w-full text-xs border-t border-slate-300">
                      <thead className="bg-rose-50 text-rose-900 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-2 text-left">Deductions &amp; Recoveries</th>
                          <th className="p-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {selectedSettlementForPrint.deductionsAdvances > 0 && (
                          <tr>
                            <td className="p-2">Cash Advances Given to Driver / Vendor</td>
                            <td className="p-2 text-right text-rose-700 font-mono">
                              -{formatCurrency(selectedSettlementForPrint.deductionsAdvances)}
                            </td>
                          </tr>
                        )}
                        {selectedSettlementForPrint.deductionsFuelByContractor > 0 && (
                          <tr>
                            <td className="p-2">Fuel (Diesel/CNG) Supplied by Contractor</td>
                            <td className="p-2 text-right text-rose-700 font-mono">
                              -{formatCurrency(selectedSettlementForPrint.deductionsFuelByContractor)}
                            </td>
                          </tr>
                        )}
                        {selectedSettlementForPrint.deductionsFastagByContractor > 0 && (
                          <tr>
                            <td className="p-2">Fastag Toll Recharges Reimbursed</td>
                            <td className="p-2 text-right text-rose-700 font-mono">
                              -{formatCurrency(selectedSettlementForPrint.deductionsFastagByContractor)}
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-2">
                            {selectedSettlementForPrint.tdsAmount > 0 ? (
                              <>
                                <span className="font-semibold text-slate-800">
                                  TDS Deduction u/s {selectedSettlementForPrint.tdsSection || '194C'} @ {selectedSettlementForPrint.tdsPercent}%
                                </span>
                                <span className="block text-[10px] text-slate-500">
                                  (आयकर कटौती - Income Tax TDS on Vehicle Hire)
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-emerald-800">
                                  TDS Deduction: Nil (0% छूट)
                                </span>
                                <span className="block text-[10px] text-emerald-600">
                                  {selectedSettlementForPrint.tdsExemptionReason || 'Nil TDS Declaration under Section 194C(6)'}
                                </span>
                              </>
                            )}
                          </td>
                          <td className="p-2 text-right font-mono font-bold">
                            {selectedSettlementForPrint.tdsAmount > 0 ? (
                              <span className="text-rose-700">-{formatCurrency(selectedSettlementForPrint.tdsAmount)}</span>
                            ) : (
                              <span className="text-emerald-700">₹0 (छूट)</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Net Payout Banner */}
                  <div className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-800 font-bold block text-sm">
                        Net Amount Payable to Vendor / Owner:
                      </span>
                      <span className="text-slate-500 text-[11px]">
                        Status: <strong className="uppercase">{selectedSettlementForPrint.paymentStatus}</strong>
                        {selectedSettlementForPrint.paymentRef && ` (${selectedSettlementForPrint.paymentRef})`}
                      </span>
                    </div>
                    <span className="text-xl font-black text-emerald-950 font-mono">
                      {formatCurrency(selectedSettlementForPrint.netPayableToVendor)}
                    </span>
                  </div>

                  <div className="pt-6 border-t border-slate-300 flex justify-between text-[11px] text-slate-500">
                    <div>
                      <p>Prepared By: Accounts Section</p>
                      <p className="mt-8">Authorized Signatory (Contractor)</p>
                    </div>
                    <div className="text-right">
                      <p>Vendor / Owner Acknowledgement</p>
                      <p className="mt-8">Signature &amp; Stamp: __________________</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                Select a settlement voucher to view or print.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Partner Modal */}
      {isAddVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Handshake className="w-5 h-5 text-indigo-600" />
                <span>
                  {isEditingVendor
                    ? 'वेंडर व TDS विवरण संशोधित करें (Edit Partner & TDS)'
                    : 'Add Market Vendor / Owner-Driver (पार्टनर जोड़ें)'}
                </span>
              </h3>
              <button
                onClick={() => setIsAddVendorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveVendorSubmit} className="mt-4 space-y-4 text-xs">
              {/* Unique Vendor ID / Code */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>वेंडर यूनिक कोड (Vendor Unique ID / Code) *</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ✨ स्वतः तैयार (Auto-Generated)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={vendorFormData.vendorCode || ''}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, vendorCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. VND-101"
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg font-mono font-bold text-slate-900 bg-white uppercase tracking-wider text-sm shadow-2xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setVendorFormData({ ...vendorFormData, vendorCode: generateVendorUniqueId(vendors, vendorFormData.vendorType) })}
                    className="px-3 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shrink-0 flex items-center gap-1 shadow-2xs transition-colors"
                    title="नया यूनिक कोड पुनः जनरेट करें"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>नया कोड</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-tight">
                  यह अद्वितीय वेंडर आईडी सभी रेंट वाउचर, TDS प्रमाण पत्र, गाड़ी अटैचमेंट और बैंक विवरण पर दर्ज रहेगी।
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vendor or Owner-Driver Name (वेंडर या गाड़ी मालिक का नाम) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Awadh Tour & Travels OR Ramesh Yadav (Owner-Driver)"
                  value={vendorFormData.name || ''}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Partner Type (प्रकार) *
                  </label>
                  <select
                    value={vendorFormData.vendorType || 'fleet_vendor'}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      const defaultRate = newType === 'owner_driver' ? 1 : 2;
                      setVendorFormData({
                        ...vendorFormData,
                        vendorType: newType,
                        tdsRate: vendorFormData.isTdsApplicable !== false ? defaultRate : 0,
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="fleet_vendor">Fleet Vendor (मार्केट वेंडर / Subcontractor)</option>
                    <option value="owner_driver">Owner-Driver (अपनी गाड़ी खुद चलाने वाला)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9839011220"
                    value={vendorFormData.phone || ''}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Person Name (संपर्क व्यक्ति)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. मनोज त्रिपाठी"
                    value={vendorFormData.contactPerson || ''}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Monthly Agreed Rent Payout (₹ प्रति गाड़ी) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 31000"
                    value={vendorFormData.monthlyAgreedRatePerVehicle || ''}
                    onChange={(e) =>
                      setVendorFormData({
                        ...vendorFormData,
                        monthlyAgreedRatePerVehicle: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    PAN Card Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AAAFB1234F"
                    value={vendorFormData.panNumber || ''}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, panNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    GSTIN (यदि हो)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 09AAAFB1234F1Z2"
                    value={vendorFormData.gstin || ''}
                    onChange={(e) => setVendorFormData({ ...vendorFormData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono"
                  />
                </div>
              </div>

              {/* DEDICATED TDS CONFIGURATION SECTION */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 block text-xs">
                      TDS (आयकर कटौती) विकल्प
                    </span>
                    <span className="text-[11px] text-slate-500">
                      गाड़ी वेंडर के किराये से TDS काटना है या नहीं
                    </span>
                  </div>
                  {/* Toggle: TDS Katna hai ya nahi */}
                  <div className="inline-flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        setVendorFormData({
                          ...vendorFormData,
                          isTdsApplicable: true,
                          tdsRate:
                            vendorFormData.tdsRate && vendorFormData.tdsRate > 0
                              ? vendorFormData.tdsRate
                              : vendorFormData.vendorType === 'owner_driver'
                              ? 1
                              : 2,
                        })
                      }
                      className={`px-3 py-1 rounded-md transition-all ${
                        vendorFormData.isTdsApplicable !== false
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      हाँ, TDS काटना है
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setVendorFormData({
                          ...vendorFormData,
                          isTdsApplicable: false,
                          tdsRate: 0,
                          tdsExemptionReason:
                            vendorFormData.tdsExemptionReason ||
                            'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)',
                        })
                      }
                      className={`px-3 py-1 rounded-md transition-all ${
                        vendorFormData.isTdsApplicable === false
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      नहीं, TDS छूट (0%)
                    </button>
                  </div>
                </div>

                {vendorFormData.isTdsApplicable !== false ? (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        TDS दर चुनें (Select TDS Percentage):
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setVendorFormData({ ...vendorFormData, tdsRate: 1, tdsSection: '194C' })}
                          className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                            vendorFormData.tdsRate === 1
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-500'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          1%
                          <span className="block text-[9px] font-normal text-slate-500">व्यक्तिगत / वाहन स्वामी</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorFormData({ ...vendorFormData, tdsRate: 2, tdsSection: '194C' })}
                          className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                            vendorFormData.tdsRate === 2
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-500'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          2%
                          <span className="block text-[9px] font-normal text-slate-500">कंपनी / फर्म / LLP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVendorFormData({ ...vendorFormData, tdsRate: 5, tdsSection: '194C' })}
                          className={`p-2 rounded-lg border text-center font-bold text-xs transition-all ${
                            vendorFormData.tdsRate === 5
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs ring-1 ring-indigo-500'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          5%
                          <span className="block text-[9px] font-normal text-slate-500">अन्य विशेष दर</span>
                        </button>
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="कस्टम %"
                            value={
                              vendorFormData.tdsRate !== 1 &&
                              vendorFormData.tdsRate !== 2 &&
                              vendorFormData.tdsRate !== 5
                                ? vendorFormData.tdsRate || ''
                                : ''
                            }
                            onChange={(e) =>
                              setVendorFormData({
                                ...vendorFormData,
                                tdsRate: Number(e.target.value),
                              })
                            }
                            className="w-full text-xs font-bold py-1.5 outline-hidden"
                          />
                          <span className="text-slate-400 font-bold text-xs">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          TDS धारा (Income Tax Section)
                        </label>
                        <select
                          value={vendorFormData.tdsSection || '194C'}
                          onChange={(e) => setVendorFormData({ ...vendorFormData, tdsSection: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="194C">Section 194C (वाहन ठेका / ट्रांसपोर्ट सब-कॉन्ट्रैक्ट)</option>
                          <option value="194I">Section 194I (प्लांट / मशीनरी / गाड़ी किराया)</option>
                          <option value="194Q">Section 194Q (माल / उपकरण क्रय)</option>
                          <option value="Other">अन्य धारा (Other)</option>
                        </select>
                      </div>
                      <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 flex flex-col justify-center">
                        <span className="text-[10px] text-indigo-700 font-semibold">लागू TDS कटौती दर:</span>
                        <span className="text-sm font-black text-indigo-900 font-mono">
                          {vendorFormData.tdsRate || 0}% ({vendorFormData.tdsSection || '194C'})
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="block font-semibold text-slate-700">
                      TDS न काटने का कारण (Nil TDS Exemption Reason):
                    </label>
                    <select
                      value={
                        vendorFormData.tdsExemptionReason ||
                        'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)'
                      }
                      onChange={(e) =>
                        setVendorFormData({ ...vendorFormData, tdsExemptionReason: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                    >
                      <option value="Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)">
                        Section 194C(6) - वाहन स्वामी स्व-घोषणा (Declaration owning &le; 10 vehicles)
                      </option>
                      <option value="वार्षिक भुगतान ₹30,000 / ₹1,00,000 थ्रेशोल्ड सीमा से कम">
                        वार्षिक भुगतान ₹30,000 / ₹1,00,000 थ्रेशोल्ड सीमा से कम (Below Threshold)
                      </option>
                      <option value="Form 13 - Nil / Lower TDS Certificate प्राप्त">
                        Form 13 - Nil / Lower TDS Certificate प्राप्त
                      </option>
                      <option value="अन्य वैधानिक छूट (Other Exemption)">
                        अन्य वैधानिक छूट (Other Exemption)
                      </option>
                    </select>
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      ℹ️ इस वेंडर के मासिक वाउचर से <strong>0% TDS</strong> कटेगा (कोई कटौती नहीं होगी)।
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Account Details (for RTGS/NEFT Payouts)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank A/C: 50200088912, IFSC: HDFC0001002"
                  value={vendorFormData.bankAccountDetails || ''}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, bankAccountDetails: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Address / Operational Base
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transport Nagar, Kanpur Road, Lucknow"
                  value={vendorFormData.address || ''}
                  onChange={(e) => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddVendorModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isEditingVendor ? 'अपडेट करें (Update Partner)' : 'सुरक्षित करें (Save Partner)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Settlement Modal */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-indigo-600" />
                <span>Calculate Monthly Vendor Payout (वेंडर किराया पर्ची बनाएं)</span>
              </h3>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveSettlementSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Select Attached Vehicle *
                  </label>
                  <select
                    required
                    value={settleVehicleId}
                    onChange={(e) => handleVehicleSelectInSettlement(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    {attachedVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.vendorName || 'Attached'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Settlement Month *
                  </label>
                  <input
                    type="month"
                    required
                    value={settleMonthYear}
                    onChange={(e) => setSettleMonthYear(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Earnings Inputs */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800">1. Agreed Rent &amp; Extra KM Earnings</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Monthly Base Rent (₹)</label>
                    <input
                      type="number"
                      required
                      value={settleAgreedRent}
                      onChange={(e) => setSettleAgreedRent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Extra KM Share (₹)</label>
                    <input
                      type="number"
                      value={settleExtraKmShare}
                      onChange={(e) => setSettleExtraKmShare(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Inputs */}
              <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 space-y-3">
                <div className="font-bold text-rose-900">2. Deductions (Contractor Provided Advance / Fuel)</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-rose-800 mb-1">Advances (₹)</label>
                    <input
                      type="number"
                      value={settleAdvancesDeduction}
                      onChange={(e) => setSettleAdvancesDeduction(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-800 mb-1">Fuel Deducted (₹)</label>
                    <input
                      type="number"
                      value={settleFuelDeduction}
                      onChange={(e) => setSettleFuelDeduction(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-800 mb-1">Fastag Deducted (₹)</label>
                    <input
                      type="number"
                      value={settleFastagDeduction}
                      onChange={(e) => setSettleFastagDeduction(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC TDS DEDUCTION OPTIONS IN SETTLEMENT */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      3. TDS कटौती विकल्प (TDS Deduction Settings)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {selectedVendor ? `${selectedVendor.name} (PAN: ${selectedVendor.panNumber || 'N/A'})` : 'वेंडर TDS'}
                    </span>
                  </div>
                  <div className="inline-flex items-center bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setSettleIsTdsApplicable(true)}
                      className={`px-3 py-1 rounded transition-all ${
                        settleIsTdsApplicable
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TDS काटना है
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettleIsTdsApplicable(false)}
                      className={`px-3 py-1 rounded transition-all ${
                        !settleIsTdsApplicable
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      TDS नहीं काटना (0%)
                    </button>
                  </div>
                </div>

                {settleIsTdsApplicable ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1 border-t border-slate-200">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        TDS दर (% दर चुनें या लिखें):
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 5].map((rate) => (
                          <button
                            key={rate}
                            type="button"
                            onClick={() => setSettleTdsPercent(rate)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              settleTdsPercent === rate
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={
                              settleTdsPercent !== 1 && settleTdsPercent !== 2 && settleTdsPercent !== 5
                                ? settleTdsPercent
                                : ''
                            }
                            onChange={(e) => setSettleTdsPercent(Number(e.target.value))}
                            className="w-14 text-xs font-bold py-1 outline-hidden"
                            placeholder="अन्य %"
                          />
                          <span className="text-slate-400 font-bold text-xs">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-rose-50 p-2.5 rounded-lg text-slate-700 border border-rose-200 flex flex-col justify-center">
                      <span className="text-[10px] text-rose-800 font-semibold">
                        TDS कटौती राशि ({effectiveTdsPercent}% u/s {settleTdsSection}):
                      </span>
                      <span className="font-bold text-rose-700 font-mono text-base">
                        -{formatCurrency(calculatedTds)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold block">TDS छूट लागू (0% TDS)</span>
                      <span className="text-[11px] text-amber-700">
                        {settleTdsExemptionReason || 'Section 194C(6) वाहन स्वामी स्व-घोषणा के तहत कोई कटौती नहीं।'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 text-sm">₹0 TDS</span>
                  </div>
                )}
              </div>

              {/* Net Payout Calculation Highlight */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 block font-semibold">Net Payout to Vendor / Owner</span>
                  <span className="text-[11px] text-slate-500">
                    (Gross Earnings ₹{totalEarned.toLocaleString('en-IN')} - Deductions ₹{totalDeductions.toLocaleString('en-IN')} - TDS ₹{calculatedTds.toLocaleString('en-IN')})
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {formatCurrency(netPayable)}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save &amp; Generate Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Fleet Onboarding Modal (Owner-Driver, Attached Car Owner, Company Vehicle) */}
      <FleetVehicleOnboardingModal
        isOpen={isAddOwnerDriverModalOpen || isAddCarOwnerModalOpen}
        onClose={() => {
          setIsAddOwnerDriverModalOpen(false);
          setIsAddCarOwnerModalOpen(false);
        }}
        initialType={isAddOwnerDriverModalOpen ? 'owner_driver' : 'car_owner'}
        tenders={tenders}
        drivers={drivers}
        vendors={vendors}
        onSaveVehicle={(v) => {
          if (onSaveVehicle) onSaveVehicle(v);
        }}
        onSaveDriver={(d) => {
          if (onSaveDriver) onSaveDriver(d);
        }}
        onSaveVendor={onSaveVendor}
      />

      {/* Excel Bulk Import Modal (Vehicles & Drivers) */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        initialType="vehicles"
        existingVehicles={vehicles}
        existingDrivers={drivers}
        tenders={tenders}
        vendors={vendors}
        onImportVehicles={onBulkImportVehicles}
        onImportDrivers={onBulkImportDrivers}
      />
    </div>
  );
};
