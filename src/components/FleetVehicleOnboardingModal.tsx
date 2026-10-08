import React, { useState } from 'react';
import {
  Car,
  UserCheck,
  Building2,
  X,
  CheckCircle2,
  ShieldCheck,
  HelpCircle,
  AlertCircle,
  IndianRupee,
  FileText,
  User,
  Phone,
  CreditCard,
  Gauge,
  Calendar,
} from 'lucide-react';
import { Vehicle, Driver, Vendor, Tender, FuelPolicy } from '../types';
import { formatCurrency } from '../utils/calculations';
import { generateDriverUniqueId, generateVendorUniqueId } from '../utils/idGenerator';

export type OnboardingType = 'owner_driver' | 'car_owner' | 'company_vehicle';

interface FleetVehicleOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: OnboardingType;
  tenders: Tender[];
  drivers: Driver[];
  vendors: Vendor[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onSaveDriver?: (driver: Driver) => void;
  onSaveVendor?: (vendor: Vendor) => void;
}

export const FleetVehicleOnboardingModal: React.FC<FleetVehicleOnboardingModalProps> = ({
  isOpen,
  onClose,
  initialType = 'owner_driver',
  tenders,
  drivers,
  vendors,
  onSaveVehicle,
  onSaveDriver,
  onSaveVendor,
}) => {
  const [activeType, setActiveType] = useState<OnboardingType>(initialType);

  // Sync initial type if it changes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
    }
  }, [isOpen, initialType]);

  // -------------------------------------------------------------
  // STATE 1: OWNER-DRIVER (मालिक-चालक: गाड़ी भी अपनी, खुद चलाएगा)
  // -------------------------------------------------------------
  const [odName, setOdName] = useState('');
  const [odPhone, setOdPhone] = useState('');
  const [odAlternatePhone, setOdAlternatePhone] = useState('');
  const [odAddress, setOdAddress] = useState('');
  const [odLicenseNumber, setOdLicenseNumber] = useState('');
  const [odLicenseExpiry, setOdLicenseExpiry] = useState('2030-12-31');
  const [odPanNumber, setOdPanNumber] = useState('');
  const [odBankAccount, setOdBankAccount] = useState('');

  const [odVehicleNumber, setOdVehicleNumber] = useState('');
  const [odMakeModel, setOdMakeModel] = useState('');
  const [odVehicleType, setOdVehicleType] = useState<'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV'>('Sedan');
  const [odFuelType, setOdFuelType] = useState<'Diesel' | 'Petrol' | 'CNG' | 'Electric'>('Diesel');
  const [odTenderId, setOdTenderId] = useState(tenders[0]?.id || '');
  const [odOdometer, setOdOdometer] = useState<number>(35000);
  const [odMonthlyRent, setOdMonthlyRent] = useState<number>(32000);

  // TDS for Owner-Driver
  const [odIsTdsApplicable, setOdIsTdsApplicable] = useState<boolean>(true);
  const [odTdsRate, setOdTdsRate] = useState<number>(1); // 1% for individual
  const [odTdsSection, setOdTdsSection] = useState<string>('194C');
  const [odTdsExemptionReason, setOdTdsExemptionReason] = useState<string>(
    'Section 194C(6) - 10 से कम वाहन स्वामी घोषणा (Nil TDS Declaration)'
  );

  // -------------------------------------------------------------
  // STATE 2: CAR OWNER ONLY (केवल गाड़ी मालिक: ड्राइवर अलग रहेगा)
  // -------------------------------------------------------------
  const [coExistingVendorId, setCoExistingVendorId] = useState<string>('new');
  const [coOwnerName, setCoOwnerName] = useState('');
  const [coContactPerson, setCoContactPerson] = useState('');
  const [coPhone, setCoPhone] = useState('');
  const [coAlternatePhone, setCoAlternatePhone] = useState('');
  const [coPanNumber, setCoPanNumber] = useState('');
  const [coGstin, setCoGstin] = useState('');
  const [coAddress, setCoAddress] = useState('');
  const [coBankAccount, setCoBankAccount] = useState('');
  const [coVendorType, setCoVendorType] = useState<'fleet_vendor' | 'owner_driver'>('fleet_vendor');

  const [coVehicleNumber, setCoVehicleNumber] = useState('');
  const [coMakeModel, setCoMakeModel] = useState('');
  const [coVehicleType, setCoVehicleType] = useState<'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV'>('Sedan');
  const [coFuelType, setCoFuelType] = useState<'Diesel' | 'Petrol' | 'CNG' | 'Electric'>('Diesel');
  const [coTenderId, setCoTenderId] = useState(tenders[0]?.id || '');
  const [coOdometer, setCoOdometer] = useState<number>(40000);
  const [coMonthlyRent, setCoMonthlyRent] = useState<number>(31000);

  // Driver Assignment for Car Owner vehicle
  const [coDriverAssignmentMode, setCoDriverAssignmentMode] = useState<'assign_now' | 'assign_later'>('assign_now');
  const [coAssignedDriverId, setCoAssignedDriverId] = useState<string>('');

  // TDS for Car Owner
  const [coIsTdsApplicable, setCoIsTdsApplicable] = useState<boolean>(true);
  const [coTdsRate, setCoTdsRate] = useState<number>(2); // 2% for company/firm, 1% for individual
  const [coTdsSection, setCoTdsSection] = useState<string>('194C');
  const [coTdsExemptionReason, setCoTdsExemptionReason] = useState<string>('');

  // -------------------------------------------------------------
  // STATE 3: COMPANY OWNED VEHICLE (कंपनी की खुद की गाड़ी)
  // -------------------------------------------------------------
  const [cvVehicleNumber, setCvVehicleNumber] = useState('');
  const [cvMakeModel, setCvMakeModel] = useState('');
  const [cvVehicleType, setCvVehicleType] = useState<'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV'>('Sedan');
  const [cvFuelType, setCvFuelType] = useState<'Diesel' | 'Petrol' | 'CNG' | 'Electric'>('Diesel');
  const [cvTenderId, setCvTenderId] = useState(tenders[0]?.id || '');
  const [cvOdometer, setCvOdometer] = useState<number>(20000);
  const [cvAssignedDriverId, setCvAssignedDriverId] = useState<string>('');
  const [cvPurchaseCost, setCvPurchaseCost] = useState<number>(850000);
  const [cvFinancingBank, setCvFinancingBank] = useState<string>('HDFC Bank Auto Loan');
  const [cvFitnessExpiry, setCvFitnessExpiry] = useState<string>('2028-06-30');
  const [cvInsuranceExpiry, setCvInsuranceExpiry] = useState<string>('2027-04-15');
  const [cvPucExpiry, setCvPucExpiry] = useState<string>('2026-12-31');

  if (!isOpen) return null;

  // Unassigned drivers for selection
  const unassignedDrivers = drivers.filter((d) => !d.currentVehicleId);

  // -------------------------------------------------------------
  // SUBMIT HANDLERS
  // -------------------------------------------------------------
  const handleOwnerDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!odName.trim() || !odPhone.trim() || !odVehicleNumber.trim() || !odMakeModel.trim()) {
      alert('कृपया चालक का नाम, मोबाइल नंबर, गाड़ी नंबर व मेक/मॉडल अवश्य दर्ज करें।');
      return;
    }

    const cleanVehNum = odVehicleNumber.trim().toUpperCase();
    const cleanName = odName.trim();
    const generatedVndId = generateVendorUniqueId(vendors, 'owner_driver');
    const generatedDrvId = generateDriverUniqueId(drivers);
    const vId = `veh-${cleanVehNum.replace(/\s+/g, '')}`;
    const dId = generatedDrvId;
    const vndId = generatedVndId;

    const isTds = odIsTdsApplicable && Number(odTdsRate) > 0;
    const finalTdsRate = isTds ? Number(odTdsRate) : 0;

    // 1. Create Vendor Record (for monthly settlement payouts)
    const newVendor: Vendor = {
      id: vndId,
      vendorCode: vndId,
      name: `${cleanName} (मालिक-चालक)`,
      contactPerson: cleanName,
      phone: odPhone.trim(),
      alternatePhone: odAlternatePhone.trim() || undefined,
      panNumber: (odPanNumber || '').trim().toUpperCase() || 'PAN-ON-FILE',
      address: odAddress.trim() || 'Uttar Pradesh',
      bankAccountDetails: odBankAccount.trim() || 'Bank Details to be provided',
      vendorType: 'owner_driver',
      monthlyAgreedRatePerVehicle: Number(odMonthlyRent) || 32000,
      isTdsApplicable: isTds,
      tdsRate: finalTdsRate,
      tdsSection: isTds ? odTdsSection : undefined,
      tdsExemptionReason: !isTds
        ? (odTdsExemptionReason || 'Section 194C(6) - 10 से कम वाहन स्वामी घोषणा (Nil TDS Declaration)')
        : undefined,
      status: 'active',
      notes: `मालिक-चालक। अपनी गाड़ी ${cleanVehNum} खुद चलाते हैं।`,
    };

    // 2. Create Driver Record (linked to this vehicle)
    const newDriver: Driver = {
      id: dId,
      driverCode: dId,
      name: cleanName,
      phone: odPhone.trim(),
      alternatePhone: odAlternatePhone.trim() || undefined,
      address: odAddress.trim() || 'Uttar Pradesh',
      licenseNumber: odLicenseNumber.trim().toUpperCase() || `DL-OD-${Date.now().toString().slice(-6)}`,
      licenseExpiry: odLicenseExpiry || '2030-12-31',
      policeVerificationDate: new Date().toISOString().slice(0, 10),
      policeVerificationExpiry: '2028-12-31',
      aadharNumber: 'Aadhaar on record',
      panNumber: (odPanNumber || '').trim().toUpperCase() || undefined,
      joiningDate: new Date().toISOString().slice(0, 10),
      monthlySalary: 0, // No company salary; compensated through monthly vehicle rent settlement
      dailyDaRate: 350,
      status: 'active',
      currentVehicleId: vId,
      fuelPolicy: 'monthly_fixed_budget',
      monthlyFuelBudgetAmount: 0,
      bankAccountDetails: odBankAccount.trim() || undefined,
      employmentType: 'owner_driver',
    };

    // 3. Create Vehicle Record (linked to vendor and driver)
    const newVehicle: Vehicle = {
      id: vId,
      vehicleNumber: cleanVehNum,
      makeModel: odMakeModel.trim(),
      vehicleType: odVehicleType,
      fuelType: odFuelType,
      color: 'White',
      modelYear: 2024,
      ownershipType: 'Owner-Driver',
      registrationType: 'Commercial',
      vendorId: vndId,
      vendorName: newVendor.name,
      monthlyVendorRent: Number(odMonthlyRent) || 32000,
      tenderId: odTenderId || tenders[0]?.id || '',
      currentDriverId: dId,
      currentOdometer: Number(odOdometer) || 35000,
      rtoFitnessExpiry: '2028-06-30',
      insuranceExpiry: '2027-04-15',
      pucExpiry: '2026-12-31',
      roadTaxExpiry: '2028-12-31',
      permitExpiry: '2028-06-30',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
    };

    if (onSaveVendor) onSaveVendor(newVendor);
    if (onSaveDriver) onSaveDriver(newDriver);
    onSaveVehicle(newVehicle);

    onClose();
  };

  const handleCarOwnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coVehicleNumber.trim() || !coMakeModel.trim()) {
      alert('कृपया गाड़ी रजिस्ट्रेशन नंबर व मॉडल अवश्य दर्ज करें।');
      return;
    }

    let targetVendorId = coExistingVendorId;
    let targetVendorName = '';

    const isTds = coIsTdsApplicable && Number(coTdsRate) > 0;
    const finalTdsRate = isTds ? Number(coTdsRate) : 0;

    if (coExistingVendorId === 'new') {
      if (!coOwnerName.trim() || !coPhone.trim()) {
        alert('कृपया वेंडर / गाड़ी मालिक का नाम और मोबाइल नंबर दर्ज करें।');
        return;
      }
      targetVendorId = generateVendorUniqueId(vendors, coVendorType);
      targetVendorName = coOwnerName.trim();

      const newVendor: Vendor = {
        id: targetVendorId,
        vendorCode: targetVendorId,
        name: targetVendorName,
        contactPerson: (coContactPerson || targetVendorName).trim(),
        phone: coPhone.trim(),
        alternatePhone: coAlternatePhone.trim() || undefined,
        panNumber: (coPanNumber || '').trim().toUpperCase() || 'PAN-ON-FILE',
        gstin: coGstin.trim() || undefined,
        address: coAddress.trim() || 'Uttar Pradesh',
        bankAccountDetails: coBankAccount.trim() || 'A/C Details to be provided',
        vendorType: coVendorType,
        monthlyAgreedRatePerVehicle: Number(coMonthlyRent) || 31000,
        isTdsApplicable: isTds,
        tdsRate: finalTdsRate,
        tdsSection: isTds ? coTdsSection : undefined,
        tdsExemptionReason: !isTds
          ? (coTdsExemptionReason || 'Section 194C(6) - वाहन स्वामी स्व-घोषणा (10 से कम वाहन)')
          : undefined,
        status: 'active',
        notes: `अनुबंधित गाड़ी मालिक। वाहन: ${coVehicleNumber.trim().toUpperCase()}`,
      };

      if (onSaveVendor) onSaveVendor(newVendor);
    } else {
      const existing = vendors.find((v) => v.id === coExistingVendorId);
      targetVendorName = existing?.name || 'Attached Vendor';
    }

    const vId = `veh-${Date.now()}`;
    const cleanVehNum = coVehicleNumber.trim().toUpperCase();
    const assignedDriver = coDriverAssignmentMode === 'assign_now' && coAssignedDriverId ? coAssignedDriverId : undefined;

    const newVehicle: Vehicle = {
      id: vId,
      vehicleNumber: cleanVehNum,
      makeModel: coMakeModel.trim(),
      vehicleType: coVehicleType,
      fuelType: coFuelType,
      color: 'White',
      modelYear: 2024,
      ownershipType: 'Attached / Market Hire',
      registrationType: 'Commercial',
      vendorId: targetVendorId,
      vendorName: targetVendorName,
      monthlyVendorRent: Number(coMonthlyRent) || 31000,
      tenderId: coTenderId || tenders[0]?.id || '',
      currentDriverId: assignedDriver,
      currentOdometer: Number(coOdometer) || 40000,
      rtoFitnessExpiry: '2028-06-30',
      insuranceExpiry: '2027-04-15',
      pucExpiry: '2026-12-31',
      roadTaxExpiry: '2028-12-31',
      permitExpiry: '2028-06-30',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
    };

    onSaveVehicle(newVehicle);

    // If driver assigned, update driver
    if (assignedDriver && onSaveDriver) {
      const drv = drivers.find((d) => d.id === assignedDriver);
      if (drv) {
        onSaveDriver({ ...drv, currentVehicleId: vId });
      }
    }

    onClose();
  };

  const handleCompanyVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvVehicleNumber.trim() || !cvMakeModel.trim()) {
      alert('कृपया गाड़ी रजिस्ट्रेशन नंबर व मॉडल दर्ज करें।');
      return;
    }

    const vId = `veh-${Date.now()}`;
    const cleanVehNum = cvVehicleNumber.trim().toUpperCase();

    const newVehicle: Vehicle = {
      id: vId,
      vehicleNumber: cleanVehNum,
      makeModel: cvMakeModel.trim(),
      vehicleType: cvVehicleType,
      fuelType: cvFuelType,
      color: 'White',
      modelYear: 2025,
      ownershipType: 'Company Owned',
      registrationType: 'Commercial',
      tenderId: cvTenderId || tenders[0]?.id || '',
      currentDriverId: cvAssignedDriverId || undefined,
      currentOdometer: Number(cvOdometer) || 20000,
      purchaseCost: Number(cvPurchaseCost) || 850000,
      financingBank: cvFinancingBank.trim() || undefined,
      rtoFitnessExpiry: cvFitnessExpiry || '2028-06-30',
      insuranceExpiry: cvInsuranceExpiry || '2027-04-15',
      pucExpiry: cvPucExpiry || '2026-12-31',
      roadTaxExpiry: '2028-12-31',
      permitExpiry: '2028-06-30',
      status: 'active',
      fuelPolicy: 'monthly_fixed_budget',
    };

    onSaveVehicle(newVehicle);

    if (cvAssignedDriverId && onSaveDriver) {
      const drv = drivers.find((d) => d.id === cvAssignedDriverId);
      if (drv) {
        onSaveDriver({ ...drv, currentVehicleId: vId });
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Car className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                नया वाहन व पार्टनर ऑनबोर्डिंग (Add Vehicle / Partner)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              अपनी जरूरत के अनुसार सही विकल्प चुनें - सिस्टम ड्राइवर, गाड़ी व टीडीएस हिसाब स्वतः लिंक कर देगा
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Option Primary Selector (Segmented Cards) */}
        <div className="p-5 border-b border-slate-200 bg-slate-100/60">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <span>वाहन व पार्टनर का प्रकार चुनें (Select Ownership Category):</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Option 1: Owner-Driver */}
            <button
              type="button"
              onClick={() => setActiveType('owner_driver')}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                activeType === 'owner_driver'
                  ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activeType === 'owner_driver' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">1. मालिक-चालक</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                <strong>गाड़ी भी अपनी, चलाएगा भी खुद</strong>। ड्राइवर + गाड़ी + वेंडर तीनों एक साथ स्वतः लिंक होंगे।
              </p>
              <div className="mt-2 text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                <span>TDS 1% / 0% धारा 194C(6)</span>
              </div>
            </button>

            {/* Option 2: Car Owner Only */}
            <button
              type="button"
              onClick={() => setActiveType('car_owner')}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                activeType === 'car_owner'
                  ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activeType === 'car_owner' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Car className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">2. केवल गाड़ी मालिक</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                <strong>बंदे की केवल गाड़ी है</strong>, वह खुद नहीं चलाएगा। गाड़ी मालिक जुड़ेगा, ड्राइवर अलग तैनात होगा।
              </p>
              <div className="mt-2 text-[10px] text-indigo-800 font-semibold flex items-center gap-1">
                <span>वेंडर किराया + TDS 2%/1%</span>
              </div>
            </button>

            {/* Option 3: Company Vehicle */}
            <button
              type="button"
              onClick={() => setActiveType('company_vehicle')}
              className={`p-3.5 rounded-xl border text-left transition-all relative ${
                activeType === 'company_vehicle'
                  ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                    activeType === 'company_vehicle' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="font-bold text-xs text-slate-900">3. कंपनी की गाड़ी</div>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                <strong>शक्ति ट्रैवल्स द्वारा खरीदी गई</strong> अपनी गाड़ी। EMI/लोन, फिटनेस, परमिट व पूर्ण नियंत्रण।
              </p>
              <div className="mt-2 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                <span>कंपनी एसेट व मेंटेनेंस</span>
              </div>
            </button>
          </div>
        </div>

        {/* TAB 1 CONTENT: OWNER-DRIVER */}
        {activeType === 'owner_driver' && (
          <form onSubmit={handleOwnerDriverSubmit} className="p-6 space-y-5 text-xs">
            <div className="bg-emerald-50/90 border border-emerald-200 p-3.5 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-emerald-900">
                <span className="font-bold block text-xs">
                  मालिक-चालक (Owner-Driver) ऑनबोर्डिंग:
                </span>
                यह फॉर्म भरते ही <strong>चालक (Driver)</strong>, <strong>वाहन (Vehicle)</strong> और{' '}
                <strong>वेंडर (Vendor)</strong> तीनों स्वतः तैयार हो जाएंगे। चालक को कोई कंपनी सैलरी नहीं दी जाती,
                बल्कि मासिक तयशुदा किराया/सेटलमेंट वाउचर से भुगतान होता है।
              </div>
            </div>

            {/* Section 1: Driver / Owner Details */}
            <div className="space-y-3">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. चालक व मालिक की व्यक्तिगत जानकारी (Driver / Owner Info)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    चालक / मालिक का नाम *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. संतोष कुमार मौर्य"
                    value={odName}
                    onChange={(e) => setOdName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मोबाइल नंबर (Primary Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="उदा. 9415012345"
                    value={odPhone}
                    onChange={(e) => setOdPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    दूसरा मोबाइल (वैकल्पिक)
                  </label>
                  <input
                    type="tel"
                    placeholder="उदा. 9839098765"
                    value={odAlternatePhone}
                    onChange={(e) => setOdAlternatePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ड्राइविंग लाइसेंस नंबर (DL) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. UP32-20180045612"
                    value={odLicenseNumber}
                    onChange={(e) => setOdLicenseNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    लाइसेंस वैधता (DL Expiry)
                  </label>
                  <input
                    type="date"
                    value={odLicenseExpiry}
                    onChange={(e) => setOdLicenseExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    पैन नंबर (PAN Number) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="उदा. ABCDM1234E"
                    value={odPanNumber}
                    onChange={(e) => setOdPanNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    स्थायी पता (Address)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. ग्राम व पोस्ट मलिहाबाद, लखनऊ"
                    value={odAddress}
                    onChange={(e) => setOdAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    बैंक खाता विवरण (A/C No, IFSC, Bank Name)
                  </label>
                  <input
                    type="text"
                    placeholder="उदा. SBI A/c 30192837461, IFSC: SBIN0001234"
                    value={odBankAccount}
                    onChange={(e) => setOdBankAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Details */}
            <div className="space-y-3 pt-2">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. अनुबंधित गाड़ी का विवरण (Attached Vehicle Details)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    गाड़ी नंबर (Yellow Plate) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. UP32 LN 8844"
                    value={odVehicleNumber}
                    onChange={(e) => setOdVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मेक व मॉडल (Make &amp; Model) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Maruti Dzire VXi"
                    value={odMakeModel}
                    onChange={(e) => setOdMakeModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ईंधन प्रकार (Fuel)
                  </label>
                  <select
                    value={odFuelType}
                    onChange={(e) => setOdFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Diesel">Diesel (डीजल)</option>
                    <option value="CNG">CNG (सीएनजी)</option>
                    <option value="Petrol">Petrol (पेट्रोल)</option>
                    <option value="Electric">Electric (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    वर्तमान ओडोमीटर (KM)
                  </label>
                  <input
                    type="number"
                    value={odOdometer}
                    onChange={(e) => setOdOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  सरकारी टेंडर / विभाग में तैनाती (Attach to Govt Tender) *
                </label>
                <select
                  required
                  value={odTenderId}
                  onChange={(e) => setOdTenderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  {tenders.length === 0 ? (
                    <option value="">कोई टेंडर नहीं (बाद में असाइन करें)</option>
                  ) : (
                    tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.departmentName} - {t.tenderNumber} (मासिक बजट ₹{t.baseMonthlyRate?.toLocaleString('en-IN')})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Section 3: Commercial Terms & TDS Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>3. व्यावसायिक शर्तें व टीडीएस नियम (Commercial &amp; TDS Terms)</span>
                <span className="text-[11px] text-slate-500">मासिक किराया व आयकर धारा 194C</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मासिक तयशुदा किराया (Monthly Agreed Rent) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={odMonthlyRent}
                      onChange={(e) => setOdMonthlyRent(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    मासिक सेटलमेंट में यह आधार किराया बनेगा
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS कटौती विकल्प (TDS Deduction)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOdIsTdsApplicable(true);
                        setOdTdsRate(1);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all text-center ${
                        odIsTdsApplicable
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      1% TDS काटना है
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOdIsTdsApplicable(false);
                        setOdTdsRate(0);
                      }}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all text-center ${
                        !odIsTdsApplicable
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      0% TDS (194C(6) छूट)
                    </button>
                  </div>
                </div>
              </div>

              {!odIsTdsApplicable && (
                <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                  <strong>194C(6) स्व-घोषणा लागू:</strong> 10 से कम वाहन स्वामी होने की स्थिति में पैन कार्ड प्रस्तुत करने
                  पर टीडीएस 0% कटेगा।
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>मालिक-चालक सुरक्षित करें (Save Owner-Driver)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2 CONTENT: CAR OWNER ONLY */}
        {activeType === 'car_owner' && (
          <form onSubmit={handleCarOwnerSubmit} className="p-6 space-y-5 text-xs">
            <div className="bg-indigo-50/90 border border-indigo-200 p-3.5 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0 mt-0.5">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-indigo-900">
                <span className="font-bold block text-xs">
                  केवल गाड़ी मालिक (Attached Car Owner Only):
                </span>
                यह विकल्प तब चुनें जब किसी व्यक्ति/वेंडर की केवल गाड़ी शक्ति ट्रैवल्स में अटैच हो रही है और वह{' '}
                <strong>खुद गाड़ी नहीं चलाएगा</strong>। गाड़ी पर कंपनी का कोई अन्य चालक तैनात होगा अथवा बाद में अलॉट किया
                जा सकता है।
              </div>
            </div>

            {/* Existing Vendor vs New Vendor Selector */}
            <div className="space-y-3">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>1. गाड़ी मालिक / वेंडर का चयन या नया जोड़ें (Vendor Info)</span>
                </div>
                {vendors.length > 0 && (
                  <select
                    value={coExistingVendorId}
                    onChange={(e) => setCoExistingVendorId(e.target.value)}
                    className="px-2 py-1 border border-indigo-300 rounded-md text-xs font-semibold bg-white text-indigo-900"
                  >
                    <option value="new">+ नया वेंडर/मालिक दर्ज करें</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        मौजूदा: {v.name} (PAN: {v.panNumber || 'N/A'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {coExistingVendorId === 'new' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        मालिक / ट्रांसपोर्टर / फर्म का नाम *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="उदा. श्री बालाजी टूर्स या राजेश वर्मा"
                        value={coOwnerName}
                        onChange={(e) => setCoOwnerName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        संपर्क व्यक्ति (Contact Person)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. राजेश वर्मा"
                        value={coContactPerson}
                        onChange={(e) => setCoContactPerson(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        मोबाइल नंबर (Mobile) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="उदा. 9839012345"
                        value={coPhone}
                        onChange={(e) => setCoPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        पैन नंबर (PAN Number) *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={10}
                        placeholder="उदा. ABCDE1234F"
                        value={coPanNumber}
                        onChange={(e) => setCoPanNumber(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        GSTIN (यदि फर्म का हो)
                      </label>
                      <input
                        type="text"
                        placeholder="09AAAAA0000A1Z5"
                        value={coGstin}
                        onChange={(e) => setCoGstin(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        मालिक का प्रकार
                      </label>
                      <select
                        value={coVendorType}
                        onChange={(e) => setCoVendorType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      >
                        <option value="fleet_vendor">ट्रांसपोर्टर / फ्लीट वेंडर</option>
                        <option value="owner_driver">एकल गाड़ी मालिक (व्यक्तिगत)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        पता (Address)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. आलमबाग, लखनऊ"
                        value={coAddress}
                        onChange={(e) => setCoAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        बैंक खाता विवरण (किराया भुगतान हेतु)
                      </label>
                      <input
                        type="text"
                        placeholder="उदा. PNB A/c 0891283746, IFSC: PUNB0089100"
                        value={coBankAccount}
                        onChange={(e) => setCoBankAccount(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      चयनित वेंडर:{' '}
                      {vendors.find((v) => v.id === coExistingVendorId)?.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      PAN: {vendors.find((v) => v.id === coExistingVendorId)?.panNumber} &bull; फ़ोन:{' '}
                      {vendors.find((v) => v.id === coExistingVendorId)?.phone}
                    </span>
                  </div>
                  <span className="text-xs bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded">
                    पहले से पंजीकृत
                  </span>
                </div>
              )}
            </div>

            {/* Section 2: Attached Vehicle Details */}
            <div className="space-y-3 pt-2">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-600" />
                <span>2. गाड़ी का विवरण (Attached Vehicle Details)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    गाड़ी नंबर *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. UP32 MK 4501"
                    value={coVehicleNumber}
                    onChange={(e) => setCoVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मेक व मॉडल *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Swift Dzire / Ertiga"
                    value={coMakeModel}
                    onChange={(e) => setCoMakeModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ईंधन प्रकार
                  </label>
                  <select
                    value={coFuelType}
                    onChange={(e) => setCoFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Diesel">Diesel (डीजल)</option>
                    <option value="CNG">CNG (सीएनजी)</option>
                    <option value="Petrol">Petrol (पेट्रोल)</option>
                    <option value="Electric">Electric (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ओडोमीटर (KM)
                  </label>
                  <input
                    type="number"
                    value={coOdometer}
                    onChange={(e) => setCoOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  सरकारी टेंडर में अटैच करें (Assign Tender) *
                </label>
                <select
                  required
                  value={coTenderId}
                  onChange={(e) => setCoTenderId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                >
                  {tenders.length === 0 ? (
                    <option value="">कोई टेंडर नहीं (बाद में असाइन करें)</option>
                  ) : (
                    tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.departmentName} - {t.tenderNumber}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Section 3: Driver Assignment (Who will drive this car?) */}
            <div className="space-y-3 pt-2">
              <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
                <span>3. गाड़ी पर ड्राइवर तैनाती (Driver Assignment)</span>
                <span className="text-[11px] text-slate-500">मालिक गाड़ी नहीं चलाएगा, चालक चुनें</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setCoDriverAssignmentMode('assign_now')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    coDriverAssignmentMode === 'assign_now'
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={coDriverAssignmentMode === 'assign_now'}
                      onChange={() => setCoDriverAssignmentMode('assign_now')}
                      className="text-indigo-600"
                    />
                    <span>अभी उपलब्ध ड्राइवर तैनात करें</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    पूल में मौजूद किसी फ्री चालक को इस गाड़ी पर अलॉट करें
                  </p>
                </div>

                <div
                  onClick={() => setCoDriverAssignmentMode('assign_later')}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    coDriverAssignmentMode === 'assign_later'
                      ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <input
                      type="radio"
                      checked={coDriverAssignmentMode === 'assign_later'}
                      onChange={() => setCoDriverAssignmentMode('assign_later')}
                      className="text-slate-600"
                    />
                    <span>ड्राइवर बाद में तैनात करेंगे</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    गाड़ी को बिना ड्राइवर के एक्टिव/स्टैंडबाय पूल में रखें
                  </p>
                </div>
              </div>

              {coDriverAssignmentMode === 'assign_now' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    चालक का चयन करें (Select Driver) *
                  </label>
                  <select
                    value={coAssignedDriverId}
                    onChange={(e) => setCoAssignedDriverId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="">-- उपलब्ध चालक चुनें --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone}) {d.currentVehicleId ? '- वर्तमान में अन्य गाड़ी पर' : '- उपलब्ध (Free)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Section 4: Rent & TDS Settings */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                <span>4. वेंडर को मासिक किराया व TDS कटौती (Rent &amp; TDS)</span>
                <span className="text-[11px] text-slate-500">आयकर धारा 194C</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मासिक तयशुदा किराया (Monthly Agreed Rent) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      value={coMonthlyRent}
                      onChange={(e) => setCoMonthlyRent(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    वेंडर को हर महीने इस दर से वाउचर बनेगा
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    TDS दर व नियम
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[2, 1, 0].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          setCoTdsRate(rate);
                          setCoIsTdsApplicable(rate > 0);
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                          coTdsRate === rate
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {rate === 0 ? '0% (छूट)' : `${rate}% TDS`}
                      </button>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    फर्म/कंपनी हेतु 2%, व्यक्तिगत हेतु 1%, 194C(6) घोषणा हेतु 0%
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>गाड़ी मालिक व वाहन सुरक्षित करें (Save Car Owner &amp; Vehicle)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3 CONTENT: COMPANY OWNED VEHICLE */}
        {activeType === 'company_vehicle' && (
          <form onSubmit={handleCompanyVehicleSubmit} className="p-6 space-y-5 text-xs">
            <div className="bg-amber-50/90 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3">
              <div className="p-1.5 bg-amber-600 text-white rounded-lg shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-[11px] text-amber-900">
                <span className="font-bold block text-xs">
                  कंपनी की खुद की गाड़ी (Company Owned Fleet):
                </span>
                यह गाड़ी शक्ति ट्रैवल्स एंड टूर्स की परिसंपत्ति (Asset) है। इस पर कोई वेंडर किराया देय नहीं होता। इसके
                सर्विसिंग, इंश्योरेंस, फिटनेस, लोन ईएमआई और फ्यूल का पूर्ण प्रबंधन कंपनी करती है।
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    गाड़ी नंबर *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. UP32 AB 1234"
                    value={cvVehicleNumber}
                    onChange={(e) => setCvVehicleNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मेक व मॉडल *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. Toyota Innova Crysta"
                    value={cvMakeModel}
                    onChange={(e) => setCvMakeModel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ईंधन प्रकार
                  </label>
                  <select
                    value={cvFuelType}
                    onChange={(e) => setCvFuelType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Diesel">Diesel (डीजल)</option>
                    <option value="Petrol">Petrol (पेट्रोल)</option>
                    <option value="CNG">CNG (सीएनजी)</option>
                    <option value="Electric">Electric (EV)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    वर्तमान ओडोमीटर (KM)
                  </label>
                  <input
                    type="number"
                    value={cvOdometer}
                    onChange={(e) => setCvOdometer(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    सरकारी टेंडर में तैनाती (Tender) *
                  </label>
                  <select
                    required
                    value={cvTenderId}
                    onChange={(e) => setCvTenderId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    {tenders.length === 0 ? (
                      <option value="">कोई टेंडर नहीं (स्टैंडबाय पूल)</option>
                    ) : (
                      tenders.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.departmentName} - {t.tenderNumber}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    चालक अलॉटमेंट (Assign Company Driver)
                  </label>
                  <select
                    value={cvAssignedDriverId}
                    onChange={(e) => setCvAssignedDriverId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="">-- चालक बाद में अलॉट करेंगे --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone}) {d.currentVehicleId ? '- वर्तमान में अन्य गाड़ी पर' : '- उपलब्ध (Free)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    खरीद लागत (Purchase Cost ₹)
                  </label>
                  <input
                    type="number"
                    value={cvPurchaseCost}
                    onChange={(e) => setCvPurchaseCost(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    लोन / फाइनेंसिंग बैंक
                  </label>
                  <input
                    type="text"
                    value={cvFinancingBank}
                    onChange={(e) => setCvFinancingBank(e.target.value)}
                    placeholder="उदा. HDFC Bank Auto Loan (EMI ₹14,500)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Expiry Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    फिटनेस एक्सपायरी (Fitness)
                  </label>
                  <input
                    type="date"
                    value={cvFitnessExpiry}
                    onChange={(e) => setCvFitnessExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    बीमा एक्सपायरी (Insurance)
                  </label>
                  <input
                    type="date"
                    value={cvInsuranceExpiry}
                    onChange={(e) => setCvInsuranceExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    प्रदूषण एक्सपायरी (PUC)
                  </label>
                  <input
                    type="date"
                    value={cvPucExpiry}
                    onChange={(e) => setCvPucExpiry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>कंपनी वाहन सुरक्षित करें (Save Company Vehicle)</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
