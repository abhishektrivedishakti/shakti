import React, { useState, useRef } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Phone,
  Mail,
  FileText,
  Clock,
  Car,
  AlertCircle,
  CheckCircle,
  Sparkles,
  UploadCloud,
  Loader2,
  CheckCircle2,
  FileCheck,
  Trash2,
  Layers,
  Tag,
  HelpCircle,
  PlusCircle,
  ShieldAlert,
  IndianRupee,
} from 'lucide-react';
import {
  Tender,
  TenderVehiclePackage,
  TenderServiceScope,
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
import { DocumentManagerModal } from './DocumentManagerModal';
import { TenderDetailHubModal } from './TenderDetailHubModal';
import { DriverHisabAndLeaveModal } from './DriverHisabAndLeaveModal';

export const getScopeMeta = (scope?: TenderServiceScope) => {
  switch (scope) {
    case 'vehicle_driver_fuel':
      return {
        label: 'गाड़ी + ड्राइवर + ईंधन (Full Package)',
        shortLabel: 'गाड़ी + ड्राइवर + ईंधन',
        tag: 'Full Package',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        icon: '🚗 👨‍✈️ ⛽',
      };
    case 'vehicle_driver':
      return {
        label: 'गाड़ी + ड्राइवर (ईंधन विभाग देगा / बिल पर)',
        shortLabel: 'गाड़ी + ड्राइवर',
        tag: 'Vehicle + Driver',
        color: 'bg-blue-50 text-blue-800 border-blue-300',
        badge: 'bg-blue-600 text-white',
        icon: '🚗 👨‍✈️',
      };
    case 'only_vehicle':
      return {
        label: 'केवल गाड़ी / Dry Lease (ड्राइवर विभाग का)',
        shortLabel: 'केवल गाड़ी (Dry Lease)',
        tag: 'Only Vehicle',
        color: 'bg-purple-50 text-purple-800 border-purple-300',
        badge: 'bg-purple-600 text-white',
        icon: '🚗',
      };
    case 'only_driver':
      return {
        label: 'केवल ड्राइवर सेवा (Driver Only Manpower)',
        shortLabel: 'केवल ड्राइवर सेवा',
        tag: 'Driver Only',
        color: 'bg-amber-50 text-amber-900 border-amber-300',
        badge: 'bg-amber-600 text-white',
        icon: '👨‍✈️',
      };
    default:
      return {
        label: 'गाड़ी + ड्राइवर + ईंधन (Full Package)',
        shortLabel: 'गाड़ी + ड्राइवर + ईंधन',
        tag: 'Full Package',
        color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        badge: 'bg-emerald-600 text-white',
        icon: '🚗 👨‍✈️ ⛽',
      };
  }
};

const SAMPLE_TENDER_DOCS = {
  rdso: `GOVERNMENT E-MARKETPLACE (GeM) CONTRACT
Contract No: GEMC-511687759033448
Contract Generated Date: 13-Feb-2025
Bid/RA/PBP No.: GEM/2025/B/5807627
Type: Central Government
Ministry: Ministry of Railways
Department: Indian Railways
Organisation Name: RDSO
Office Zone: Stores Directorate/rdso
Buyer Details:
- Designation: Director/Stores/I
- Contact No: 0522-2464755
- Email ID: dstore1@rdso.railnet.gov.in
- GSTIN: 09AAAGM0289C1ZH
- Address: Stores Directorate, Manak nagar Lucknow, LUCKNOW, UTTAR PRADESH-226011, India
Consignee Details:
- Name & Address: Admin I Publication Section, RDSO, Manak Nagar, Lucknow, UP-226011
- Email ID: rdso.sugandha@gov.in
Service Provider: vaishno tour & travels (GeM Seller ID: AC03190000904748)
- Contact: 09696496396
- Email: vaishnotravelslko@gmail.com
- Address: DS-213 SECTOR - D, LDA COLONY, KANPUR ROAD, Lucknow, UP-226012
- GSTIN: 09DRHPS0375H1ZE
Service Details:
- Service Start Date (latest by): 14-Feb-2025
- Service End Date: 13-Feb-2027 (24 Months Duration)
- Billing Cycle: monthly
- Category Name: Monthly Basis Cab & Taxi Hiring Services
Package 1 (Sedan):
- Number of Vehicles Required: 6
- Vehicle Type: Sedan (Honda Amaze, Maruti Suzuki Dzire, Hyundai Xcent)
- Usage Variant: 2500 km x 320 hours; Outstation
- Monthly Base Fare (inclusive of GST): Rs. 33,120 per vehicle
- Outstation night charges: Rs. 190 per night
- Total Value Including Addons: Rs. 49,06,080
Package 2 (Premium SUV):
- Number of Vehicles Required: 4
- Vehicle Type: Premium SUV (Toyota Innova, Honda CR-V, Toyota Innova Crysta)
- Usage Variant: 1500 km x 320 hours; Outstation
- Monthly Base Fare (inclusive of GST): Rs. 55,990 per vehicle
- Outstation night charges: Rs. 190 per night
- Total Value Including Addons: Rs. 54,66,240
Total Contract Value: Rs. 1,03,72,320 (10 Vehicles Total)
ePBG Detail: State Bank of India (SBI), ePBG Percentage: 5.00% (Rs. 5,18,616)
Deductions & SLAs:
- Delay of vehicle/driver > 30 min: Warning (1st), 1% deduction (2nd), 2% deduction (3rd)
- Driver in intoxicated state: Rs. 2,500 deduction and replacement
- Misbehaviour by driver: Rs. 1,000 deduction (1st), Rs. 2,000 deduction (2nd)
- Non deployment: 3rd party vehicle hire charges + 5% deduction (1st), 10% (2nd)
- Breakdown during trip: Replacement in 2 hrs or 3rd party vehicle + 4% to 8% deduction
- Toll Charges & parking: Reimbursed by Buyer on actual basis as per clause 5.1.2
Bill Series: RDSO/LKO/2025/`,

  gem: `GOVERNMENT E-MARKETPLACE (GeM) CONTRACT SANCTION ORDER
Contract Order No: GeM-GEM/2026/B/948210
Date of Sanction: 15-Apr-2026
Department: UP State Disaster Management Authority (UPSDMA)
Office: PICUP Bhawan, Vibhuti Khand, Gomti Nagar, Lucknow - 226010
Contract Period: 01-May-2026 to 30-Apr-2027
Package Specifications: Monthly Hiring of 4-Wheeler Commercial Sedans / SUVs on 24x7 basis.
Monthly Base Rate: Rs. 42,000 per vehicle per month
Included Kilometers: 2,500 KM per month
Included Duty Hours: 300 Hours per month
Extra Kilometer Rate: Rs. 14 per KM
Extra Hour Rate: Rs. 70 per Hour
Night Halt / Driver Outstation DA: Rs. 500 per night
Toll / Parking Charges: Reimbursable on actuals against original receipt
Penalty Clause: Rs. 1,500 per day absent without replacement; Rs. 500 for dirty vehicle / AC fault.
Nodal Officer: Shri Anand Sharma, Deputy Director (Admin)
Contact Phone: 9415088219
Contact Email: admin.upsdma@up.gov.in
EMD / Security Deposit: FDR / Bank Guarantee Rs. 2,50,000 SBI Lucknow
Recommended Bill Series: UPSDMA/LKO/2026/`,

  pwd: `OFFICE OF THE EXECUTIVE ENGINEER, PUBLIC WORKS DEPARTMENT (PWD)
HIGHWAY MAINTENANCE DIVISION-2, CIVIL LINES, PRAYAGRAJ
WORK ORDER & CONTRACT AGREEMENT: PWD/PRY/HW-2/2026-27/08
Date of Award: 22-Apr-2026
Tender Ref No: NIT-PWD-PRY-2026-092
Name of Work: Deployment of Commercial Inspection Taxi Vehicles for Senior Engineers & Flying Squads
Contractor: Sarkari Fleet & Transport Services
Period of Contract: 01-May-2026 to 30-Apr-2027
Monthly Rental: Rs. 37,500 per vehicle/month
Monthly Distance Quota: 2,200 KM
Monthly Time Quota: 260 Hours (approx 10-12 hrs/day)
Extra Distance Charges: Rs. 13 per KM
Extra Hour Charges: Rs. 65 per Hour
Night Stay Allowance: Rs. 450 per night
Billing Cycle: 1st week of every calendar month
Payment Terms: 30 days from submission of certified duty slips & bills
Penalty Terms: Rs. 1,000 per day absent without substitute vehicle; Rs. 500 for uniform violation
Contact Officer: Er. Sudhir Kumar Srivastava (Executive Engineer)
Phone: 9450123987
Performance Security: Bank Guarantee No. BG-PNB-99120 for Rs. 1,80,000 valid up to 31-05-2027
Agreement No: AGR/PWD/PRY/2026/14`,

  nhai: `NATIONAL HIGHWAYS AUTHORITY OF INDIA (NHAI)
PROJECT IMPLEMENTATION UNIT (PIU) - KANPUR BYPASS EXPRESSWAY
WORK ORDER NO: NHAI/PIU-KNP/VEH/2026/102
Tender ID: NHAI/RO-UP/2026/CAB-04
Department: National Highways Authority of India (Ministry of Road Transport & Highways)
Office Address: PIU Campus, GT Road, Kalyanpur, Kanpur - 208017
Contract Scope: Dedicated Highway Patrol & Inspection Fleet Vehicles (Mahindra Scorpio / Ertiga / Bolero)
Contract Validity: 01-May-2026 to 30-Apr-2027
Monthly Fixed Hiring Rate: Rs. 45,000 per vehicle per month
Allowed KMs: 3,000 KM per month
Allowed Hours: 320 Hours per month
Extra KM Rate: Rs. 15 per KM
Extra Hour Rate: Rs. 75 per Hour
Night Halt Rate: Rs. 500 per night
Toll Charges: Contractor borne with NHAI FASTag exemption tag
Penalty: Rs. 2,000 per day breakdown exceeding 2 hours; Rs. 1,000 for driver rash driving / GPS disconnect
Nodal Person: Shri Vivek Deshmukh, Project Director
Contact: 9838012340
Email: kanpur@nhai.org
Bank Guarantee Details: BG #98127 HDFC Bank Rs. 3,00,000 Exp: 30-06-2027
Bill Series: NHAI/KNP/2026/`
};

interface TendersViewProps {
  tenders: Tender[];
  vehicles: Vehicle[];
  officers?: Officer[];
  drivers?: Driver[];
  dailyLogs?: DailyLogEntry[];
  fuelRecords?: FuelRecord[];
  maintenanceRecords?: MaintenanceRecord[];
  bills?: MonthlyBill[];
  khataTransactions?: DriverKhataTransaction[];
  vendors?: Vendor[];
  allocationHistory?: DriverAllocationHistory[];
  vehicleAllocationHistory?: VehicleAllocationHistory[];
  officerAllocationHistory?: OfficerAllocationHistory[];
  onSaveTender: (tender: Tender) => void;
  onSaveOfficer?: (officer: Officer) => void;
  onSaveVehicle?: (vehicle: Vehicle) => void;
  onSaveDriver?: (driver: Driver) => void;
  onReplaceDriver?: (
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
  onAddLog?: (entry: DailyLogEntry) => void;
  onAddFuelRecord?: (record: FuelRecord) => void;
  onSaveBill?: (bill: MonthlyBill) => void;
  onAddDailyPayment?: (entry: DailyPaymentEntry) => void;
  onToggleLogVerified?: (id: string) => void;
  driverLeaves?: DriverLeaveRecord[];
  dailyPayments?: DailyPaymentEntry[];
  currentUser?: StaffUser;
  onAddTransaction?: (tx: DriverKhataTransaction) => void;
  onDeleteTransaction?: (txId: string) => void;
  onAddDriverLeave?: (leave: DriverLeaveRecord) => void;
  onDeleteDriverLeave?: (leaveId: string) => void;
  onOpenProfileModal?: (type?: any, id?: string) => void;
}

export const TendersView: React.FC<TendersViewProps> = ({
  tenders,
  vehicles,
  officers = [],
  drivers = [],
  dailyLogs = [],
  fuelRecords = [],
  maintenanceRecords = [],
  bills = [],
  khataTransactions = [],
  vendors = [],
  allocationHistory = [],
  vehicleAllocationHistory = [],
  officerAllocationHistory = [],
  driverLeaves = [],
  dailyPayments = [],
  currentUser,
  onSaveTender,
  onSaveOfficer = () => {},
  onSaveVehicle = () => {},
  onSaveDriver = () => {},
  onReplaceDriver = () => {},
  onReplaceVehicle = () => {},
  onTransferOrRelieveOfficer = () => {},
  onReactivateIdleVehicle = () => {},
  onAddLog = () => {},
  onAddFuelRecord = () => {},
  onSaveBill = () => {},
  onAddDailyPayment = () => {},
  onToggleLogVerified = () => {},
  onAddTransaction = () => {},
  onDeleteTransaction = () => {},
  onAddDriverLeave = () => {},
  onDeleteDriverLeave = () => {},
  onOpenProfileModal,
}) => {
  const [selectedTenderForHub, setSelectedTenderForHub] = useState<Tender | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [selectedTenderForDocs, setSelectedTenderForDocs] = useState<Tender | null>(null);

  // Quick Driver Hisab & Leave Modal State triggered from Tender Card
  const [tenderHisabModalConfig, setTenderHisabModalConfig] = useState<{
    isOpen: boolean;
    initialTab: 'payments' | 'leaves' | 'monthly_hisab';
    tenderId: string;
    vehicleId?: string;
    driverId?: string;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Tender>>({});

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
  const handleAutoAssignDriversForTender = (tenderId: string) => {
    const tVehicles = vehicles.filter((v) => v.tenderId === tenderId);
    const unassignedVehicles = tVehicles.filter(
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
      alert('कोई भी खाली/स्टैंडबाय ड्राइवर उपलब्ध नहीं है। कृपया पहले नया ड्राइवर रजिस्टर करें।');
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

  const [tenderSearch, setTenderSearch] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [tenderPage, setTenderPage] = useState<number>(1);
  const tendersPerPage = 12;

  // AI Document Extraction State
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [aiExtractStatus, setAiExtractStatus] = useState('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [aiErrorMessage, setAiErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique cities / locations from departmentName or authorityOffice
  const cities = Array.from(
    new Set(
      tenders.map((t) => {
        const match = t.departmentName.match(/\(([^)]+)\)/);
        return match ? match[1] : '';
      }).filter(Boolean)
    )
  ).sort();

  const filteredTenders = tenders.filter((t) => {
    const q = tenderSearch.toLowerCase();
    const matchesSearch =
      !q ||
      t.departmentName.toLowerCase().includes(q) ||
      t.tenderNumber.toLowerCase().includes(q) ||
      t.workOrderNumber.toLowerCase().includes(q) ||
      t.authorityOffice.toLowerCase().includes(q);

    const matchesCity = cityFilter === 'all' || t.departmentName.includes(`(${cityFilter})`);

    return matchesSearch && matchesCity;
  });

  const totalTenderPages = Math.ceil(filteredTenders.length / tendersPerPage) || 1;
  const paginatedTenders = filteredTenders.slice(
    (tenderPage - 1) * tendersPerPage,
    tenderPage * tendersPerPage
  );

  const handleOpenAdd = () => {
    setAiSuccessMessage('');
    setAiErrorMessage('');
    setAiExtractStatus('');
    const defaultPackage: TenderVehiclePackage = {
      id: `pkg-${Date.now()}-1`,
      packageName: 'Lot 1: Executive Sedan / Taxi',
      serviceScope: 'vehicle_driver_fuel',
      vehicleCategory: 'Sedan (Swift Dzire / Honda Amaze)',
      usageDutyType: 'Routine Office & Inspection (10-12 Hrs)',
      quantity: 1,
      monthlyBaseRate: 35000,
      includedKms: 2000,
      includedHours: 250,
      extraKmRate: 12,
      extraHourRate: 60,
      nightHaltRate: 400,
      tollTerms: 'reimbursable_actuals',
      specifications: 'AC Sedan with Commercial Yellow Plate',
    };
    setFormData({
      id: `t-${Date.now()}`,
      tenderNumber: '',
      workOrderNumber: '',
      departmentName: '',
      authorityOffice: '',
      contractPeriodStart: new Date().toISOString().slice(0, 10),
      contractPeriodEnd: '',
      billingCycleDay: 1,
      paymentTermsDays: 30,
      baseMonthlyRate: 35000,
      includedKms: 2000,
      includedHours: 250,
      extraKmRate: 12,
      extraHourRate: 60,
      nightHaltRate: 400,
      tollTerms: 'reimbursable_actuals',
      penaltyClauses: '₹1000/day for unserved day; ₹500 for non-AC failure',
      officerDesignationsSummary: '',
      status: 'active',
      contactPerson: '',
      contactPhone: '',
      billSeriesPrefix: '',
      emdDetails: '',
      agreementNumber: '',
      documents: [],
      contractType: 'monthly_attached',
      onCallDefaults: {
        defaultPackageType: 'local_8hr_80km',
        baseRate: 2400,
        baseHours: 8,
        baseKm: 80,
        extraKmRate: 14,
        extraHourRate: 150,
        nightHaltRate: 350,
        driverDaRate: 300,
        gstRatePercent: 5,
        defaultPickupLocation: 'निर्माण भवन / मुख्य कार्यालय, लखनऊ',
        defaultDropLocation: 'साइट निरीक्षण व फील्ड कार्यालय',
        clientGstin: '09AAAGP1234E1Z1',
        clientBillingAddress: 'Nirman Bhawan, Lucknow',
        defaultBookerName: 'Er. Pradeep Sharma (PA)',
        defaultBookerPhone: '9415011223',
        defaultBookerDesignation: 'Staff Officer / PA',
        defaultBookerRoom: 'Room 304, Third Floor',
        specialInstructions: 'गाड़ी में एसी लगातार चालू रहे, सफेद सीट कवर व पानी की बोतल अनिवार्य।',
      },
      packages: [defaultPackage],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Tender) => {
    setAiSuccessMessage('');
    setAiErrorMessage('');
    setAiExtractStatus('');
    const packages =
      t.packages && t.packages.length > 0
        ? t.packages
        : [
            {
              id: `pkg-${Date.now()}-1`,
              packageName: 'Lot 1: Standard Vehicle Package',
              serviceScope: 'vehicle_driver_fuel' as TenderServiceScope,
              vehicleCategory: 'Sedan / SUV',
              usageDutyType: `${t.includedKms || 2000} KM x ${t.includedHours || 250} Hrs Monthly`,
              quantity: 1,
              monthlyBaseRate: t.baseMonthlyRate || 35000,
              includedKms: t.includedKms || 2000,
              includedHours: t.includedHours || 250,
              extraKmRate: t.extraKmRate || 12,
              extraHourRate: t.extraHourRate || 60,
              nightHaltRate: t.nightHaltRate || 400,
              tollTerms: t.tollTerms || 'reimbursable_actuals',
              specifications: 'Standard Commercial Fleet',
            },
          ];
    setFormData({
      ...t,
      contractType: t.contractType || 'monthly_attached',
      onCallDefaults: t.onCallDefaults || {
        defaultPackageType: 'local_8hr_80km',
        baseRate: 2400,
        baseHours: 8,
        baseKm: 80,
        extraKmRate: t.extraKmRate || 14,
        extraHourRate: t.extraHourRate || 150,
        nightHaltRate: t.nightHaltRate || 350,
        driverDaRate: 300,
        gstRatePercent: 5,
        defaultPickupLocation: t.authorityOffice || 'मुख्यालय / कार्यालय, लखनऊ',
        defaultDropLocation: 'साइट निरीक्षण व फील्ड',
        clientGstin: '09AAAGP1234E1Z1',
        clientBillingAddress: t.authorityOffice || '',
        defaultBookerName: t.contactPerson || '',
        defaultBookerPhone: t.contactPhone || '',
        defaultBookerDesignation: t.officerDesignationsSummary || 'Staff Officer',
        defaultBookerRoom: 'Room 304',
        specialInstructions: 'गाड़ी में एसी लगातार चालू रहे, समय की पाबंदी अनिवार्य।',
      },
      packages,
    });
    setIsModalOpen(true);
  };

  // Add a new package/lot to current tender
  const handleAddPackage = () => {
    const currentPackages = formData.packages || [];
    const newLotNum = currentPackages.length + 1;
    const newPkg: TenderVehiclePackage = {
      id: `pkg-${Date.now()}-${newLotNum}`,
      packageName: `Lot ${newLotNum}: SUV / Field Vehicle`,
      serviceScope: 'vehicle_driver_fuel',
      vehicleCategory: 'SUV (Scorpio / Bolero Neo)',
      usageDutyType: 'Field & Outstation Inspection',
      quantity: 1,
      monthlyBaseRate: 45000,
      includedKms: 2500,
      includedHours: 300,
      extraKmRate: 14,
      extraHourRate: 70,
      nightHaltRate: 400,
      tollTerms: 'reimbursable_actuals',
      specifications: 'AC SUV, Commercial Yellow Plate',
    };
    setFormData((prev) => ({
      ...prev,
      packages: [...(prev.packages || []), newPkg],
    }));
  };

  // Remove a package/lot
  const handleRemovePackage = (pkgId: string) => {
    const current = formData.packages || [];
    if (current.length <= 1) {
      alert('कम से कम एक गाड़ी पैकेज / लॉट अनिवार्य है (At least 1 package is required).');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      packages: (prev.packages || []).filter((p) => p.id !== pkgId),
    }));
  };

  // Update a field inside a specific package/lot
  const handleUpdatePackage = (pkgId: string, updates: Partial<TenderVehiclePackage>) => {
    setFormData((prev) => ({
      ...prev,
      packages: (prev.packages || []).map((p) => (p.id === pkgId ? { ...p, ...updates } : p)),
    }));
  };

  // AI Document Extraction from uploaded PDF or Image file
  const handleExtractFromPdf = async (file: File) => {
    setIsAiExtracting(true);
    setAiExtractStatus('Reading PDF / Image file...');
    setAiSuccessMessage('');
    setAiErrorMessage('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      try {
        setAiExtractStatus('Analyzing Tender Document with Gemini AI (टेंडर नियम व दरें जांची जा रही हैं)...');

        const res = await fetch('/api/extract-tender', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: dataUrl,
            mimeType: file.type || 'application/pdf',
            fileName: file.name,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to extract tender details');
        }

        const data = json.data;

        // Auto-attach this PDF to the tender documents
        const autoDoc = {
          id: `tdoc-${Date.now()}`,
          title: `Tender Agreement / Work Order (${data.workOrderNumber || data.tenderNumber || file.name})`,
          category: 'work_order' as const,
          documentNumber: data.workOrderNumber || data.tenderNumber,
          issuingAuthority: data.authorityOffice || data.departmentName,
          issueDate: data.contractPeriodStart,
          expiryDate: data.contractPeriodEnd,
          fileName: file.name,
          fileType: (file.type?.includes('image') ? 'image' : 'pdf') as 'pdf' | 'image',
          fileUrl: dataUrl,
          fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          verified: true,
          notes: 'Auto-extracted by Gemini AI from uploaded agreement document',
        };

        const extractedPackages: TenderVehiclePackage[] =
          data.packages && Array.isArray(data.packages) && data.packages.length > 0
            ? data.packages.map((p: any, idx: number) => ({
                id: p.id || `pkg-${Date.now()}-${idx + 1}`,
                packageName: p.packageName || `Lot ${idx + 1}: ${p.vehicleCategory || 'Vehicle Package'}`,
                serviceScope: (p.serviceScope as TenderServiceScope) || 'vehicle_driver_fuel',
                vehicleCategory: p.vehicleCategory || 'Sedan',
                usageDutyType: p.usageDutyType || 'Monthly Package',
                quantity: Number(p.quantity) || 1,
                monthlyBaseRate: Number(p.monthlyBaseRate) || 35000,
                includedKms: Number(p.includedKms) || 2000,
                includedHours: Number(p.includedHours) || 250,
                extraKmRate: Number(p.extraKmRate) || 12,
                extraHourRate: Number(p.extraHourRate) || 60,
                nightHaltRate: Number(p.nightHaltRate) || 400,
                tollTerms: p.tollTerms || 'reimbursable_actuals',
                specifications: p.specifications || '',
              }))
            : [];

        setFormData((prev) => {
          const finalPkgs = extractedPackages.length > 0 ? extractedPackages : prev.packages;
          const firstPkg = finalPkgs && finalPkgs.length > 0 ? finalPkgs[0] : null;
          return {
            ...prev,
            departmentName: data.departmentName || prev.departmentName,
            tenderNumber: data.tenderNumber || prev.tenderNumber,
            workOrderNumber: data.workOrderNumber || prev.workOrderNumber,
            authorityOffice: data.authorityOffice || prev.authorityOffice,
            contractPeriodStart: data.contractPeriodStart || prev.contractPeriodStart,
            contractPeriodEnd: data.contractPeriodEnd || prev.contractPeriodEnd,
            billingCycleDay: Number(data.billingCycleDay) || prev.billingCycleDay || 1,
            paymentTermsDays: Number(data.paymentTermsDays) || prev.paymentTermsDays || 30,
            baseMonthlyRate: firstPkg ? firstPkg.monthlyBaseRate : (Number(data.baseMonthlyRate) || prev.baseMonthlyRate || 36000),
            includedKms: firstPkg ? firstPkg.includedKms : (Number(data.includedKms) || prev.includedKms || 2000),
            includedHours: firstPkg ? firstPkg.includedHours : (Number(data.includedHours) || prev.includedHours || 250),
            extraKmRate: firstPkg ? firstPkg.extraKmRate : (Number(data.extraKmRate) || prev.extraKmRate || 12),
            extraHourRate: firstPkg ? firstPkg.extraHourRate : (Number(data.extraHourRate) || prev.extraHourRate || 60),
            nightHaltRate: firstPkg ? firstPkg.nightHaltRate : (Number(data.nightHaltRate) || prev.nightHaltRate || 400),
            tollTerms: data.tollTerms === 'contractor_borne' ? 'contractor_borne' : 'reimbursable_actuals',
            penaltyClauses: data.penaltyClauses || prev.penaltyClauses,
            officerDesignationsSummary: data.officerDesignationsSummary || prev.officerDesignationsSummary,
            contactPerson: data.contactPerson || prev.contactPerson,
            contactPhone: data.contactPhone || prev.contactPhone,
            contactEmail: data.contactEmail || prev.contactEmail,
            billSeriesPrefix: data.billSeriesPrefix || prev.billSeriesPrefix,
            emdDetails: data.emdDetails || prev.emdDetails,
            agreementNumber: data.agreementNumber || prev.agreementNumber,
            documents: [autoDoc, ...(prev.documents || [])],
            packages: finalPkgs,
          };
        });

        setAiSuccessMessage(
          `✨ AI Auto-Fill Complete! Successfully extracted details for "${data.departmentName || 'Govt Department'}" (Tender: ${data.tenderNumber || 'N/A'}). Form auto-filled!`
        );
      } catch (err: any) {
        console.error('Extraction error:', err);
        setAiErrorMessage(err.message || 'Error extracting details from PDF');
      } finally {
        setIsAiExtracting(false);
        setAiExtractStatus('');
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Extraction from preloaded Government Tender sample texts (for quick 1-click testing)
  const handleExtractFromSample = async (sampleKey: 'rdso' | 'gem' | 'pwd' | 'nhai') => {
    setIsAiExtracting(true);
    setAiExtractStatus(`Extracting details from Sample ${sampleKey === 'rdso' ? 'RDSO Indian Railways' : sampleKey.toUpperCase()} Contract Order...`);
    setAiSuccessMessage('');
    setAiErrorMessage('');

    try {
      const textContent = SAMPLE_TENDER_DOCS[sampleKey];
      const res = await fetch('/api/extract-tender', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract sample tender details');
      }

      const data = json.data;

      const sampleDocName =
        sampleKey === 'rdso'
          ? 'GeM_Contract_GEMC-511687759033448_RDSO_Railways.pdf'
          : sampleKey === 'pwd'
          ? 'PWD_WorkOrder_PRY_2026.pdf'
          : sampleKey === 'nhai'
          ? 'NHAI_PIU_Kanpur_Agreement.pdf'
          : 'GeM_Sanction_Order_UPSDMA.pdf';

      const autoDoc = {
        id: `tdoc-${Date.now()}`,
        title: `GeM Contract Order (${data.workOrderNumber || data.tenderNumber})`,
        category: 'gem_contract' as const,
        documentNumber: data.workOrderNumber || data.tenderNumber,
        issuingAuthority: data.authorityOffice || data.departmentName,
        issueDate: data.contractPeriodStart,
        expiryDate: data.contractPeriodEnd,
        fileName: sampleDocName,
        fileType: 'pdf' as const,
        fileUrl: '',
        fileSize: '1.8 MB',
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        verified: true,
        notes: `Extracted directly from ${sampleKey.toUpperCase()} Contract Order (${data.workOrderNumber || 'GeM'})`,
      };

      const extractedSamplePackages: TenderVehiclePackage[] =
        data.packages && Array.isArray(data.packages) && data.packages.length > 0
          ? data.packages.map((p: any, idx: number) => ({
              id: p.id || `pkg-${Date.now()}-${idx + 1}`,
              packageName: p.packageName || `Lot ${idx + 1}: ${p.vehicleCategory || 'Vehicle Package'}`,
              serviceScope: (p.serviceScope as TenderServiceScope) || 'vehicle_driver_fuel',
              vehicleCategory: p.vehicleCategory || 'Sedan',
              usageDutyType: p.usageDutyType || 'Monthly Package',
              quantity: Number(p.quantity) || 1,
              monthlyBaseRate: Number(p.monthlyBaseRate) || 35000,
              includedKms: Number(p.includedKms) || 2000,
              includedHours: Number(p.includedHours) || 250,
              extraKmRate: Number(p.extraKmRate) || 12,
              extraHourRate: Number(p.extraHourRate) || 60,
              nightHaltRate: Number(p.nightHaltRate) || 400,
              tollTerms: p.tollTerms || 'reimbursable_actuals',
              specifications: p.specifications || '',
            }))
          : [];

      setFormData((prev) => {
        const finalPkgs = extractedSamplePackages.length > 0 ? extractedSamplePackages : prev.packages;
        const firstPkg = finalPkgs && finalPkgs.length > 0 ? finalPkgs[0] : null;
        return {
          ...prev,
          departmentName: data.departmentName || prev.departmentName,
          tenderNumber: data.tenderNumber || prev.tenderNumber,
          workOrderNumber: data.workOrderNumber || prev.workOrderNumber,
          authorityOffice: data.authorityOffice || prev.authorityOffice,
          contractPeriodStart: data.contractPeriodStart || prev.contractPeriodStart,
          contractPeriodEnd: data.contractPeriodEnd || prev.contractPeriodEnd,
          billingCycleDay: Number(data.billingCycleDay) || prev.billingCycleDay || 1,
          paymentTermsDays: Number(data.paymentTermsDays) || prev.paymentTermsDays || 30,
          baseMonthlyRate: firstPkg ? firstPkg.monthlyBaseRate : (Number(data.baseMonthlyRate) || prev.baseMonthlyRate || 36000),
          includedKms: firstPkg ? firstPkg.includedKms : (Number(data.includedKms) || prev.includedKms || 2000),
          includedHours: firstPkg ? firstPkg.includedHours : (Number(data.includedHours) || prev.includedHours || 250),
          extraKmRate: firstPkg ? firstPkg.extraKmRate : (Number(data.extraKmRate) || prev.extraKmRate || 12),
          extraHourRate: firstPkg ? firstPkg.extraHourRate : (Number(data.extraHourRate) || prev.extraHourRate || 60),
          nightHaltRate: firstPkg ? firstPkg.nightHaltRate : (Number(data.nightHaltRate) || prev.nightHaltRate || 400),
          tollTerms: data.tollTerms === 'contractor_borne' ? 'contractor_borne' : 'reimbursable_actuals',
          penaltyClauses: data.penaltyClauses || prev.penaltyClauses,
          officerDesignationsSummary: data.officerDesignationsSummary || prev.officerDesignationsSummary,
          contactPerson: data.contactPerson || prev.contactPerson,
          contactPhone: data.contactPhone || prev.contactPhone,
          contactEmail: data.contactEmail || prev.contactEmail,
          billSeriesPrefix: data.billSeriesPrefix || prev.billSeriesPrefix,
          emdDetails: data.emdDetails || prev.emdDetails,
          agreementNumber: data.agreementNumber || prev.agreementNumber,
          documents: [autoDoc, ...(prev.documents || [])],
          packages: finalPkgs,
        };
      });

      setAiSuccessMessage(
        `✨ AI Auto-Fill Complete! Successfully extracted details from ${sampleKey === 'rdso' ? 'RDSO Indian Railways (GEMC-511687759033448)' : sampleKey.toUpperCase()} Contract. Form is now auto-filled!`
      );
    } catch (err: any) {
      console.error('Sample extraction error:', err);
      setAiErrorMessage(err.message || 'Failed to extract from sample contract');
    } finally {
      setIsAiExtracting(false);
      setAiExtractStatus('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.departmentName || !formData.tenderNumber) {
      alert('Please fill Department Name and Tender Number.');
      return;
    }
    const pkgs = formData.packages && formData.packages.length > 0 ? formData.packages : [];
    const firstPkg = pkgs[0];
    const finalTender: Tender = {
      ...formData,
      baseMonthlyRate: firstPkg ? firstPkg.monthlyBaseRate : (formData.baseMonthlyRate || 35000),
      includedKms: firstPkg ? firstPkg.includedKms : (formData.includedKms || 2000),
      includedHours: firstPkg ? firstPkg.includedHours : (formData.includedHours || 250),
      extraKmRate: firstPkg ? firstPkg.extraKmRate : (formData.extraKmRate || 12),
      extraHourRate: firstPkg ? firstPkg.extraHourRate : (formData.extraHourRate || 60),
      nightHaltRate: firstPkg ? firstPkg.nightHaltRate : (formData.nightHaltRate || 400),
      packages: pkgs,
    } as Tender;
    onSaveTender(finalTender);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span>Govt Tenders &amp; Work Orders &bull; सरकारी टेंडर व अनुबंध</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            विभिन्न विभागों (PWD, NHAI, Income Tax आदि) के मासिक फिक्स टेंडर नियम, कोटा व रेट स्लैब
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              handleOpenAdd();
              setTimeout(() => {
                handleExtractFromSample('rdso');
              }, 150);
            }}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Auto-Fill with the uploaded Indian Railways RDSO GeM Contract"
          >
            <span>🚆 User GeM Contract (RDSO Railways)</span>
          </button>
          <button
            onClick={() => {
              handleOpenAdd();
              setTimeout(() => {
                fileInputRef.current?.click();
              }, 200);
            }}
            className="px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>AI Auto-Fill via Agreement PDF</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Add New Tender / Work Order
          </button>
        </div>
      </div>

      {/* Filter and Location Selector Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Search Tenders by Department, WO No, Authority Office or City:
            </label>
            <input
              type="text"
              placeholder="e.g. NHAI, PWD, Income Tax, Lucknow, Kanpur, Varanasi, Noida, Ayodhya..."
              value={tenderSearch}
              onChange={(e) => {
                setTenderSearch(e.target.value);
                setTenderPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Filter by Location / District ({cities.length} Cities):
            </label>
            <select
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setTenderPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="all">All Locations ({tenders.length} Tenders)</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span>
            Showing <strong>{filteredTenders.length}</strong> tenders across UP &amp; North India
          </span>
          {(tenderSearch || cityFilter !== 'all') && (
            <button
              onClick={() => {
                setTenderSearch('');
                setCityFilter('all');
                setTenderPage(1);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Reset Filters &times;
            </button>
          )}
        </div>
      </div>

      {/* Tenders Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {paginatedTenders.map((tender) => {
          const attachedVehicles = vehicles.filter((v) => v.tenderId === tender.id);
          const tenderOfficers = officers.filter((o) => o.tenderId === tender.id);
          const attachedDrivers = attachedVehicles
            .map((v) => getAssignedDriverForVehicle(v, drivers, officers))
            .filter((d): d is Driver => !!d);
          const unassignedVehiclesCount = attachedVehicles.length - attachedDrivers.length;

          return (
            <div
              key={tender.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        WO: {tender.workOrderNumber}
                      </span>
                      {tender.contractType === 'on_call' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          ऑन-कॉल ड्यूटी (On-Call)
                        </span>
                      ) : tender.contractType === 'hybrid' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          मासिक + ऑन-कॉल
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          मासिक समर्पित
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5 leading-snug">
                      {tender.departmentName}
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold uppercase ${
                      tender.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tender.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {tender.authorityOffice}
                </p>

                {/* Terms Summary Matrix: Multi-Lot vs Standard */}
                {tender.packages && tender.packages.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 pb-1 border-b border-slate-100">
                      <span className="flex items-center gap-1.5 text-indigo-900 font-bold">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{tender.packages.length} Vehicle Lots / Packages</span>
                      </span>
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        Demand: {tender.packages.reduce((sum, p) => sum + (Number(p.quantity) || 1), 0)} Units
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {tender.packages.map((pkg, pIdx) => {
                        const scopeMeta = getScopeMeta(pkg.serviceScope);
                        return (
                          <div
                            key={pkg.id || pIdx}
                            className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {pkg.packageName || `Lot ${pIdx + 1}: ${pkg.vehicleCategory}`}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {pkg.quantity}x {pkg.vehicleCategory} &bull; {pkg.usageDutyType || 'Duty'}
                                </span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap shrink-0 ${scopeMeta.color}`}
                              >
                                {scopeMeta.shortLabel}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/70">
                              <span className="font-extrabold text-slate-900">
                                {formatCurrency(pkg.monthlyBaseRate)}
                                <span className="font-normal text-slate-500 text-[10px]">/mo</span>
                              </span>
                              <span className="font-medium text-indigo-700">
                                {pkg.includedKms > 0 ? `${pkg.includedKms} KM` : 'Driver Only'} &bull; {pkg.includedHours} Hrs
                              </span>
                              <span className="text-slate-500 text-[10px]">
                                +₹{pkg.extraKmRate}/km
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Base Monthly Rate:</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(tender.baseMonthlyRate)}
                        <span className="text-[10px] font-normal text-slate-500">/car/mo</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Monthly Quota:</span>
                      <span className="font-semibold text-indigo-700">
                        {tender.includedKms} KM / {tender.includedHours} Hrs
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Extra KM / Hr Rate:</span>
                      <span className="font-medium text-slate-700">
                        ₹{tender.extraKmRate}/KM &bull; ₹{tender.extraHourRate}/Hr
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Night Halt DA:</span>
                      <span className="font-medium text-slate-700">
                        ₹{tender.nightHaltRate} / Night
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Toll &amp; Fastag:</span>
                      <span className="font-medium text-emerald-700">
                        {tender.tollTerms === 'reimbursable_actuals'
                          ? 'Reimbursed on actuals'
                          : 'Contractor borne'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Contract Dates & Attached Cars */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Contract Period:</span>
                    <span className="font-medium text-slate-800">
                      {formatDate(tender.contractPeriodStart)} to {formatDate(tender.contractPeriodEnd)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Billing Cycle:</span>
                    <span className="font-medium text-slate-800">
                      {tender.billingCycleDay}th of month ({tender.paymentTermsDays} days terms)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Deployed Vehicles:</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {attachedVehicles.length} Vehicles attached
                    </span>
                  </div>
                </div>

                {/* Penalty Clause Warning */}
                {tender.penaltyClauses && (
                  <div className="mt-3 p-2 bg-amber-50/70 border border-amber-200/60 rounded text-[11px] text-amber-900">
                    <strong>Penalty Terms:</strong> {tender.penaltyClauses}
                  </div>
                )}
                {/* Vehicle, Driver & Officer count pills */}
                <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px] font-semibold text-slate-600 bg-slate-100/80 p-1.5 rounded-lg">
                  <div>
                    <span className="block text-slate-400 font-normal">Vehicles</span>
                    <span className="font-bold text-slate-800">{attachedVehicles.length}</span>
                  </div>
                  <div className="bg-amber-50/80 rounded border border-amber-200/60 p-0.5">
                    <span className="block text-amber-800 font-bold">चालक (Drivers)</span>
                    <span className={`font-black ${attachedDrivers.length > 0 ? 'text-amber-900' : 'text-rose-600'}`}>
                      {attachedDrivers.length} / {attachedVehicles.length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-normal">Officers</span>
                    <span className="font-bold text-slate-800">
                      {tenderOfficers.length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-normal">Logs</span>
                    <span className="font-bold text-indigo-700">
                      {dailyLogs.filter((l) => l.tenderId === tender.id).length}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 font-normal">Bills</span>
                    <span className="font-bold text-emerald-700">
                      {bills.filter((b) => b.tenderId === tender.id).length}
                    </span>
                  </div>
                </div>

                {/* Deployed Fleet & Drivers Roster Preview */}
                <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-indigo-600" />
                      <span>तैनात गाड़ियाँ व चालक ({attachedVehicles.length})</span>
                    </span>
                    {unassignedVehiclesCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAutoAssignDriversForTender(tender.id)}
                        className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                        title="उपलब्ध खाली चालकों को सीधे इस टेंडर की गाड़ियों में लिंक करें"
                      >
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>⚡ ऑटो-लिंक चालक ({unassignedVehiclesCount})</span>
                      </button>
                    )}
                  </div>

                  {attachedVehicles.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic py-1 text-center">
                      इस टेंडर में अभी कोई गाड़ी अटैच नहीं है। नीचे 360° हब से गाड़ी जोड़ें।
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {attachedVehicles.map((veh) => {
                        const drv = getAssignedDriverForVehicle(veh, drivers, officers);
                        const off = officers.find(
                          (o) => o.assignedVehicleId === veh.id || (veh.assignedOfficerId && o.id === veh.assignedOfficerId)
                        );

                        return (
                          <div
                            key={veh.id}
                            className="p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-[11px] text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  {veh.vehicleNumber}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                                  👨‍✈️ {drv?.name || veh.driverName || 'अनावंटित'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium truncate max-w-[130px]">
                                {veh.makeModel}
                              </span>
                            </div>

                            <div className="flex items-start justify-between gap-1 pt-1 border-t border-slate-100">
                              <div className="text-[11px] flex-1">
                                {drv ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                                      👨‍✈️ {drv.name}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      📞 {drv.phone}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                                      ⚠️ चालक अनावंटित (No Driver)
                                    </span>
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          handleQuickAssignDriver(veh.id, e.target.value);
                                        }
                                      }}
                                      className="text-[10px] px-1.5 py-0.5 bg-white border border-rose-300 rounded font-medium text-slate-800 w-full"
                                      defaultValue=""
                                    >
                                      <option value="" disabled>चालक चुनें व नियुक्त करें...</option>
                                      {drivers.map((d) => (
                                        <option key={d.id} value={d.id}>
                                          👨‍✈️ {d.name} ({d.phone})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>

                              {off && (
                                <div className="text-[10px] text-indigo-700 font-medium text-right truncate max-w-[110px]" title={`${off.name} (${off.designation})`}>
                                  👔 {off.name}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3.5 bg-slate-50 border-t border-slate-200/80 space-y-2">
                <button
                  onClick={() => setSelectedTenderForHub(tender)}
                  className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span>⚡ टेंडर 360° हब: गाड़ी/ड्राइवर बदलें व एंट्री बनाएं</span>
                </button>

                <button
                  onClick={() => {
                    const firstV = attachedVehicles[0];
                    setTenderHisabModalConfig({
                      isOpen: true,
                      initialTab: 'payments',
                      tenderId: tender.id,
                      vehicleId: firstV?.id,
                      driverId: firstV?.currentDriverId,
                    });
                  }}
                  className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                  <span>💰 चालक हिसाब, पिछला भुगतान व छुट्टी</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                  <button
                    onClick={() => setSelectedTenderForDocs(tender)}
                    className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>दस्तावेज़ ({tender.documents?.length || 3})</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(tender)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    नियम Edit
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalTenderPages > 1 && (
        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Showing <strong>{(tenderPage - 1) * tendersPerPage + 1}</strong> to{' '}
            <strong>{Math.min(tenderPage * tendersPerPage, filteredTenders.length)}</strong> of{' '}
            <strong>{filteredTenders.length}</strong> tenders (Page {tenderPage} of {totalTenderPages})
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              disabled={tenderPage === 1}
              onClick={() => setTenderPage(1)}
              className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              &laquo; First
            </button>
            <button
              disabled={tenderPage === 1}
              onClick={() => setTenderPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              &lsaquo; Prev
            </button>
            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold rounded border border-indigo-100">
              {tenderPage} / {totalTenderPages}
            </span>
            <button
              disabled={tenderPage === totalTenderPages}
              onClick={() => setTenderPage((p) => Math.min(totalTenderPages, p + 1))}
              className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              Next &rsaquo;
            </button>
            <button
              disabled={tenderPage === totalTenderPages}
              onClick={() => setTenderPage(totalTenderPages)}
              className="px-2.5 py-1.5 border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              Last &raquo;
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                {formData.id && tenders.some((t) => t.id === formData.id)
                  ? 'Edit Tender Terms (टेंडर नियम संपादित करें)'
                  : 'Add New Govt Tender / Work Order (नया टेंडर जोड़ें)'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Hidden File Input for PDF / Doc upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,image/*,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleExtractFromPdf(file);
                }
                // reset so the same file can be selected again if needed
                e.target.value = '';
              }}
            />

            {/* AI Tender Document Extraction & Auto-Fill Section */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-sky-50/60 p-4 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                      <span>AI Tender Agreement Auto-Fill &bull; एग्रीमेंट PDF से स्वतः विवरण भरें</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">
                        Gemini AI
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      टेंडर एग्रीमेंट PDF, GeM Sanction Order या Work Order अपलोड करें — सभी नियम, दरें व कोटा अपने आप भर जाएंगे।
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-indigo-200 hover:border-indigo-400 bg-white/90 hover:bg-white rounded-lg p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center group shadow-2xs"
                >
                  <UploadCloud className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-xs font-semibold text-indigo-900">
                    Upload Agreement PDF / Scan Order
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Supports .PDF, PNG, JPG (Max 30MB)
                  </span>
                </div>

                {/* Quick 1-Click Samples for Testing */}
                <div className="bg-white/90 rounded-lg p-2.5 border border-indigo-100 flex flex-col justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Or Test with 1-Click Govt Contract Samples:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      disabled={isAiExtracting}
                      onClick={() => handleExtractFromSample('rdso')}
                      className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded border border-amber-300 text-center text-[10px] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs flex items-center justify-center gap-1"
                      title="GeM Contract GEMC-511687759033448 - Indian Railways RDSO (6 Sedans + 4 SUVs)"
                    >
                      <span>🚆 RDSO Railways (User GeM)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isAiExtracting}
                      onClick={() => handleExtractFromSample('gem')}
                      className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded border border-indigo-200 text-center text-[10px] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      📄 GeM (Disaster)
                    </button>
                    <button
                      type="button"
                      disabled={isAiExtracting}
                      onClick={() => handleExtractFromSample('pwd')}
                      className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded border border-emerald-200 text-center text-[10px] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      📑 PWD Work Order
                    </button>
                    <button
                      type="button"
                      disabled={isAiExtracting}
                      onClick={() => handleExtractFromSample('nhai')}
                      className="px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded border border-slate-200 text-center text-[10px] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      🛡️ NHAI PIU
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Extraction Progress */}
              {isAiExtracting && (
                <div className="mt-3 p-3 bg-indigo-600 text-white rounded-lg flex items-center gap-2.5 text-xs shadow-xs animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                  <div>
                    <span className="font-semibold">AI Extraction in Progress: </span>
                    <span>{aiExtractStatus || 'Reading document clauses & rates with Gemini AI...'}</span>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {aiSuccessMessage && !isAiExtracting && (
                <div className="mt-3 p-3 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-xl text-xs flex flex-col gap-2 shadow-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm text-emerald-950">{aiSuccessMessage}</span>
                      <span className="block text-[11px] text-emerald-800 mt-1">
                        ✓ Rate: ₹{formData.baseMonthlyRate?.toLocaleString('en-IN')}/mo &bull; Quota: {formData.includedKms} KM / {formData.includedHours} Hrs &bull; Bill Series: {formData.billSeriesPrefix || 'Default'} &bull; PDF Attached
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-200" />
                      <span>✓ Save &amp; Add This Tender to System Now (टेंडर तुरंत जोड़ें)</span>
                    </button>
                    <span className="text-[11px] text-emerald-800 font-medium">
                      Or review &amp; edit the extracted details in form below &darr;
                    </span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {aiErrorMessage && !isAiExtracting && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{aiErrorMessage}</span>
                </div>
              )}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400">
                <span className="bg-white px-3 font-semibold">Tender Details &amp; Form Fields</span>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department Name (विभाग का नाम) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.departmentName || ''}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                    placeholder="e.g. Public Works Department (PWD)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tender / GeM Bid Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tenderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, tenderNumber: e.target.value })}
                    placeholder="e.g. GeM-GEM/2026/B/918230"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Work Order Number (कार्य आदेश संख्या)
                  </label>
                  <input
                    type="text"
                    value={formData.workOrderNumber || ''}
                    onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })}
                    placeholder="e.g. WO-PWD-7892-C"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Authority Office / Division Address
                  </label>
                  <input
                    type="text"
                    value={formData.authorityOffice || ''}
                    onChange={(e) => setFormData({ ...formData, authorityOffice: e.target.value })}
                    placeholder="e.g. Executive Engineer Division 1, Nirman Bhawan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Tender Contract Nature: Monthly Dedicated vs On-Call vs Hybrid */}
              <div className="bg-gradient-to-r from-slate-50 via-indigo-50/30 to-emerald-50/30 p-4 rounded-xl border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block font-bold text-slate-900 text-xs">
                      अनुबंध का स्वरूप / टेंडर प्रकार (Tender Contract Nature) *
                    </label>
                    <p className="text-[11px] text-slate-500">
                      मासिक अनुबंधित (Fixed Rate/KM), ऑन-कॉल (स्पॉट ड्यूटी / दैनिक पैकेज) या दोनों संयुक्त (Hybrid)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {formData.contractType === 'on_call'
                      ? '⚡ On-Call Spot Duty'
                      : formData.contractType === 'hybrid'
                      ? '🔄 Monthly + On-Call'
                      : '📅 Monthly Dedicated'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      formData.contractType === 'monthly_attached' || !formData.contractType
                        ? 'bg-white border-indigo-500 shadow-xs ring-2 ring-indigo-200'
                        : 'bg-white/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contractType"
                      value="monthly_attached"
                      checked={formData.contractType === 'monthly_attached' || !formData.contractType}
                      onChange={() => setFormData({ ...formData, contractType: 'monthly_attached' })}
                      className="mt-1 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-slate-900 text-xs">मासिक समर्पित (Monthly)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        अधिकारी हेतु 24x7 या 10-12 घंटे मासिक फिक्स KM व मासिक बिलिंग
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      formData.contractType === 'on_call'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contractType"
                      value="on_call"
                      checked={formData.contractType === 'on_call'}
                      onChange={() => {
                        const defaults = formData.onCallDefaults || {
                          defaultPackageType: 'local_8hr_80km',
                          baseRate: 2400,
                          baseHours: 8,
                          baseKm: 80,
                          extraKmRate: 14,
                          extraHourRate: 150,
                          nightHaltRate: 350,
                          driverDaRate: 300,
                          gstRatePercent: 5,
                          defaultPickupLocation: formData.authorityOffice || 'निर्माण भवन, हजरतगंज, लखनऊ',
                          defaultDropLocation: 'साइट निरीक्षण व फील्ड',
                          clientGstin: '09AAAGP1234E1Z1',
                          clientBillingAddress: formData.authorityOffice || '',
                          defaultBookerName: formData.contactPerson || 'Er. Pradeep Sharma (PA)',
                          defaultBookerPhone: formData.contactPhone || '9415011223',
                          defaultBookerDesignation: formData.officerDesignationsSummary || 'Staff Officer / PA',
                          defaultBookerRoom: 'Room 304, Third Floor',
                          specialInstructions: 'गाड़ी में एसी लगातार चालू रहे, सफेद सीट कवर व पानी की बोतल।',
                        };
                        setFormData({ ...formData, contractType: 'on_call', onCallDefaults: defaults });
                      }}
                      className="mt-1 text-emerald-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-emerald-950 text-xs">ऑन-कॉल ड्यूटी (On-Call)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        आवश्यकतानुसार 8Hr/80KM, 12Hr/100KM या आउटस्टेशन स्पॉट ड्यूटी
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                      formData.contractType === 'hybrid'
                        ? 'bg-purple-50 border-purple-500 shadow-xs ring-2 ring-purple-200'
                        : 'bg-white/80 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="contractType"
                      value="hybrid"
                      checked={formData.contractType === 'hybrid'}
                      onChange={() => {
                        const defaults = formData.onCallDefaults || {
                          defaultPackageType: 'local_8hr_80km',
                          baseRate: 2400,
                          baseHours: 8,
                          baseKm: 80,
                          extraKmRate: 14,
                          extraHourRate: 150,
                          nightHaltRate: 350,
                          driverDaRate: 300,
                          gstRatePercent: 5,
                          defaultPickupLocation: formData.authorityOffice || 'मुख्यालय / निर्माण भवन, लखनऊ',
                          defaultDropLocation: 'साइट निरीक्षण व फील्ड',
                          clientGstin: '09AAAGP1234E1Z1',
                          clientBillingAddress: formData.authorityOffice || '',
                          defaultBookerName: formData.contactPerson || '',
                          defaultBookerPhone: formData.contactPhone || '',
                          defaultBookerDesignation: formData.officerDesignationsSummary || 'Staff Officer / PA',
                          defaultBookerRoom: 'Room 304',
                          specialInstructions: 'गाड़ी में एसी लगातार चालू रहे।',
                        };
                        setFormData({ ...formData, contractType: 'hybrid', onCallDefaults: defaults });
                      }}
                      className="mt-1 text-purple-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-purple-950 text-xs">संयुक्त (मासिक + ऑन-कॉल)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        समर्पित गाड़ियां + आवश्यकता पड़ने पर अतिरिक्त ऑन-कॉल ड्यूटी
                      </div>
                    </div>
                  </label>
                </div>

                {/* If On-Call or Hybrid: Show Auto-Fill Defaults & Rate Templates */}
                {(formData.contractType === 'on_call' || formData.contractType === 'hybrid') && (
                  <div className="mt-3 p-3.5 bg-white border border-emerald-300 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                      <div>
                        <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                          <span>⚡ ऑन-कॉल ड्यूटी ऑटो-फिल दरें व सरकारी संपर्क डिफ़ॉल्ट्स</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                            Auto-Fill Enabled
                          </span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          जब भी आप बुकिंग फॉर्म में इस टेंडर का चयन करेंगे, ये सभी बेसिक विवरण स्वतः भर जाएंगे।
                        </p>
                      </div>

                      {/* 1-Click Preset Buttons */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <span className="text-[10px] text-slate-400 font-semibold">1-क्लिक प्रीसेट:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultPackageType: 'local_8hr_80km',
                                baseRate: 2400,
                                baseHours: 8,
                                baseKm: 80,
                                extraKmRate: 14,
                                extraHourRate: 150,
                                nightHaltRate: 350,
                                driverDaRate: 300,
                                gstRatePercent: 5,
                              },
                            });
                          }}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold transition"
                        >
                          PWD 8Hr/80KM (₹2400)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultPackageType: 'local_12hr_100km',
                                baseRate: 3100,
                                baseHours: 12,
                                baseKm: 100,
                                extraKmRate: 14,
                                extraHourRate: 150,
                                nightHaltRate: 350,
                                driverDaRate: 300,
                                gstRatePercent: 5,
                              },
                            });
                          }}
                          className="px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded text-[10px] font-bold transition"
                        >
                          12Hr/100KM (₹3100)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultPackageType: 'outstation',
                                baseRate: 3800,
                                baseHours: 12,
                                baseKm: 250,
                                extraKmRate: 18,
                                extraHourRate: 200,
                                nightHaltRate: 500,
                                driverDaRate: 400,
                                gstRatePercent: 5,
                              },
                            });
                          }}
                          className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-[10px] font-bold transition"
                        >
                          VIP Crysta आउटस्टेशन (₹3800)
                        </button>
                      </div>
                    </div>

                    {/* Rates Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          डिफ़ॉल्ट पैकेज
                        </label>
                        <select
                          value={formData.onCallDefaults?.defaultPackageType || 'local_8hr_80km'}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultPackageType: e.target.value as any,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="local_8hr_80km">8 Hours / 80 KM Local</option>
                          <option value="local_12hr_100km">12 Hours / 100 KM Full Day</option>
                          <option value="outstation">Outstation / Field Inspection</option>
                          <option value="airport_station_transfer">Airport / Station Transfer</option>
                          <option value="night_halt_inspection">Night Halt Inspection</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          बेस रेट (₹)
                        </label>
                        <input
                          type="number"
                          value={formData.onCallDefaults?.baseRate ?? 2400}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                baseRate: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          अतिरिक्त KM दर (₹/KM)
                        </label>
                        <input
                          type="number"
                          value={formData.onCallDefaults?.extraKmRate ?? 14}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                extraKmRate: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          अतिरिक्त घंटा दर (₹/Hr)
                        </label>
                        <input
                          type="number"
                          value={formData.onCallDefaults?.extraHourRate ?? 150}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                extraHourRate: Number(e.target.value),
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>

                    {/* Contact & Location Defaults */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          डिफ़ॉल्ट पिकअप स्थल
                        </label>
                        <input
                          type="text"
                          value={formData.onCallDefaults?.defaultPickupLocation || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultPickupLocation: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. निर्माण भवन, हजरतगंज, लखनऊ"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          डिफ़ॉल्ट बुकर / PA नाम
                        </label>
                        <input
                          type="text"
                          value={formData.onCallDefaults?.defaultBookerName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultBookerName: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Er. Pradeep Sharma (PA)"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          बुकर फोन / कमरा नं.
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={formData.onCallDefaults?.defaultBookerPhone || ''}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultBookerPhone: e.target.value,
                              },
                            })
                          }
                          placeholder="फोन"
                          className="w-2/3 px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        />
                        <input
                          type="text"
                          value={formData.onCallDefaults?.defaultBookerRoom || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onCallDefaults: {
                                ...(formData.onCallDefaults || {}),
                                defaultBookerRoom: e.target.value,
                              },
                            })
                          }
                          placeholder="कमरा"
                          className="w-1/3 px-2 py-1.5 border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Vehicle Requirements, Variants &amp; Service Scope</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {(formData.packages || []).length} Lot(s)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      टेंडर में अलग-अलग वैरिएंट की गाड़ियां (Sedan, SUV, Bus), अलग-अलग उपयोग व अलग-अलग KM/घंटे व दरों पर हो सकती हैं। सेवा का स्वरूप (गाड़ी+ड्राइवर+ईंधन, केवल गाड़ी या केवल ड्राइवर) चुनें।
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddPackage}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs self-start sm:self-auto cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Add Another Variant / Lot (अन्य गाड़ी जोड़ें)</span>
                  </button>
                </div>

                {/* Package Cards List */}
                <div className="space-y-4">
                  {(formData.packages || []).map((pkg, idx) => {
                    const scopeMeta = getScopeMeta(pkg.serviceScope);
                    return (
                      <div
                        key={pkg.id || idx}
                        className="bg-white rounded-xl border-2 border-indigo-100 shadow-xs p-4 space-y-3.5 transition-all hover:border-indigo-300"
                      >
                        {/* Package Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono font-bold text-xs shrink-0">
                              Lot #{idx + 1}
                            </span>
                            <input
                              type="text"
                              value={pkg.packageName || ''}
                              onChange={(e) =>
                                handleUpdatePackage(pkg.id, { packageName: e.target.value })
                              }
                              placeholder="e.g. Lot 1: Executive Inspection Sedan (Swift Dzire)"
                              className="font-bold text-slate-900 text-xs px-2.5 py-1 border border-slate-200 rounded-md w-full max-w-md bg-slate-50 focus:bg-white"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${scopeMeta.color}`}>
                              {scopeMeta.shortLabel}
                            </span>
                            {(formData.packages || []).length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemovePackage(pkg.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Remove this vehicle lot"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Service Scope Selector */}
                        <div>
                          <label className="block font-semibold text-slate-700 text-[11px] mb-1.5">
                            Scope of Requirement / Service (सेवा का स्वरूप) *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <label
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                                pkg.serviceScope === 'vehicle_driver_fuel'
                                  ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-400 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`scope-${pkg.id}`}
                                checked={pkg.serviceScope === 'vehicle_driver_fuel'}
                                onChange={() =>
                                  handleUpdatePackage(pkg.id, { serviceScope: 'vehicle_driver_fuel' })
                                }
                                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  🚗👨‍✈️⛽ Full Package
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                  गाड़ी + ड्राइवर + ईंधन (संपूर्ण व्यवस्था कांट्रेक्टर की)
                                </span>
                              </div>
                            </label>

                            <label
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                                pkg.serviceScope === 'vehicle_driver'
                                  ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-400 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`scope-${pkg.id}`}
                                checked={pkg.serviceScope === 'vehicle_driver'}
                                onChange={() =>
                                  handleUpdatePackage(pkg.id, { serviceScope: 'vehicle_driver' })
                                }
                                className="mt-0.5 text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  🚗👨‍✈️ Vehicle + Driver
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                  गाड़ी + ड्राइवर (ईंधन विभाग देगा या पर्ची/बिल पर)
                                </span>
                              </div>
                            </label>

                            <label
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                                pkg.serviceScope === 'only_vehicle'
                                  ? 'bg-purple-50/80 border-purple-500 ring-1 ring-purple-400 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`scope-${pkg.id}`}
                                checked={pkg.serviceScope === 'only_vehicle'}
                                onChange={() =>
                                  handleUpdatePackage(pkg.id, { serviceScope: 'only_vehicle' })
                                }
                                className="mt-0.5 text-purple-600 focus:ring-purple-500"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  🚗 Only Vehicle (Dry Lease)
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                  केवल गाड़ी (ड्राइवर सरकारी विभाग का होगा)
                                </span>
                              </div>
                            </label>

                            <label
                              className={`p-2.5 rounded-lg border cursor-pointer flex items-start gap-2 transition-all ${
                                pkg.serviceScope === 'only_driver'
                                  ? 'bg-amber-50/80 border-amber-500 ring-1 ring-amber-400 shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`scope-${pkg.id}`}
                                checked={pkg.serviceScope === 'only_driver'}
                                onChange={() =>
                                  handleUpdatePackage(pkg.id, { serviceScope: 'only_driver' })
                                }
                                className="mt-0.5 text-amber-600 focus:ring-amber-500"
                              />
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">
                                  👨‍✈️ Only Driver Service
                                </span>
                                <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                  केवल चालक सेवा (गाड़ी सरकारी विभाग की होगी)
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Variant, Duty & Quantity Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-medium text-slate-700 text-[11px] mb-1">
                              Vehicle Variant / Category (गाड़ी का प्रकार) *
                            </label>
                            <select
                              value={pkg.vehicleCategory || 'Sedan'}
                              onChange={(e) =>
                                handleUpdatePackage(pkg.id, { vehicleCategory: e.target.value })
                              }
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                            >
                              <option value="Sedan">Sedan (Dzire, Amaze, Aura, etc.)</option>
                              <option value="Compact SUV">Compact SUV (Bolero Neo, Brezza, Nexon)</option>
                              <option value="Executive SUV">Executive SUV (Scorpio, Safari, Harrier)</option>
                              <option value="Premium SUV">Premium SUV (Innova Crysta, Fortuner)</option>
                              <option value="Hatchback">Hatchback (WagonR, Tiago, etc.)</option>
                              <option value="MUV / Van">MUV / Van (Ertiga, Triber, Eeco)</option>
                              <option value="Bus / Traveller">Staff Bus / Tempo Traveller (12-32 Seater)</option>
                              <option value="Commercial Pickup">Commercial Goods / Pickup</option>
                              <option value="Driver Only">Driver Only (केवल चालक सेवा)</option>
                              <option value="Other">Other Custom Category</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-medium text-slate-700 text-[11px] mb-1">
                              Usage / Duty Type (उपयोग का प्रकार)
                            </label>
                            <input
                              type="text"
                              value={pkg.usageDutyType || ''}
                              onChange={(e) =>
                                handleUpdatePackage(pkg.id, { usageDutyType: e.target.value })
                              }
                              placeholder="e.g. 2500 km x 320 hrs; Outstation / 24x7"
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                            />
                          </div>

                          <div>
                            <label className="block font-medium text-slate-700 text-[11px] mb-1">
                              Vehicles / Drivers Required (मांग/संख्या) *
                            </label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={pkg.quantity || 1}
                              onChange={(e) =>
                                handleUpdatePackage(pkg.id, { quantity: Number(e.target.value) || 1 })
                              }
                              placeholder="1"
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold"
                            />
                          </div>
                        </div>

                        {/* Commercial Pricing & Rates for this Variant */}
                        <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Rates &amp; Quotas for {pkg.vehicleCategory} (इस वैरिएंट की दरें व सीमाएं):
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Monthly Rate (₹) *
                              </label>
                              <input
                                type="number"
                                required
                                value={pkg.monthlyBaseRate || ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { monthlyBaseRate: Number(e.target.value) })
                                }
                                placeholder="35000"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Included KM / Mo
                              </label>
                              <input
                                type="number"
                                value={pkg.includedKms ?? ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { includedKms: Number(e.target.value) })
                                }
                                placeholder="2000"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold text-indigo-700"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Included Hours
                              </label>
                              <input
                                type="number"
                                value={pkg.includedHours ?? ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { includedHours: Number(e.target.value) })
                                }
                                placeholder="250"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-semibold"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Extra KM Rate (₹)
                              </label>
                              <input
                                type="number"
                                value={pkg.extraKmRate ?? ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { extraKmRate: Number(e.target.value) })
                                }
                                placeholder="12"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Extra Hr Rate (₹)
                              </label>
                              <input
                                type="number"
                                value={pkg.extraHourRate ?? ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { extraHourRate: Number(e.target.value) })
                                }
                                placeholder="60"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                Night Halt DA (₹)
                              </label>
                              <input
                                type="number"
                                value={pkg.nightHaltRate ?? ''}
                                onChange={(e) =>
                                  handleUpdatePackage(pkg.id, { nightHaltRate: Number(e.target.value) })
                                }
                                placeholder="400"
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                              />
                            </div>
                          </div>

                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={pkg.specifications || ''}
                              onChange={(e) =>
                                handleUpdatePackage(pkg.id, { specifications: e.target.value })
                              }
                              placeholder="Specifications: e.g. White color, AC, Model Year not older than 2023, GPS enabled, Commercial registration"
                              className="w-full px-3 py-1 text-[11px] border border-slate-200 rounded-md bg-white text-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Common Payment & Billing Schedule */}
                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-3 text-xs">
                  <div className="flex-1">
                    <label className="block font-medium text-slate-600 mb-1">
                      Billing Cycle Day of Month (बिलिंग दिवस)
                    </label>
                    <input
                      type="number"
                      value={formData.billingCycleDay || 1}
                      min={1}
                      max={31}
                      onChange={(e) => setFormData({ ...formData, billingCycleDay: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block font-medium text-slate-600 mb-1">
                      Payment Terms (Credit Days / भुगतान समयावधि)
                    </label>
                    <input
                      type="number"
                      value={formData.paymentTermsDays || 30}
                      onChange={(e) => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Penalties & Toll Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Toll &amp; Parking Arrangement
                  </label>
                  <select
                    value={formData.tollTerms || 'reimbursable_actuals'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tollTerms: e.target.value as 'reimbursable_actuals' | 'contractor_borne',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="reimbursable_actuals">Reimbursable by Department against Receipts</option>
                    <option value="contractor_borne">Contractor borne (Included in base rate)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tender Status
                  </label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'completed' | 'renewed',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                  >
                    <option value="active">Active (चालू टेंडर)</option>
                    <option value="completed">Completed / Expired</option>
                    <option value="renewed">Renewed (नवीनीकृत)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Penalty Clauses &amp; SLA Deductions (पेनाल्टी नियम)
                </label>
                <textarea
                  rows={2}
                  value={formData.penaltyClauses || ''}
                  onChange={(e) => setFormData({ ...formData, penaltyClauses: e.target.value })}
                  placeholder="e.g. ₹1,000/day for unserved day without substitute; ₹500 for non-AC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
              </div>

              {/* Dates & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.contractPeriodStart || ''}
                    onChange={(e) => setFormData({ ...formData, contractPeriodStart: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contract End Date
                  </label>
                  <input
                    type="date"
                    value={formData.contractPeriodEnd || ''}
                    onChange={(e) => setFormData({ ...formData, contractPeriodEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Officer / Nodal Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g. Er. R.K. Nigam (EE Admin)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Bill Series & EMD Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Custom Bill Series Prefix (इस टेंडर की बिल सीरीज)
                  </label>
                  <input
                    type="text"
                    value={formData.billSeriesPrefix || ''}
                    onChange={(e) => setFormData({ ...formData, billSeriesPrefix: e.target.value })}
                    placeholder="e.g. PWD/LKO/2026/ or SFT/NHAI/"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Leave blank to use default company bill numbering
                  </span>
                </div>
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    EMD / Bank Guarantee / PBG Details
                  </label>
                  <input
                    type="text"
                    value={formData.emdDetails || ''}
                    onChange={(e) => setFormData({ ...formData, emdDetails: e.target.value })}
                    placeholder="e.g. BG #98234 SBI ₹2,50,000 Exp: 31-03-2027"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Save Tender Terms
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Tender Documents Modal */}
      {selectedTenderForDocs && (
        <DocumentManagerModal
          isOpen={!!selectedTenderForDocs}
          onClose={() => setSelectedTenderForDocs(null)}
          entityType="tender"
          entity={selectedTenderForDocs}
          onUpdateEntity={(updatedTender) => {
            onSaveTender(updatedTender);
            setSelectedTenderForDocs(updatedTender);
          }}
        />
      )}

      {/* Tender 360° Control Hub & Action Modal */}
      {selectedTenderForHub && (
        <TenderDetailHubModal
          tender={selectedTenderForHub}
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
          onClose={() => setSelectedTenderForHub(null)}
          onSaveOfficer={onSaveOfficer}
          onSaveVehicle={onSaveVehicle}
          onSaveDriver={onSaveDriver}
          onReplaceDriver={onReplaceDriver}
          onReplaceVehicle={onReplaceVehicle}
          onTransferOrRelieveOfficer={onTransferOrRelieveOfficer}
          onReactivateIdleVehicle={onReactivateIdleVehicle}
          onAddLog={onAddLog}
          onAddFuelRecord={onAddFuelRecord}
          onSaveBill={onSaveBill}
          onAddDailyPayment={onAddDailyPayment}
          onToggleLogVerified={onToggleLogVerified}
          onAddTransaction={onAddTransaction}
          onDeleteTransaction={onDeleteTransaction}
          onAddDriverLeave={onAddDriverLeave}
          onDeleteDriverLeave={onDeleteDriverLeave}
          onOpenProfileModal={onOpenProfileModal}
        />
      )}

      {/* Unified In-Place Driver Hisab, Payment & Leave Modal triggered from Tender */}
      {tenderHisabModalConfig?.isOpen && (
        <DriverHisabAndLeaveModal
          isOpen={tenderHisabModalConfig.isOpen}
          onClose={() => setTenderHisabModalConfig(null)}
          initialTab={tenderHisabModalConfig.initialTab}
          preSelectedTenderId={tenderHisabModalConfig.tenderId}
          preSelectedVehicleId={tenderHisabModalConfig.vehicleId}
          preSelectedDriverId={tenderHisabModalConfig.driverId}
          tenders={tenders as any}
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
