import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Car,
  Users,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Info,
  Check,
  RefreshCw,
  Layers,
  ArrowRight,
  Briefcase,
  UserCheck,
  Building2,
  FileText,
  Handshake,
  Plus,
  Trash2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import {
  Vehicle,
  Driver,
  Tender,
  Vendor,
  Officer,
  BookingRecord,
  DutyTypeCategory,
} from '../types';
import {
  downloadVehicleExcelTemplate,
  downloadVehicleCsvTemplate,
  downloadDriverExcelTemplate,
  downloadDriverCsvTemplate,
  downloadOfficerExcelTemplate,
  downloadOfficerCsvTemplate,
  downloadTenderExcelTemplate,
  downloadTenderCsvTemplate,
  downloadDutyBookingExcelTemplate,
  downloadDutyBookingCsvTemplate,
  downloadVendorExcelTemplate,
  downloadVendorCsvTemplate,
  downloadCombinedFleetExcelTemplate,
} from '../utils/excelTemplateHelper';
import {
  generateDriverUniqueId,
  generateVendorUniqueId,
  generateOfficerUniqueId,
} from '../utils/idGenerator';

export type BulkImportType =
  | 'vehicles'
  | 'drivers'
  | 'officers'
  | 'tenders'
  | 'duties'
  | 'vendors'
  | 'combined';

export interface ParsedVehicleRow {
  rowNumber: number;
  vehicleNumber: string;
  makeModel: string;
  vehicleType: 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV';
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  ownershipType: 'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver';
  driverName?: string;
  driverPhone?: string;
  driverDl?: string;
  driverSalary?: number;
  assignedOfficerName?: string;
  vendorName?: string;
  monthlyVendorRent?: number;
  currentOdometer: number;
  tenderName?: string;
  assignedDriver?: string;
  rtoFitnessExpiry: string;
  insuranceExpiry: string;
  pucExpiry: string;
  roadTaxExpiry: string;
  permitExpiry: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ParsedDriverRow {
  rowNumber: number;
  name: string;
  phone: string;
  alternatePhone?: string;
  licenseNumber: string;
  licenseExpiry: string;
  employmentType: 'company_statutory' | 'contractual_khata' | 'owner_driver';
  monthlySalary: number;
  dailyDaRate: number;
  panNumber?: string;
  aadharNumber?: string;
  assignedVehicleNumber?: string;
  bankAccountDetails?: string;
  address?: string;
  joiningDate: string;
  policeVerificationExpiry: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ParsedOfficerRow {
  rowNumber: number;
  name: string;
  designation: string;
  department: string;
  mobile: string;
  alternatePhone?: string;
  officeAddress: string;
  tenderName: string;
  assignedVehicleNumber?: string;
  reportingTime: string;
  email?: string;
  specialInstructions?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ParsedTenderRow {
  rowNumber: number;
  tenderNumber: string;
  departmentName: string;
  authorityOffice: string;
  startDate: string;
  endDate: string;
  sanctionedAmount: number;
  serviceScope: 'vehicle_driver_fuel' | 'vehicle_driver' | 'vehicle_only';
  vehiclesRequired: number;
  contactOfficerName?: string;
  contactOfficerPhone?: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ParsedDutyBookingRow {
  rowNumber: number;
  dutyDate: string;
  dutySlipNumber: string;
  clientName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone?: string;
  pickupLocation: string;
  dropLocation: string;
  packageType: string;
  baseRate: number;
  garageOutKm?: number;
  garageInKm?: number;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

export interface ParsedVendorRow {
  rowNumber: number;
  name: string;
  phone: string;
  contactPerson: string;
  vendorType: 'fleet_vendor' | 'owner_driver';
  monthlyRate: number;
  isTds: boolean;
  tdsRate: number;
  panNumber: string;
  bankDetails: string;
  address: string;
  isValid: boolean;
  isDuplicate: boolean;
  errors: string[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: BulkImportType;
  existingVehicles: Vehicle[];
  existingDrivers: Driver[];
  existingOfficers?: Officer[];
  tenders: Tender[];
  vendors: Vendor[];
  onImportVehicles: (newVehicles: Vehicle[], newVendors?: Vendor[]) => void | Promise<void>;
  onImportDrivers: (newDrivers: Driver[]) => void | Promise<void>;
  onImportOfficers?: (newOfficers: Officer[]) => void | Promise<void>;
  onImportTenders?: (newTenders: Tender[]) => void | Promise<void>;
  onImportVendors?: (newVendors: Vendor[]) => void | Promise<void>;
  onImportDuties?: (newDuties: BookingRecord[]) => void | Promise<void>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  initialType = 'vehicles',
  existingVehicles,
  existingDrivers,
  existingOfficers = [],
  tenders,
  vendors,
  onImportVehicles,
  onImportDrivers,
  onImportOfficers = () => {},
  onImportTenders = () => {},
  onImportVendors = () => {},
  onImportDuties = () => {},
}) => {
  const [activeType, setActiveType] = useState<BulkImportType>(initialType);
  const [entryMode, setEntryMode] = useState<'upload' | 'manual'>('upload');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [previewSubTab, setPreviewSubTab] = useState<BulkImportType>('vehicles');

  // Parsed Data State for each entity
  const [parsedVehicles, setParsedVehicles] = useState<ParsedVehicleRow[]>([]);
  const [parsedDrivers, setParsedDrivers] = useState<ParsedDriverRow[]>([]);
  const [parsedOfficers, setParsedOfficers] = useState<ParsedOfficerRow[]>([]);
  const [parsedTenders, setParsedTenders] = useState<ParsedTenderRow[]>([]);
  const [parsedDuties, setParsedDuties] = useState<ParsedDutyBookingRow[]>([]);
  const [parsedVendors, setParsedVendors] = useState<ParsedVendorRow[]>([]);

  // Direct Manual Feeding Form States
  const [manualVehicle, setManualVehicle] = useState({
    vehicleNumber: '',
    makeModel: '',
    vehicleType: 'Sedan' as const,
    fuelType: 'Diesel' as const,
    ownershipType: 'Company Owned' as const,
    driverName: '',
    driverPhone: '',
    driverSalary: 16500,
    assignedOfficerName: '',
    tenderName: '',
    vendorName: '',
    monthlyRent: 0,
  });

  const [manualDriver, setManualDriver] = useState({
    name: '',
    phone: '',
    licenseNumber: '',
    employmentType: 'contractual_khata' as const,
    monthlySalary: 16500,
    dailyDaRate: 350,
    assignedVehicleNumber: '',
    address: '',
  });

  const [manualOfficer, setManualOfficer] = useState({
    name: '',
    designation: '',
    department: '',
    mobile: '',
    tenderName: '',
    assignedVehicleNumber: '',
    reportingTime: '09:30 AM',
  });

  const [manualTender, setManualTender] = useState({
    tenderNumber: '',
    departmentName: '',
    authorityOffice: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '2027-03-31',
    sanctionedAmount: 200000,
    serviceScope: 'vehicle_driver_fuel' as const,
    vehiclesRequired: 2,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveType(initialType);
      resetState();
      setPreviewSubTab(initialType);
    }
  }, [isOpen, initialType]);

  const resetState = () => {
    setSelectedFileName('');
    setParsedVehicles([]);
    setParsedDrivers([]);
    setParsedOfficers([]);
    setParsedTenders([]);
    setParsedDuties([]);
    setParsedVendors([]);
    setImportSuccessMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // HELPER: Normalize Headers
  // -------------------------------------------------------------
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .replace(/[\*\(\)\-\_\/]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  type DetectedImportEntity =
    | 'vehicles'
    | 'drivers'
    | 'officers'
    | 'tenders'
    | 'duties'
    | 'vendors';

  const detectEntityFromName = (name: string): DetectedImportEntity | null => {
    const n = name.toLowerCase();
    if (n.includes('officer') || n.includes('अधिकारी')) return 'officers';
    if (n.includes('tender') || n.includes('टेंडर')) return 'tenders';
    if (n.includes('vendor') || n.includes('वेंडर')) return 'vendors';
    if (n.includes('duty') || n.includes('booking') || n.includes('ड्यूटी') || n.includes('gr no')) {
      return 'duties';
    }
    // Prefer vehicles over drivers when both words appear (e.g. vehicles-with-drivers.csv)
    if (n.includes('vehicle') || n.includes('गाड़ी') || n.includes('fleet') || n.includes('gadi')) {
      return 'vehicles';
    }
    if (n.includes('driver') || n.includes('चालक')) return 'drivers';
    return null;
  };

  const detectEntityFromHeaders = (jsonData: any[]): DetectedImportEntity | null => {
    if (!jsonData.length) return null;
    const headers = Object.keys(jsonData[0] || {}).map((k) => normalizeKey(k));
    const headerText = headers.join(' | ');
    if (!headerText) return null;

    const scores: Record<DetectedImportEntity, number> = {
      vehicles: 0,
      drivers: 0,
      officers: 0,
      tenders: 0,
      duties: 0,
      vendors: 0,
    };

    if (/(duty date|duty slip|garage out|garage in|pickup location|drop location)/.test(headerText)) {
      scores.duties += 5;
    }
    if (/(client|package|base rate)/.test(headerText) && scores.duties > 0) scores.duties += 1;

    if (/(vendor type|tds applicable|tds rate|monthly agreed rate)/.test(headerText)) {
      scores.vendors += 5;
    }
    if (
      /(vendor name|वेंडर)/.test(headerText) &&
      !/(make|model|ownership|स्वामित्व)/.test(headerText)
    ) {
      scores.vendors += 3;
    }

    // True vehicle master columns (not "Assigned Vehicle Number" on officer/driver sheets)
    const hasPrimaryVehicleNo = headers.some(
      (h) =>
        /^(vehicle number|vehicle no|reg no|registration|गाड़ी नंबर|gadi number)\b/.test(h) ||
        h === 'vehicle number' ||
        h.startsWith('vehicle number ')
    );
    const hasVehicleMasterFields = /(make|model|मेक|मॉडल|ownership|स्वामित्व|fuel type|ईंधन)/.test(
      headerText
    );
    if (hasPrimaryVehicleNo) scores.vehicles += 4;
    if (hasVehicleMasterFields) scores.vehicles += 3;

    if (/(driver name|चालक का नाम|चालक नाम)/.test(headerText)) scores.drivers += 2;
    if (/(license|dl number|डीएल|driving license)/.test(headerText)) scores.drivers += 3;
    if (/(employment type|driver type|श्रेणी)/.test(headerText)) scores.drivers += 1;

    if (/(officer name|name of the officer|name of officer|अधिकारी का नाम)/.test(headerText)) {
      scores.officers += 5;
    }
    if (/(designation|पदनाम|rank)/.test(headerText)) scores.officers += 3;
    if (/(department|विभाग)/.test(headerText) && !hasVehicleMasterFields) {
      scores.officers += 2;
    }
    // Officers often have an assigned-vehicle column — that alone must NOT win vehicles.
    if (/(assigned vehicle|तैनात गाड़ी)/.test(headerText) && scores.officers > 0) {
      scores.officers += 1;
    }

    if (/(tender number|टेंडर नंबर|tender no)/.test(headerText)) scores.tenders += 4;
    if (/(sanctioned|budget|vehicles required|बजट)/.test(headerText)) scores.tenders += 2;

    // Strong entity locks (order matters)
    if (scores.duties >= 5) return 'duties';
    if (scores.vendors >= 5) return 'vendors';
    if (scores.officers >= 5) return 'officers';
    // Vehicles only when it looks like a vehicle master sheet, not officer/driver with assigned vehicle
    if (scores.vehicles >= 6 && scores.officers < 5 && scores.drivers < 5) return 'vehicles';

    const ranked = (Object.entries(scores) as [DetectedImportEntity, number][]).sort(
      (a, b) => b[1] - a[1]
    );
    if (ranked[0][1] <= 0) return null;
    return ranked[0][0];
  };

  /** Prefer longer / exact header matches; never prefer an empty cell over a filled one. */
  const makeFindVal = (row: Record<string, unknown>) => {
    const rowEntries = Object.entries(row);
    return (keywords: string[]) => {
      let bestScore = -1;
      let bestVal = '';
      for (const [k, v] of rowEntries) {
        const normK = normalizeKey(k);
        const val = String(v !== undefined && v !== null ? v : '').trim();
        // Skip empty cells so e.g. blank "Concerned Officer" cannot beat a filled name column
        if (!val) continue;
        for (const kw of keywords) {
          const nkw = normalizeKey(kw);
          if (!nkw) continue;
          if (normK === nkw || normK.includes(nkw)) {
            const score =
              nkw.length +
              (normK === nkw ? 1000 : 0) +
              (normK.startsWith(nkw) ? 50 : 0);
            if (score > bestScore) {
              bestScore = score;
              bestVal = val;
            }
          }
        }
      }
      return bestVal;
    };
  };

  const isBlankImportRow = (row: Record<string, unknown>) =>
    Object.values(row).every((v) => String(v ?? '').trim() === '');

  const resolveTenderId = (tenderName: string | undefined, pool: Tender[]): string => {
    if (tenderName?.trim()) {
      const needle = tenderName.trim().toLowerCase();
      const exact = pool.find(
        (t) =>
          t.tenderNumber.toLowerCase() === needle ||
          t.departmentName.toLowerCase() === needle
      );
      if (exact) return exact.id;
      const fuzzy = pool.find(
        (t) =>
          t.departmentName.toLowerCase().includes(needle) ||
          t.tenderNumber.toLowerCase().includes(needle) ||
          needle.includes(t.tenderNumber.toLowerCase()) ||
          needle.includes(t.departmentName.toLowerCase())
      );
      if (fuzzy) return fuzzy.id;
    }
    return pool[0]?.id || '';
  };

  const resolveSheetEntity = (
    sheetName: string,
    fileName: string,
    jsonData: any[],
    fallback: DetectedImportEntity | null = null
  ): DetectedImportEntity | null => {
    return (
      detectEntityFromName(sheetName) ||
      detectEntityFromHeaders(jsonData) ||
      detectEntityFromName(fileName) ||
      fallback
    );
  };

  const renderImportRowStatus = (isValid: boolean, isDuplicate: boolean, errors: string[]) => {
    if (!isValid) {
      return (
        <span
          className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded inline-block max-w-[160px]"
          title={errors.join(' | ')}
        >
          अमान्य: {errors[0] || 'Invalid'}
        </span>
      );
    }
    if (isDuplicate) {
      return (
        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
          मौजूद (Duplicate)
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
        वैध (Ready)
      </span>
    );
  };

  // -------------------------------------------------------------
  // PARSER: Vehicles Rows (with Driver Name & Mobile auto-extraction)
  // -------------------------------------------------------------
  const parseVehicleRows = (jsonData: any[]): ParsedVehicleRow[] => {
    const existingNumSet = new Set(existingVehicles.map((v) => v.vehicleNumber.trim().toUpperCase()));
    const seenInFile = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const vehNumRaw = findVal(['vehicle number', 'गाड़ी नंबर', 'vehicle no', 'reg no', 'registration', 'gadi number']);
      const makeModelRaw = findVal(['make & model', 'make model', 'मेक', 'मॉडल', 'car model', 'vehicle name', 'make', 'model']);
      const typeRaw = findVal(['vehicle type', 'प्रकार', 'category']);
      const fuelRaw = findVal(['fuel type', 'ईंधन', 'fuel']);
      const ownerTypeRaw = findVal(['ownership type', 'ownership', 'स्वामित्व', 'owner type']);

      // Driver columns extraction
      const driverNameRaw = findVal(['driver name', 'चालक का नाम', 'चालक नाम', 'assigned driver', 'तैनात चालक']);
      const driverPhoneRaw = findVal(['driver mobile', 'चालक का मोबाइल', 'driver phone']);
      const driverDlRaw = findVal(['driver dl', 'चालक डीएल', 'dl number', 'driving license']);
      const driverSalaryRaw = findVal(['driver salary', 'चालक वेतन', 'driver monthly salary', 'मासिक वेतन']);

      const officerNameRaw = findVal(['officer name', 'अधिकारी का नाम', 'assigned officer', 'officer']);
      const vendorNameRaw = findVal(['vendor name', 'vendor / owner name', 'वेंडर', 'owner name']);
      const rentRaw = findVal(['monthly rent', 'rent to vendor', 'किराया', 'monthly vendor rent', 'payout']);
      const odoRaw = findVal(['current odometer', 'odometer', 'current km', 'किमी', 'reading']);
      const tenderRaw = findVal(['tender name', 'tender number', 'टेंडर', 'work order', 'tender']);

      const fitRaw = findVal(['fitness', 'फिटनेस']);
      const insRaw = findVal(['insurance', 'बीमा', 'bima']);
      const pucRaw = findVal(['puc', 'प्रदूषण', 'pollution']);
      const taxRaw = findVal(['road tax', 'टैक्स', 'tax']);
      const permitRaw = findVal(['permit', 'परमिट']);

      const cleanVehNum = vehNumRaw.toUpperCase().replace(/\s+/g, ' ').trim();
      const cleanMakeModel = makeModelRaw || 'Commercial Vehicle';

      if (!cleanVehNum) {
        errors.push('गाड़ी नंबर अनुपलब्ध (Missing Vehicle Number)');
      } else if (seenInFile.has(cleanVehNum)) {
        errors.push('फाइल में डुप्लीकेट गाड़ी नंबर (Duplicate in file)');
      } else {
        seenInFile.add(cleanVehNum);
      }

      const isDuplicate = Boolean(cleanVehNum && existingNumSet.has(cleanVehNum));

      let fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric' = 'Diesel';
      const fNorm = fuelRaw.toLowerCase();
      if (fNorm.includes('cng')) fuelType = 'CNG';
      else if (fNorm.includes('petrol')) fuelType = 'Petrol';
      else if (fNorm.includes('electric') || fNorm.includes('ev')) fuelType = 'Electric';

      let vehicleType: 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV' = 'Sedan';
      const tNorm = typeRaw.toLowerCase();
      if (tNorm.includes('suv')) vehicleType = 'SUV';
      else if (tNorm.includes('muv') || tNorm.includes('ertiga') || tNorm.includes('van')) vehicleType = 'MUV';
      else if (tNorm.includes('hatchback') || tNorm.includes('wagon')) vehicleType = 'Hatchback';
      else if (tNorm.includes('ev') || tNorm.includes('electric')) vehicleType = 'EV';

      let ownershipType: 'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver' = 'Company Owned';
      const oNorm = ownerTypeRaw.toLowerCase();
      if (oNorm.includes('owner') && oNorm.includes('driver')) {
        ownershipType = 'Owner-Driver';
      } else if (oNorm.includes('attach') || oNorm.includes('market') || oNorm.includes('hire') || oNorm.includes('वेंडर')) {
        ownershipType = 'Attached / Market Hire';
      }

      const rent = Number(rentRaw.replace(/[^0-9.]/g, '')) || (ownershipType === 'Company Owned' ? 0 : 32000);
      const odo = Number(odoRaw.replace(/[^0-9.]/g, '')) || 25000;
      const salary = Number(driverSalaryRaw.replace(/[^0-9.]/g, '')) || (ownershipType === 'Owner-Driver' ? 0 : 16500);

      const isValid = errors.length === 0;

      return {
        rowNumber: rowNum,
        vehicleNumber: cleanVehNum,
        makeModel: cleanMakeModel,
        vehicleType,
        fuelType,
        ownershipType,
        driverName: driverNameRaw || undefined,
        driverPhone: driverPhoneRaw || undefined,
        driverDl: driverDlRaw || undefined,
        driverSalary: salary,
        assignedOfficerName: officerNameRaw || undefined,
        vendorName: vendorNameRaw || (ownershipType === 'Company Owned' ? 'Shakti Travels and Tours' : 'Attached Vendor'),
        monthlyVendorRent: rent,
        currentOdometer: odo,
        tenderName: tenderRaw || tenders[0]?.departmentName || 'Govt Tender',
        assignedDriver: driverNameRaw || undefined,
        rtoFitnessExpiry: fitRaw || '2028-06-30',
        insuranceExpiry: insRaw || '2027-04-15',
        pucExpiry: pucRaw || '2026-12-31',
        roadTaxExpiry: taxRaw || '2028-12-31',
        permitExpiry: permitRaw || '2028-06-30',
        isValid,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // PARSER: Drivers Rows
  // -------------------------------------------------------------
  const parseDriverRows = (jsonData: any[]): ParsedDriverRow[] => {
    const existingPhoneSet = new Set(existingDrivers.map((d) => d.phone.trim().replace(/\D/g, '')));
    const existingLicSet = new Set(existingDrivers.map((d) => d.licenseNumber.trim().toUpperCase()));
    const seenPhones = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const nameRaw = findVal(['driver name', 'चालक का नाम', 'चालक नाम', 'नाम']);
      const phoneRaw = findVal(['mobile number', 'mobile', 'phone', 'मोबाइल', 'contact', 'फोन']);
      const altPhoneRaw = findVal(['alternate mobile', 'दूसरा मोबाइल', 'alt phone', 'alternate']);
      const dlRaw = findVal(['driving license', 'license no', 'dl number', 'डीएल', 'license', 'dl']);
      const dlExpRaw = findVal(['license expiry', 'dl expiry', 'वैधता']);
      const catRaw = findVal(['driver category', 'employment type', 'driver type', 'श्रेणी', 'category']);
      const salaryRaw = findVal(['salary', 'वेतन', 'monthly salary']);
      const daRaw = findVal(['da', 'भत्ता', 'bhatta', 'daily da']);
      const panRaw = findVal(['pan', 'पैन']);
      const aadharRaw = findVal(['aadhar', 'aadhaar', 'आधार']);
      const assignedVehRaw = findVal(['vehicle', 'गाड़ी', 'assigned vehicle', 'car']);
      const bankRaw = findVal(['bank', 'बैंक', 'account', 'ifsc']);
      const addrRaw = findVal(['address', 'पता', 'city']);
      const joinDateRaw = findVal(['joining', 'ज्वाइनिंग', 'date']);
      const polExpRaw = findVal(['police', 'पुलिस', 'verification']);

      const cleanName = nameRaw.trim();
      const cleanPhone = phoneRaw.replace(/\D/g, '');
      const cleanDl = dlRaw.toUpperCase().trim();

      if (!cleanName) {
        errors.push('चालक का नाम आवश्यक है (Missing Driver Name)');
      }
      if (!cleanPhone || cleanPhone.length < 10) {
        errors.push('10-अंकीय मोबाइल नंबर आवश्यक है (Invalid Phone)');
      } else if (seenPhones.has(cleanPhone)) {
        errors.push('फाइल में डुप्लीकेट मोबाइल (Duplicate in file)');
      } else {
        seenPhones.add(cleanPhone);
      }

      const isDuplicate = existingPhoneSet.has(cleanPhone) || Boolean(cleanDl && existingLicSet.has(cleanDl));

      let employmentType: 'company_statutory' | 'contractual_khata' | 'owner_driver' = 'contractual_khata';
      const cNorm = catRaw.toLowerCase();
      if (cNorm.includes('owner') || cNorm.includes('मालिक')) {
        employmentType = 'owner_driver';
      } else if (cNorm.includes('statutory') || cNorm.includes('epf') || cNorm.includes('esi')) {
        employmentType = 'company_statutory';
      }

      const salary = employmentType === 'owner_driver' ? 0 : (Number(salaryRaw.replace(/[^0-9.]/g, '')) || 16500);
      const da = Number(daRaw.replace(/[^0-9.]/g, '')) || 350;

      const isValid = errors.length === 0;

      return {
        rowNumber: rowNum,
        name: cleanName,
        phone: cleanPhone || '9839000000',
        alternatePhone: altPhoneRaw || undefined,
        licenseNumber: cleanDl || `DL-UP32${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`,
        licenseExpiry: dlExpRaw || '2030-12-31',
        employmentType,
        monthlySalary: salary,
        dailyDaRate: da,
        panNumber: panRaw || undefined,
        aadharNumber: aadharRaw || undefined,
        assignedVehicleNumber: assignedVehRaw.toUpperCase().replace(/\s+/g, ' ').trim() || undefined,
        bankAccountDetails: bankRaw || 'बैंक खाता विवरण',
        address: addrRaw || 'उत्तर प्रदेश',
        joiningDate: joinDateRaw || new Date().toISOString().slice(0, 10),
        policeVerificationExpiry: polExpRaw || '2028-12-31',
        isValid,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // PARSER: Officers Rows
  // -------------------------------------------------------------
  const parseOfficerRows = (jsonData: any[]): ParsedOfficerRow[] => {
    const existingMobSet = new Set(existingOfficers.map((o) => o.mobile.trim().replace(/\D/g, '')));
    const seenMobs = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const nameRaw = findVal([
        'name of the officer',
        'name of officer',
        'officer name',
        'officer\'s name',
        'full name',
        'employee name',
        'अधिकारी का नाम',
        'अधिकारी नाम',
        'नाम',
        'name',
      ]);
      const desigRaw = findVal(['designation', 'पदनाम', 'post', 'rank', 'पद']);
      const deptRaw = findVal(['department', 'विभाग', 'dept', 'ministry']);
      const mobRaw = findVal(['mobile number', 'mobile', 'phone', 'मोबाइल', 'contact', 'फ़ोन']);
      const altMobRaw = findVal(['alternate mobile', 'दूसरा मोबाइल', 'alt phone', 'alternate']);
      const addrRaw = findVal(['office address', 'कार्यालय', 'address', 'पता', 'room', 'chamber']);
      const tenderRaw = findVal(['tender name', 'tender number', 'टेंडर', 'अनुबंध', 'work order', 'tender']);
      const assignedVehRaw = findVal(['assigned vehicle', 'vehicle number', 'गाड़ी', 'vehicle', 'car']);
      const repTimeRaw = findVal(['reporting time', 'reporting', 'duty time', 'समय']);
      const emailRaw = findVal(['email', 'ईमेल', 'mail']);
      const specRaw = findVal(['special instructions', 'instructions', 'निर्देश', 'route', 'special']);

      const looksLikePersonName = (v: string) => {
        const t = v.trim();
        if (t.length < 3) return false;
        const digits = t.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length === t.replace(/\s/g, '').length) return false;
        if (/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}$/i.test(t)) return false;
        if (t.includes('@')) return false;
        if (/^(cvo|ias|ips|pcs|sdm|adm|ceo|md|gm|jee|ae|ee|se|ce)$/i.test(t)) return false;
        if (desigRaw && t.toLowerCase() === desigRaw.toLowerCase()) return false;
        if (deptRaw && t.toLowerCase() === deptRaw.toLowerCase()) return false;
        return /[a-zA-Z\u0900-\u097F]{2,}/.test(t);
      };

      // Fallback: person-like cell when headers are non-standard (metro CSVs etc.)
      let cleanName = nameRaw.trim();
      // Reject if we accidentally picked designation/department via broad "name" match
      if (
        cleanName &&
        ((desigRaw && cleanName.toLowerCase() === desigRaw.toLowerCase()) ||
          (deptRaw && cleanName.toLowerCase() === deptRaw.toLowerCase()) ||
          /^(cvo|ias|ips|pcs)$/i.test(cleanName))
      ) {
        cleanName = '';
      }
      if (!cleanName) {
        const values = Object.values(row as Record<string, unknown>).map((v) =>
          String(v !== undefined && v !== null ? v : '').trim()
        );
        cleanName =
          values.find((v) => looksLikePersonName(v) && v.includes(' ')) ||
          values.find((v) => looksLikePersonName(v)) ||
          '';
      }
      const cleanMob = mobRaw.replace(/\D/g, '');

      if (!cleanName) {
        errors.push('अधिकारी का नाम आवश्यक है (Missing Officer Name)');
      }
      if (!cleanMob || cleanMob.length < 10) {
        errors.push('10-अंकीय मोबाइल नंबर आवश्यक है (Invalid Mobile)');
      } else if (seenMobs.has(cleanMob)) {
        errors.push('फाइल में डुप्लीकेट मोबाइल (Duplicate in file)');
      } else {
        seenMobs.add(cleanMob);
      }

      const isDuplicate = existingMobSet.has(cleanMob);
      const isValid = errors.length === 0;

      return {
        rowNumber: rowNum,
        name: cleanName,
        designation: desigRaw || 'Executive Officer',
        department: deptRaw || 'Govt Department',
        mobile: cleanMob || '9415000000',
        alternatePhone: altMobRaw || undefined,
        officeAddress: addrRaw || 'कार्यालय कक्ष, लखनऊ',
        tenderName: tenderRaw || tenders[0]?.departmentName || 'Govt Tender',
        assignedVehicleNumber: assignedVehRaw.toUpperCase().replace(/\s+/g, ' ').trim() || undefined,
        reportingTime: repTimeRaw || '09:30 AM',
        email: emailRaw || undefined,
        specialInstructions: specRaw || undefined,
        isValid,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // PARSER: Tenders Rows
  // -------------------------------------------------------------
  const parseTenderRows = (jsonData: any[]): ParsedTenderRow[] => {
    const seenTenderNums = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const tenderNumRaw = findVal(['tender number', 'टेंडर नंबर', 'tender no', 'work order']);
      const deptRaw = findVal(['department name', 'विभाग', 'department', 'client']);
      const authRaw = findVal(['authority office', 'authority', 'कार्यालय', 'office']);
      const startRaw = findVal(['start date', 'शुरुआत', 'from date']);
      const endRaw = findVal(['end date', 'समाप्ति', 'to date']);
      const amtRaw = findVal(['sanctioned amount', 'budget', 'amount', 'sanctioned', 'बजट']);
      const scopeRaw = findVal(['service scope', 'scope', 'स्कोप']);
      const countRaw = findVal(['vehicles required', 'count', 'गाड़ियां', 'qty']);

      const cleanTenderNum = tenderNumRaw.trim();
      const cleanDept = deptRaw.trim();

      if (!cleanTenderNum) errors.push('टेंडर नंबर अनिवार्य है');
      else if (seenTenderNums.has(cleanTenderNum.toLowerCase())) {
        errors.push('फाइल में डुप्लीकेट टेंडर नंबर');
      } else {
        seenTenderNums.add(cleanTenderNum.toLowerCase());
      }
      if (!cleanDept) errors.push('विभाग का नाम अनिवार्य है');

      const isDuplicate = tenders.some((t) => t.tenderNumber.toLowerCase() === cleanTenderNum.toLowerCase());
      const isValid = errors.length === 0;

      let scope: 'vehicle_driver_fuel' | 'vehicle_driver' | 'vehicle_only' = 'vehicle_driver_fuel';
      if (scopeRaw.toLowerCase().includes('only')) scope = 'vehicle_only';
      else if (!scopeRaw.toLowerCase().includes('fuel') && scopeRaw.toLowerCase().includes('driver')) scope = 'vehicle_driver';

      return {
        rowNumber: rowNum,
        tenderNumber: cleanTenderNum,
        departmentName: cleanDept,
        authorityOffice: authRaw || 'Nirman Bhawan Lucknow',
        startDate: startRaw || new Date().toISOString().slice(0, 10),
        endDate: endRaw || '2027-03-31',
        sanctionedAmount: Number(amtRaw.replace(/[^0-9.]/g, '')) || 240000,
        serviceScope: scope,
        vehiclesRequired: Number(countRaw.replace(/[^0-9.]/g, '')) || 2,
        isValid,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // PARSER: Duty / Booking Rows
  // -------------------------------------------------------------
  const parseDutyRows = (jsonData: any[]): ParsedDutyBookingRow[] => {
    const existingSlipSet = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const dateRaw = findVal(['duty date', 'date', 'तारीख']);
      const slipRaw = findVal(['duty slip', 'gr no', 'slip', 'पर्ची', 'booking number']);
      const clientRaw = findVal(['client', 'department', 'विभाग', 'ग्राहक']);
      const vehRaw = findVal(['vehicle number', 'गाड़ी नंबर', 'vehicle no', 'reg no']);
      const driverNameRaw = findVal(['driver name', 'चालक का नाम', 'चालक']);
      const driverPhoneRaw = findVal(['driver phone', 'driver mobile', 'चालक मोबाइल']);
      const pickupRaw = findVal(['pickup location', 'pickup', 'पिकअप']);
      const dropRaw = findVal(['drop location', 'drop', 'ड्रॉप']);
      const packageRaw = findVal(['duty package', 'package', 'पैकेज']);
      const rateRaw = findVal(['base rate', 'rate', 'दर']);
      const outKmRaw = findVal(['garage out', 'out km', 'start km']);
      const inKmRaw = findVal(['garage in', 'in km', 'end km']);

      const cleanSlip = slipRaw.trim();
      const cleanVeh = vehRaw.toUpperCase().replace(/\s+/g, ' ').trim();
      const cleanDate = dateRaw.trim() || new Date().toISOString().slice(0, 10);

      if (!cleanDate) errors.push('ड्यूटी तारीख आवश्यक है (Missing Duty Date)');
      if (!cleanSlip) errors.push('ड्यूटी स्लिप / GR नंबर आवश्यक है');
      if (!clientRaw) errors.push('क्लाइंट / विभाग नाम आवश्यक है');
      if (!cleanVeh) errors.push('गाड़ी नंबर आवश्यक है');
      if (!driverNameRaw) errors.push('चालक का नाम आवश्यक है');

      const slipKey = cleanSlip.toUpperCase();
      const isDuplicate = Boolean(slipKey && existingSlipSet.has(slipKey));
      if (slipKey) existingSlipSet.add(slipKey);

      return {
        rowNumber: rowNum,
        dutyDate: cleanDate,
        dutySlipNumber: cleanSlip,
        clientName: clientRaw || 'Client',
        vehicleNumber: cleanVeh,
        driverName: driverNameRaw || '',
        driverPhone: driverPhoneRaw.replace(/\D/g, '') || undefined,
        pickupLocation: pickupRaw || 'Lucknow',
        dropLocation: dropRaw || 'Lucknow',
        packageType: packageRaw || 'local_8hr_80km',
        baseRate: Number(rateRaw.replace(/[^0-9.]/g, '')) || 2400,
        garageOutKm: Number(outKmRaw.replace(/[^0-9.]/g, '')) || undefined,
        garageInKm: Number(inKmRaw.replace(/[^0-9.]/g, '')) || undefined,
        isValid: errors.length === 0,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // PARSER: Vendor Rows
  // -------------------------------------------------------------
  const parseVendorRows = (jsonData: any[]): ParsedVendorRow[] => {
    const existingPhoneSet = new Set(vendors.map((v) => v.phone.trim().replace(/\D/g, '')));
    const existingNameSet = new Set(vendors.map((v) => v.name.trim().toLowerCase()));
    const seenPhones = new Set<string>();

    return jsonData
      .filter((row) => !isBlankImportRow(row as Record<string, unknown>))
      .map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];
      const findVal = makeFindVal(row as Record<string, unknown>);

      const nameRaw = findVal(['vendor name', 'owner name', 'वेंडर', 'vendor', 'name']);
      const phoneRaw = findVal(['mobile number', 'mobile', 'phone', 'मोबाइल']);
      const contactRaw = findVal(['contact person', 'contact', 'संपर्क']);
      const typeRaw = findVal(['vendor type', 'type', 'प्रकार']);
      const rateRaw = findVal(['monthly agreed rate', 'monthly rate', 'किराया']);
      const tdsApplRaw = findVal(['tds applicable']);
      const tdsRateRaw = findVal(['tds rate', 'rate %']);
      const panRaw = findVal(['pan number', 'pan', 'पैन']);
      const bankRaw = findVal(['bank account', 'bank details', 'ifsc', 'बैंक']);
      const addrRaw = findVal(['address', 'city', 'पता', 'शहर']);

      const cleanName = nameRaw.trim();
      const cleanPhone = phoneRaw.replace(/\D/g, '');

      if (!cleanName) errors.push('वेंडर नाम आवश्यक है (Missing Vendor Name)');
      if (!cleanPhone || cleanPhone.length < 10) {
        errors.push('10-अंकीय मोबाइल नंबर आवश्यक है (Invalid Phone)');
      } else if (seenPhones.has(cleanPhone)) {
        errors.push('फाइल में डुप्लीकेट मोबाइल (Duplicate in file)');
      } else {
        seenPhones.add(cleanPhone);
      }

      let vendorType: 'fleet_vendor' | 'owner_driver' = 'fleet_vendor';
      const tNorm = typeRaw.toLowerCase();
      if (tNorm.includes('owner')) vendorType = 'owner_driver';

      const tdsNorm = tdsApplRaw.toLowerCase();
      const isTds = !(tdsNorm.includes('no') || tdsNorm === 'n' || tdsNorm === '0' || tdsNorm === 'false');

      const isDuplicate =
        existingPhoneSet.has(cleanPhone) || existingNameSet.has(cleanName.toLowerCase());

      return {
        rowNumber: rowNum,
        name: cleanName,
        phone: cleanPhone || '9839000000',
        contactPerson: contactRaw || cleanName,
        vendorType,
        monthlyRate: Number(rateRaw.replace(/[^0-9.]/g, '')) || 32000,
        isTds,
        tdsRate: Number(tdsRateRaw.replace(/[^0-9.]/g, '')) || (vendorType === 'owner_driver' ? 1 : 2),
        panNumber: panRaw || 'PAN-ON-FILE',
        bankDetails: bankRaw || 'A/C on record',
        address: addrRaw || 'Uttar Pradesh',
        isValid: errors.length === 0,
        isDuplicate,
        errors,
      };
    });
  };

  // -------------------------------------------------------------
  // FILE UPLOAD PROCESSOR
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);
    setImportSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        const typedSheetCount = workbook.SheetNames.filter((n) => detectEntityFromName(n)).length;
        const isMultiEntityWorkbook = workbook.SheetNames.length > 1 && typedSheetCount >= 2;
        const useCombinedRouting = activeType === 'combined' || isMultiEntityWorkbook;

        let vehiclesResult: ParsedVehicleRow[] = [];
        let driversResult: ParsedDriverRow[] = [];
        let officersResult: ParsedOfficerRow[] = [];
        let tendersResult: ParsedTenderRow[] = [];
        let dutiesResult: ParsedDutyBookingRow[] = [];
        let vendorsResult: ParsedVendorRow[] = [];

        const applyParsedEntity = (entity: DetectedImportEntity, json: any[]) => {
          if (entity === 'vehicles') vehiclesResult = parseVehicleRows(json);
          else if (entity === 'drivers') driversResult = parseDriverRows(json);
          else if (entity === 'officers') officersResult = parseOfficerRows(json);
          else if (entity === 'tenders') tendersResult = parseTenderRows(json);
          else if (entity === 'duties') dutiesResult = parseDutyRows(json);
          else if (entity === 'vendors') vendorsResult = parseVendorRows(json);
        };

        const hasAnyParsed = () =>
          vehiclesResult.length > 0 ||
          driversResult.length > 0 ||
          officersResult.length > 0 ||
          tendersResult.length > 0 ||
          dutiesResult.length > 0 ||
          vendorsResult.length > 0;

        if (useCombinedRouting && workbook.SheetNames.length > 1) {
          workbook.SheetNames.forEach((sheetName) => {
            const ws = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(ws);
            // Multi-sheet: sheet name + headers only (not whole-file name).
            const entity = detectEntityFromName(sheetName) || detectEntityFromHeaders(json);
            if (entity) applyParsedEntity(entity, json);
          });

          if (!hasAnyParsed()) {
            const firstSheetName = workbook.SheetNames[0];
            const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
            const entity = resolveSheetEntity(firstSheetName, file.name, json, 'vehicles');
            if (entity) applyParsedEntity(entity, json);
          }
        } else {
          // Single CSV/sheet (or non-combined tab): include filename so
          // up-metro-officers-*.csv never becomes empty Vehicles.
          const firstSheetName = workbook.SheetNames[0];
          const json = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
          const tabFallback: DetectedImportEntity | null =
            activeType === 'vehicles' ||
            activeType === 'drivers' ||
            activeType === 'officers' ||
            activeType === 'tenders' ||
            activeType === 'duties' ||
            activeType === 'vendors'
              ? activeType
              : null;

          const fileHint = detectEntityFromName(file.name);
          const headerHint = detectEntityFromHeaders(json);
          const sheetHint = detectEntityFromName(firstSheetName);
          // Filename/sheet beat a wrong header guess (officers CSV with Assigned Vehicle col)
          const entity = sheetHint || fileHint || headerHint || tabFallback;
          if (entity) applyParsedEntity(entity, json);
        }

        setParsedVehicles(vehiclesResult);
        setParsedDrivers(driversResult);
        setParsedOfficers(officersResult);
        setParsedTenders(tendersResult);
        setParsedDuties(dutiesResult);
        setParsedVendors(vendorsResult);

        // Auto select tab with data (prefer non-vehicle when vehicles empty)
        if (officersResult.length > 0 && vehiclesResult.length === 0) setPreviewSubTab('officers');
        else if (driversResult.length > 0 && vehiclesResult.length === 0) setPreviewSubTab('drivers');
        else if (tendersResult.length > 0 && vehiclesResult.length === 0) setPreviewSubTab('tenders');
        else if (vendorsResult.length > 0 && vehiclesResult.length === 0) setPreviewSubTab('vendors');
        else if (dutiesResult.length > 0 && vehiclesResult.length === 0) setPreviewSubTab('duties');
        else if (vehiclesResult.length > 0) setPreviewSubTab('vehicles');
        else if (driversResult.length > 0) setPreviewSubTab('drivers');
        else if (officersResult.length > 0) setPreviewSubTab('officers');
        else if (tendersResult.length > 0) setPreviewSubTab('tenders');
        else if (vendorsResult.length > 0) setPreviewSubTab('vendors');
        else if (dutiesResult.length > 0) setPreviewSubTab('duties');
      } catch (err: any) {
        console.error('File parsing error:', err);
        alert('फाइल पढ़ने में त्रुटि हुई। कृपया सुनिश्चित करें कि यह एक वैध Excel (.xlsx) या CSV फाइल है।');
      } finally {
        setIsProcessing(false);
        // Allow re-selecting the same file after a failed/invalid parse
        e.target.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // -------------------------------------------------------------
  // MANUAL ROW ADDITION
  // -------------------------------------------------------------
  const handleAddManualVehicle = () => {
    if (!manualVehicle.vehicleNumber.trim()) {
      alert('कृपया गाड़ी नंबर (Vehicle Number) दर्ज करें!');
      return;
    }

    const cleanNum = manualVehicle.vehicleNumber.trim().toUpperCase();
    const isDup = existingVehicles.some((v) => v.vehicleNumber.toUpperCase() === cleanNum);

    const newRow: ParsedVehicleRow = {
      rowNumber: parsedVehicles.length + 1,
      vehicleNumber: cleanNum,
      makeModel: manualVehicle.makeModel.trim() || 'Commercial Vehicle',
      vehicleType: manualVehicle.vehicleType,
      fuelType: manualVehicle.fuelType,
      ownershipType: manualVehicle.ownershipType,
      driverName: manualVehicle.driverName.trim() || undefined,
      driverPhone: manualVehicle.driverPhone.trim() || undefined,
      driverSalary: manualVehicle.driverSalary,
      assignedOfficerName: manualVehicle.assignedOfficerName.trim() || undefined,
      vendorName: manualVehicle.vendorName.trim() || (manualVehicle.ownershipType === 'Company Owned' ? 'Shakti Travels' : 'Attached Vendor'),
      monthlyVendorRent: manualVehicle.monthlyRent || (manualVehicle.ownershipType === 'Company Owned' ? 0 : 32000),
      currentOdometer: 25000,
      tenderName: manualVehicle.tenderName.trim() || tenders[0]?.departmentName || 'Govt Tender',
      assignedDriver: manualVehicle.driverName.trim() || undefined,
      rtoFitnessExpiry: '2028-06-30',
      insuranceExpiry: '2027-04-15',
      pucExpiry: '2026-12-31',
      roadTaxExpiry: '2028-12-31',
      permitExpiry: '2028-06-30',
      isValid: true,
      isDuplicate: isDup,
      errors: [],
    };

    setParsedVehicles([newRow, ...parsedVehicles]);
    setManualVehicle({
      ...manualVehicle,
      vehicleNumber: '',
      driverName: '',
      driverPhone: '',
    });
    setPreviewSubTab('vehicles');
  };

  const handleAddManualDriver = () => {
    if (!manualDriver.name.trim() || !manualDriver.phone.trim()) {
      alert('कृपया चालक का नाम और मोबाइल नंबर दर्ज करें!');
      return;
    }

    const cleanPhone = manualDriver.phone.replace(/\D/g, '');
    const isDup = existingDrivers.some((d) => d.phone.replace(/\D/g, '') === cleanPhone);

    const newRow: ParsedDriverRow = {
      rowNumber: parsedDrivers.length + 1,
      name: manualDriver.name.trim(),
      phone: cleanPhone,
      licenseNumber: manualDriver.licenseNumber.trim() || `DL-UP32${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`,
      licenseExpiry: '2030-12-31',
      employmentType: manualDriver.employmentType,
      monthlySalary: manualDriver.monthlySalary,
      dailyDaRate: manualDriver.dailyDaRate,
      assignedVehicleNumber: manualDriver.assignedVehicleNumber.trim().toUpperCase() || undefined,
      bankAccountDetails: 'बैंक खाता विवरण',
      address: manualDriver.address.trim() || 'उत्तर प्रदेश',
      joiningDate: new Date().toISOString().slice(0, 10),
      policeVerificationExpiry: '2028-12-31',
      isValid: true,
      isDuplicate: isDup,
      errors: [],
    };

    setParsedDrivers([newRow, ...parsedDrivers]);
    setManualDriver({
      ...manualDriver,
      name: '',
      phone: '',
      licenseNumber: '',
      assignedVehicleNumber: '',
    });
    setPreviewSubTab('drivers');
  };

  const handleAddManualOfficer = () => {
    if (!manualOfficer.name.trim() || !manualOfficer.mobile.trim()) {
      alert('कृपया अधिकारी का नाम और मोबाइल नंबर दर्ज करें!');
      return;
    }

    const cleanMob = manualOfficer.mobile.replace(/\D/g, '');
    const isDup = existingOfficers.some((o) => o.mobile.replace(/\D/g, '') === cleanMob);

    const newRow: ParsedOfficerRow = {
      rowNumber: parsedOfficers.length + 1,
      name: manualOfficer.name.trim(),
      designation: manualOfficer.designation.trim() || 'Executive Officer',
      department: manualOfficer.department.trim() || 'Govt Department',
      mobile: cleanMob,
      officeAddress: 'कार्यालय कक्ष, लखनऊ',
      tenderName: manualOfficer.tenderName.trim() || tenders[0]?.departmentName || 'Govt Tender',
      assignedVehicleNumber: manualOfficer.assignedVehicleNumber.trim().toUpperCase() || undefined,
      reportingTime: manualOfficer.reportingTime,
      isValid: true,
      isDuplicate: isDup,
      errors: [],
    };

    setParsedOfficers([newRow, ...parsedOfficers]);
    setManualOfficer({
      ...manualOfficer,
      name: '',
      designation: '',
      mobile: '',
      assignedVehicleNumber: '',
    });
    setPreviewSubTab('officers');
  };

  // -------------------------------------------------------------
  // COMMIT / EXECUTE IMPORT (WITH AUTO-DRIVER CREATION & FULL LINKING)
  // -------------------------------------------------------------
  const handleExecuteImport = async () => {
    const validVehicles = parsedVehicles.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate));
    const validDrivers = parsedDrivers.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate));
    const validOfficers = parsedOfficers.filter((o) => o.isValid && (!skipDuplicates || !o.isDuplicate));
    const validTenders = parsedTenders.filter((t) => t.isValid && (!skipDuplicates || !t.isDuplicate));
    const validVendors = parsedVendors.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate));
    const validDuties = parsedDuties.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate));

    const totalToImport =
      validVehicles.length +
      validDrivers.length +
      validOfficers.length +
      validTenders.length +
      validVendors.length +
      validDuties.length;

    if (totalToImport === 0) {
      alert('इम्पोर्ट करने हेतु कोई वैध पंक्ति नहीं मिली।');
      return;
    }

    const newVendorsToAdd: Vendor[] = [];
    const newDriversToCreate: Driver[] = [];
    const newOfficersToCreate: Officer[] = [];

    // 0. Build tenders FIRST so vehicles/officers can link to same-file tenders
    const newTendersToCreate: Tender[] = validTenders.map((row) => ({
      id: `tender-${row.tenderNumber.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`,
      tenderNumber: row.tenderNumber,
      workOrderNumber: `WO-${row.tenderNumber}`,
      departmentName: row.departmentName,
      authorityOffice: row.authorityOffice,
      contractPeriodStart: row.startDate,
      contractPeriodEnd: row.endDate,
      billingCycleDay: 1,
      paymentTermsDays: 30,
      baseMonthlyRate: Math.round(row.sanctionedAmount / Math.max(1, row.vehiclesRequired)) || 35000,
      includedKms: 2500,
      includedHours: 300,
      extraKmRate: 12,
      extraHourRate: 60,
      nightHaltRate: 350,
      tollTerms: 'reimbursable_actuals' as const,
      penaltyClauses: '₹1000 per day absent without replacement',
      officerDesignationsSummary: 'Executive Officers',
      contactPerson: row.contactOfficerName || 'Nodal Officer',
      contactPhone: row.contactOfficerPhone || '9415000000',
      status: 'active' as const,
      contractType: 'monthly_attached' as const,
      packages: [
        {
          id: `pkg-${Date.now()}-1`,
          packageName: 'Monthly Dedicated Commercial Vehicle',
          serviceScope: 'vehicle_driver_fuel' as const,
          vehicleCategory: 'Sedan',
          quantity: row.vehiclesRequired || 1,
          monthlyBaseRate: Math.round(row.sanctionedAmount / Math.max(1, row.vehiclesRequired)) || 35000,
          includedKms: 2500,
          includedHours: 300,
          extraKmRate: 12,
          extraHourRate: 60,
          nightHaltRate: 350,
        },
      ],
    }));
    const tendersPool: Tender[] = [...newTendersToCreate, ...tenders];

    if ((validVehicles.length > 0 || validOfficers.length > 0) && tendersPool.length === 0) {
      alert(
        'गाड़ी/अधिकारी इम्पोर्ट हेतु कम से कम एक टेंडर आवश्यक है। पहले टेंडर इम्पोर्ट करें या सिस्टम में टेंडर बनाएँ।'
      );
      return;
    }

    // Pre-create cross-linking lookup maps
    const driverPhoneToIdMap = new Map<string, string>();
    const driverNameToIdMap = new Map<string, string>();
    const vehicleNumToIdMap = new Map<string, string>();

    existingDrivers.forEach((d) => {
      driverPhoneToIdMap.set(d.phone.replace(/\D/g, ''), d.id);
      driverNameToIdMap.set(d.name.toLowerCase().trim(), d.id);
    });
    existingVehicles.forEach((v) => {
      vehicleNumToIdMap.set(v.vehicleNumber.toUpperCase().trim(), v.id);
    });

    const tempDrivers = [...existingDrivers];
    const tempOfficers = [...existingOfficers];
    const tempVendors = [...vendors];

    // 1. Process explicit Driver rows first if any
    validDrivers.forEach((row) => {
      const uId = generateDriverUniqueId(tempDrivers);
      const newD: Driver = {
        id: uId,
        driverCode: uId,
        name: row.name,
        phone: row.phone,
        alternatePhone: row.alternatePhone,
        address: row.address || 'Uttar Pradesh',
        licenseNumber: row.licenseNumber,
        licenseExpiry: row.licenseExpiry,
        policeVerificationDate: new Date().toISOString().slice(0, 10),
        policeVerificationExpiry: row.policeVerificationExpiry,
        aadharNumber: row.aadharNumber || 'Aadhaar on file',
        panNumber: row.panNumber,
        joiningDate: row.joiningDate,
        monthlySalary: row.monthlySalary,
        dailyDaRate: row.dailyDaRate,
        status: 'active',
        currentVehicleId: undefined, // will link below
        fuelPolicy: 'monthly_fixed_budget',
        monthlyFuelBudgetAmount: 12000,
        bankAccountDetails: row.bankAccountDetails,
        employmentType: row.employmentType,
      };
      tempDrivers.push(newD);
      newDriversToCreate.push(newD);
      driverPhoneToIdMap.set(newD.phone.replace(/\D/g, ''), newD.id);
      driverNameToIdMap.set(newD.name.toLowerCase().trim(), newD.id);
    });

    // 2. Process Vehicles and AUTO-CREATE DRIVERS from Vehicle rows if specified!
    const generatedVehicleIds = validVehicles.map(
      (v, idx) => `veh-${v.vehicleNumber.toUpperCase().replace(/\s+/g, '') || `bulk-${Date.now()}-${idx}`}`
    );

    validVehicles.forEach((v, idx) => {
      vehicleNumToIdMap.set(v.vehicleNumber.toUpperCase().trim(), generatedVehicleIds[idx]);
    });

    const mappedVehicles = validVehicles.map((row, idx) => {
      const vId = generatedVehicleIds[idx];
      const matchedTenderId = resolveTenderId(row.tenderName, tendersPool);
      if (!matchedTenderId) return null;

      // Vendor handling
      let vVendorId: string | undefined = undefined;
      let vVendorName = row.vendorName;
      if (row.ownershipType !== 'Company Owned' && row.vendorName) {
        const vExisting = tempVendors.find((vnd) => vnd.name.toLowerCase() === row.vendorName!.toLowerCase());
        if (vExisting) {
          vVendorId = vExisting.id;
          vVendorName = vExisting.name;
        } else {
          const vType = row.ownershipType === 'Owner-Driver' ? 'owner_driver' : 'fleet_vendor';
          vVendorId = generateVendorUniqueId(tempVendors, vType);
          const newV: Vendor = {
            id: vVendorId,
            vendorCode: vVendorId,
            name: row.vendorName,
            contactPerson: row.vendorName,
            phone: '9839000000',
            panNumber: 'PAN-ON-FILE',
            address: 'Uttar Pradesh',
            bankAccountDetails: 'A/C on record',
            vendorType: vType,
            monthlyAgreedRatePerVehicle: row.monthlyVendorRent || 32000,
            isTdsApplicable: true,
            tdsRate: row.ownershipType === 'Owner-Driver' ? 1 : 2,
            tdsSection: '194C',
            status: 'active',
          };
          tempVendors.push(newV);
          newVendorsToAdd.push(newV);
        }
      }

      // DRIVER AUTO-CREATION & LINKING LOGIC:
      // If user typed driver name in Excel or manual vehicle form, we ensure they are 100% created & linked!
      let vDriverId: string | undefined = undefined;
      const driverNameToUse = (row.driverName || row.assignedDriver || '').trim();
      const driverPhoneToUse = (row.driverPhone || '').replace(/\D/g, '');

      if (driverNameToUse) {
        // First check existing or newly created drivers
        if (driverPhoneToUse && driverPhoneToIdMap.has(driverPhoneToUse)) {
          vDriverId = driverPhoneToIdMap.get(driverPhoneToUse);
        } else if (driverNameToIdMap.has(driverNameToUse.toLowerCase())) {
          vDriverId = driverNameToIdMap.get(driverNameToUse.toLowerCase());
        } else {
          // AUTO-CREATE DRIVER IMMEDIATELY!
          const autoDriverId = generateDriverUniqueId(tempDrivers);
          const autoDriver: Driver = {
            id: autoDriverId,
            driverCode: autoDriverId,
            name: driverNameToUse,
            phone: driverPhoneToUse || `9839${Math.floor(100000 + Math.random() * 900000)}`,
            alternatePhone: '',
            address: 'Uttar Pradesh',
            licenseNumber: row.driverDl || `DL-UP32${new Date().getFullYear()}${Math.floor(10000 + Math.random() * 90000)}`,
            licenseExpiry: '2030-12-31',
            policeVerificationDate: new Date().toISOString().slice(0, 10),
            policeVerificationExpiry: '2028-12-31',
            aadharNumber: 'Aadhaar on record',
            joiningDate: new Date().toISOString().slice(0, 10),
            monthlySalary: row.driverSalary !== undefined ? row.driverSalary : (row.ownershipType === 'Owner-Driver' ? 0 : 16500),
            dailyDaRate: 350,
            status: 'active',
            currentVehicleId: vId,
            fuelPolicy: 'monthly_fixed_budget',
            monthlyFuelBudgetAmount: 12000,
            employmentType: row.ownershipType === 'Owner-Driver' ? 'owner_driver' : 'contractual_khata',
          };

          tempDrivers.push(autoDriver);
          newDriversToCreate.push(autoDriver);
          driverPhoneToIdMap.set(autoDriver.phone.replace(/\D/g, ''), autoDriverId);
          driverNameToIdMap.set(driverNameToUse.toLowerCase(), autoDriverId);
          vDriverId = autoDriverId;
        }
      }

      return {
        id: vId,
        vehicleNumber: row.vehicleNumber,
        makeModel: row.makeModel,
        vehicleType: row.vehicleType,
        fuelType: row.fuelType,
        color: 'White',
        modelYear: 2024,
        ownershipType: row.ownershipType,
        registrationType: 'Commercial',
        vendorId: vVendorId,
        vendorName: vVendorName,
        monthlyVendorRent: row.monthlyVendorRent,
        tenderId: matchedTenderId,
        currentDriverId: vDriverId,
        driverName: driverNameToUse || undefined,
        driverPhone: driverPhoneToUse || undefined,
        assignedOfficerName: row.assignedOfficerName || undefined,
        currentOdometer: row.currentOdometer,
        rtoFitnessExpiry: row.rtoFitnessExpiry,
        insuranceExpiry: row.insuranceExpiry,
        pucExpiry: row.pucExpiry,
        roadTaxExpiry: row.roadTaxExpiry,
        permitExpiry: row.permitExpiry,
        status: 'active' as const,
        fuelPolicy: 'monthly_fixed_budget' as const,
      };
    });
    const newVehiclesList = mappedVehicles.filter((v) => v !== null) as Vehicle[];

    if (validVehicles.length > 0 && newVehiclesList.length === 0) {
      alert('कोई गाड़ी इम्पोर्ट नहीं हो सकी — टेंडर लिंक नहीं मिला। टेंडर नाम/नंबर जाँचें।');
      return;
    }
    if (validVehicles.length > newVehiclesList.length) {
      console.warn(
        `Bulk import: skipped ${validVehicles.length - newVehiclesList.length} vehicle row(s) without tender link.`
      );
    }

    // Update reverse vehicle links on newly created drivers
    newDriversToCreate.forEach((d) => {
      if (!d.currentVehicleId) {
        const foundV = newVehiclesList.find((v) => v.currentDriverId === d.id);
        if (foundV) d.currentVehicleId = foundV.id;
      }
    });

    // 3. Process Officers (after tenders + vehicles so links resolve)
    validOfficers.forEach((row) => {
      const oId = generateOfficerUniqueId(tempOfficers);
      const oTenderId = resolveTenderId(row.tenderName, tendersPool);
      if (!oTenderId) return;

      let oVehId: string | undefined = undefined;
      let oDriverId: string | undefined = undefined;
      if (row.assignedVehicleNumber) {
        const cleanVeh = row.assignedVehicleNumber.toUpperCase().trim();
        if (vehicleNumToIdMap.has(cleanVeh)) {
          oVehId = vehicleNumToIdMap.get(cleanVeh);
          const matchedVeh =
            newVehiclesList.find((v) => v.id === oVehId) || existingVehicles.find((v) => v.id === oVehId);
          if (matchedVeh && matchedVeh.currentDriverId) {
            oDriverId = matchedVeh.currentDriverId;
          }
        }
      }

      const newOff: Officer = {
        id: oId,
        officerCode: oId,
        name: row.name,
        designation: row.designation,
        department: row.department,
        officeAddress: row.officeAddress,
        mobile: row.mobile,
        alternatePhone: row.alternatePhone,
        email: row.email,
        tenderId: oTenderId,
        assignedVehicleId: oVehId,
        currentDriverId: oDriverId,
        reportingTime: row.reportingTime,
        status: 'active',
        specialInstructions: row.specialInstructions,
      };

      tempOfficers.push(newOff);
      newOfficersToCreate.push(newOff);
    });

    if (validOfficers.length > 0 && newOfficersToCreate.length === 0) {
      alert('कोई अधिकारी इम्पोर्ट नहीं हो सका — टेंडर लिंक नहीं मिला। टेंडर नाम/नंबर जाँचें।');
      return;
    }
    if (validOfficers.length > newOfficersToCreate.length) {
      console.warn(
        `Bulk import: skipped ${validOfficers.length - newOfficersToCreate.length} officer row(s) without tender link.`
      );
    }

    // 4. Process explicit Vendor rows
    const newVendorsFromSheet: Vendor[] = validVendors.map((row) => {
      const vId = generateVendorUniqueId(tempVendors, row.vendorType);
      const newV: Vendor = {
        id: vId,
        vendorCode: vId,
        name: row.name,
        contactPerson: row.contactPerson,
        phone: row.phone,
        panNumber: row.panNumber,
        address: row.address,
        bankAccountDetails: row.bankDetails,
        vendorType: row.vendorType,
        monthlyAgreedRatePerVehicle: row.monthlyRate,
        isTdsApplicable: row.isTds,
        tdsRate: row.tdsRate,
        tdsSection: '194C',
        status: 'active',
      };
      tempVendors.push(newV);
      return newV;
    });
    const allNewVendors = [...newVendorsToAdd, ...newVendorsFromSheet];

    // 6. Process Duty / Booking rows → BookingRecord shape
    const resolveDutyPackage = (raw: string): { packageType: DutyTypeCategory; packageName: string } => {
      const p = raw.toLowerCase().trim();
      if (p.includes('12') || p.includes('100')) {
        return { packageType: 'local_12hr_100km', packageName: 'Local 12hr / 100km' };
      }
      if (p.includes('outstation')) {
        return { packageType: 'outstation', packageName: 'Outstation' };
      }
      if (p.includes('airport') || p.includes('station')) {
        return { packageType: 'airport_station_transfer', packageName: 'Airport / Station Transfer' };
      }
      if (p.includes('night')) {
        return { packageType: 'night_halt_inspection', packageName: 'Night Halt / Inspection' };
      }
      if (p.includes('custom')) {
        return { packageType: 'custom_package', packageName: raw || 'Custom Package' };
      }
      return { packageType: 'local_8hr_80km', packageName: 'Local 8hr / 80km' };
    };

    const newDutiesToCreate: BookingRecord[] = validDuties.map((row, idx) => {
      const pkg = resolveDutyPackage(row.packageType);
      const outKm = row.garageOutKm || 0;
      const inKm = row.garageInKm;
      const totalKm = inKm !== undefined && inKm >= outKm ? inKm - outKm : undefined;
      const baseHours = pkg.packageType === 'local_12hr_100km' ? 12 : pkg.packageType === 'outstation' ? 24 : 8;
      const baseKm = pkg.packageType === 'local_12hr_100km' ? 100 : pkg.packageType === 'outstation' ? 250 : 80;
      const nowIso = new Date().toISOString();
      const bookingId = `duty-${row.dutySlipNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-') || Date.now()}-${idx}`;

      return {
        id: bookingId,
        bookingNumber: row.dutySlipNumber,
        date: row.dutyDate,
        status: 'scheduled',
        client: {
          name: row.clientName,
          billingAddress: row.clientName,
        },
        booker: {
          name: 'Bulk Import',
          phone: '0000000000',
        },
        passenger: {
          name: row.clientName,
          phone: row.driverPhone || '0000000000',
        },
        vehicleNumber: row.vehicleNumber,
        vehicleModel: 'Commercial Vehicle',
        vehicleClass: 'Sedan',
        driverName: row.driverName,
        driverPhone: row.driverPhone || '',
        reportingDate: row.dutyDate,
        reportingTime: '09:00',
        pickupLocation: row.pickupLocation,
        dropLocation: row.dropLocation,
        garageOutKm: outKm,
        garageInKm: inKm,
        totalKmRun: totalKm,
        tariff: {
          packageType: pkg.packageType,
          packageName: pkg.packageName,
          baseRate: row.baseRate,
          baseHours,
          baseKm,
          extraKmRate: 12,
          extraHourRate: 60,
          nightHaltRate: 350,
          driverDaRate: 350,
          extraKmRun: 0,
          extraHoursRun: 0,
          extraKmCost: 0,
          extraHourCost: 0,
          tollParkingAmount: 0,
          stateTaxPermitCost: 0,
          nightHaltAmount: 0,
          grossClientAmount: row.baseRate,
          gstRatePercent: 5,
          gstAmount: Math.round(row.baseRate * 0.05),
          netClientBillable: Math.round(row.baseRate * 1.05),
          driverBaseWage: 0,
          driverExtraHoursPay: 0,
          driverNightDa: 0,
          driverAdvanceDeduction: 0,
          netDriverPayable: 0,
        },
        clientPaymentStatus: 'unbilled',
        driverPaymentStatus: 'pending',
        createdAt: nowIso,
      };
    });

    // COMMIT IN DEPENDENCY ORDER (tenders before vehicles/officers; await API writes)
    setIsProcessing(true);
    try {
      if (newTendersToCreate.length > 0) {
        await Promise.resolve(onImportTenders(newTendersToCreate));
      }
      if (newVendorsFromSheet.length > 0) {
        await Promise.resolve(onImportVendors(newVendorsFromSheet));
      }
      if (newDriversToCreate.length > 0) {
        await Promise.resolve(onImportDrivers(newDriversToCreate));
      }
      if (newVehiclesList.length > 0) {
        await Promise.resolve(onImportVehicles(newVehiclesList, newVendorsToAdd));
      }
      if (newOfficersToCreate.length > 0) {
        await Promise.resolve(onImportOfficers(newOfficersToCreate));
      }
      if (newDutiesToCreate.length > 0) {
        await Promise.resolve(onImportDuties(newDutiesToCreate));
      }

      const successSummary = [
        newVehiclesList.length > 0 ? `🚗 ${newVehiclesList.length} गाड़ियाँ` : '',
        newDriversToCreate.length > 0 ? `👨‍✈️ ${newDriversToCreate.length} चालक (ड्राइवर)` : '',
        newOfficersToCreate.length > 0 ? `👔 ${newOfficersToCreate.length} अधिकारी` : '',
        newTendersToCreate.length > 0 ? `🏢 ${newTendersToCreate.length} टेंडर` : '',
        allNewVendors.length > 0 ? `🤝 ${allNewVendors.length} वेंडर` : '',
        newDutiesToCreate.length > 0 ? `📋 ${newDutiesToCreate.length} ड्यूटी` : '',
      ]
        .filter(Boolean)
        .join(', ');

      setImportSuccessMessage(
        `सफलतापूर्वक सुरक्षित! ${successSummary} सिस्टम में दर्ज किए गए। चालक का नाम व सभी विवरण अब सभी जगह दिखाई दे रहे हैं!`
      );

      setParsedVehicles([]);
      setParsedDrivers([]);
      setParsedOfficers([]);
      setParsedTenders([]);
      setParsedDuties([]);
      setParsedVendors([]);
    } catch (err: unknown) {
      console.error('Bulk import commit failed:', err);
      alert(err instanceof Error ? err.message : 'इम्पोर्ट सेव करते समय त्रुटि हुई।');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentVehiclesValid = parsedVehicles.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate)).length;
  const currentDriversValid = parsedDrivers.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate)).length;
  const currentOfficersValid = parsedOfficers.filter((o) => o.isValid && (!skipDuplicates || !o.isDuplicate)).length;
  const currentTendersValid = parsedTenders.filter((t) => t.isValid && (!skipDuplicates || !t.isDuplicate)).length;
  const currentVendorsValid = parsedVendors.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate)).length;
  const currentDutiesValid = parsedDuties.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate)).length;

  const totalValidCount =
    currentVehiclesValid +
    currentDriversValid +
    currentOfficersValid +
    currentTendersValid +
    currentVendorsValid +
    currentDutiesValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shadow-md">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 text-base font-bold sm:text-lg">
                <span>एक्सेल व मैन्युअल डेटा फीडिंग हब (Data Feeding & Excel Import Center)</span>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-black uppercase text-teal-800 border border-teal-200">
                  Fast-Track
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                गाड़ियाँ, चालक (ड्राइवर), अधिकारी, टेंडर व वेंडर अलग-अलग टैब में फीड करें या एक्सेल/CSV से अपलोड करें
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-sand-deep)] hover:text-[var(--color-ink)]"
          >
            <X className="h-5 h-5" />
          </button>
        </div>

        {/* 7 Distinct Entity Tabs */}
        <div className="p-3 border-b border-slate-200 bg-slate-100 sticky top-[73px] z-10 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => {
                setActiveType('vehicles');
                setPreviewSubTab('vehicles');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'vehicles'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Car className="h-4 w-4 text-teal-600" />
              <span>1. गाड़ियाँ (Vehicles & Drivers)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {existingVehicles.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('drivers');
                setPreviewSubTab('drivers');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'drivers'
                  ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-teal-200" />
              <span>2. चालक (Drivers Master)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {existingDrivers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('officers');
                setPreviewSubTab('officers');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'officers'
                  ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)] shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-amber-200" />
              <span>3. सरकारी अधिकारी (Officers)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {existingOfficers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('tenders');
                setPreviewSubTab('tenders');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'tenders'
                  ? 'bg-blue-600 text-[var(--color-ink)] border-blue-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-200" />
              <span>4. टेंडर (Tenders & WO)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {tenders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('duties');
                setPreviewSubTab('duties');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'duties'
                  ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-200" />
              <span>5. ड्यूटी रजिस्टर (Duty / Bookings)</span>
            </button>

            <button
              onClick={() => {
                setActiveType('vendors');
                setPreviewSubTab('vendors');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'vendors'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Handshake className="w-4 h-4 text-emerald-200" />
              <span>6. वेंडर व कार मालिक (Vendors)</span>
              <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {vendors.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveType('combined');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                activeType === 'combined'
                  ? 'bg-[var(--color-copper)] text-white border-teal-800 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-sky-200" />
              <span>7. संयुक्त मास्टर शीट (All-in-One)</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 flex-1">
          {/* Success Banner */}
          {importSuccessMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
              <button
                onClick={() => setImportSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-base font-bold ml-4"
              >
                &times;
              </button>
            </div>
          )}

          {/* Sub-toolbar: Template Download & Mode Switcher */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
            {/* Download Buttons for Current Tab */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Download className="w-4 h-4 text-emerald-600" />
                टेम्पलेट डाउनलोड करें:
              </span>

              {activeType === 'vehicles' && (
                <>
                  <button
                    onClick={downloadVehicleExcelTemplate}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    गाड़ी एक्सेल टेम्पलेट (.xlsx)
                  </button>
                  <button
                    onClick={downloadVehicleCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    गाड़ी CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'drivers' && (
                <>
                  <button
                    onClick={downloadDriverExcelTemplate}
                    className="btn btn-primary !text-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    चालक एक्सेल टेम्पलेट (.xlsx)
                  </button>
                  <button
                    onClick={downloadDriverCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    चालक CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'officers' && (
                <>
                  <button
                    onClick={downloadOfficerExcelTemplate}
                    className="btn btn-success !text-xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    अधिकारी एक्सेल टेम्पलेट (.xlsx)
                  </button>
                  <button
                    onClick={downloadOfficerCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    अधिकारी CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'tenders' && (
                <>
                  <button
                    onClick={downloadTenderExcelTemplate}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-[var(--color-ink)] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    टेंडर एक्सेल टेम्पलेट (.xlsx)
                  </button>
                  <button
                    onClick={downloadTenderCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    टेंडर CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'duties' && (
                <>
                  <button
                    onClick={downloadDutyBookingExcelTemplate}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    ड्यूटी एक्सेल (.xlsx)
                  </button>
                  <button
                    onClick={downloadDutyBookingCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ड्यूटी CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'vendors' && (
                <>
                  <button
                    onClick={downloadVendorExcelTemplate}
                    className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    वेंडर एक्सेल (.xlsx)
                  </button>
                  <button
                    onClick={downloadVendorCsvTemplate}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    वेंडर CSV (.csv)
                  </button>
                </>
              )}

              {activeType === 'combined' && (
                <button
                  onClick={downloadCombinedFleetExcelTemplate}
                  className="btn btn-primary !text-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  संयुक्त मल्टी-शीट एक्सेल टेम्पलेट (.xlsx)
                </button>
              )}
            </div>

            {/* Input Mode Selector: Upload File vs Direct Manual Entry */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300">
              <button
                type="button"
                onClick={() => setEntryMode('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'upload'
                    ? 'bg-[var(--color-ink)] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📂 एक्सेल / CSV अपलोड
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'manual'
                    ? 'bg-[var(--color-ink)] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ➕ डायरेक्ट मैन्युअल फीडिंग (Add Entry)
              </button>
            </div>
          </div>

          {/* MODE 1: FILE UPLOAD ZONE */}
          {entryMode === 'upload' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-slate-900 text-sm">
                  {selectedFileName ? (
                    <span className="text-emerald-800">चयनित फाइल: {selectedFileName}</span>
                  ) : (
                    <span>अपनी एक्सेल (.xlsx) या CSV फाइल यहाँ ड्रैग करें या क्लिक करके चुनें</span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  सॉफ्टवेयर ऑटोमैटिक शीट में लिखे ड्राइवर के नाम, गाड़ी नंबर और सभी विवरण को तुरंत पहचान कर लिंक कर देगा
                </p>
              </div>
            </div>
          )}

          {/* MODE 2: DIRECT MANUAL FEEDING FORM */}
          {entryMode === 'manual' && (
            <div className="bg-slate-50 rounded-2xl border border-slate-300 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  सीधे सॉफ्टवेयर में नई पंक्ति जोड़ें (Direct Feeding Form):
                </span>
                <span className="text-[11px] text-[var(--color-muted)]">
                  फार्म भरकर "+ पंक्ति जोड़ें" दबाएं, नीचे सूची में जुड़ जाएगा
                </span>
              </div>

              {/* Form for Vehicles Tab */}
              {activeType === 'vehicles' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">गाड़ी नंबर (Vehicle No) *</label>
                    <input
                      type="text"
                      placeholder="e.g. UP32 AB 1234"
                      value={manualVehicle.vehicleNumber}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मेक व मॉडल (Make & Model) *</label>
                    <input
                      type="text"
                      placeholder="e.g. Swift Dzire ZXi"
                      value={manualVehicle.makeModel}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, makeModel: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  {/* PROMINENT DRIVER NAME FIELD */}
                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-300">
                    <label className="block text-emerald-900 font-black mb-1 flex items-center gap-1">
                      👨‍✈️ चालक का नाम (Driver Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. राजेश कुमार यादव"
                      value={manualVehicle.driverName}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, driverName: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-lg font-bold text-slate-900"
                    />
                  </div>

                  <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-300">
                    <label className="block text-emerald-900 font-black mb-1 flex items-center gap-1">
                      📞 चालक मोबाइल (Driver Phone)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9415012345"
                      value={manualVehicle.driverPhone}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, driverPhone: e.target.value })}
                      className="w-full px-2.5 py-1 bg-white border border-emerald-400 rounded-lg font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">स्वामित्व (Ownership Type)</label>
                    <select
                      value={manualVehicle.ownershipType}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, ownershipType: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-medium"
                    >
                      <option value="Company Owned">🏢 Company Owned (कंपनी की अपनी)</option>
                      <option value="Owner-Driver">🚗👨‍✈️ Owner-Driver (मालिक ही ड्राइवर)</option>
                      <option value="Attached / Market Hire">🤝 Attached / Market Hire (वेंडर अटैच)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">गाड़ी प्रकार (Type)</label>
                    <select
                      value={manualVehicle.vehicleType}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, vehicleType: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="Sedan">Sedan (सेडान)</option>
                      <option value="SUV">SUV (एसयूवी)</option>
                      <option value="MUV">MUV (मल्टी-यूटिलिटी)</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="EV">EV (इलेक्ट्रिक)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ईंधन (Fuel)</label>
                    <select
                      value={manualVehicle.fuelType}
                      onChange={(e) => setManualVehicle({ ...manualVehicle, fuelType: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    >
                      <option value="Diesel">Diesel (डीजल)</option>
                      <option value="CNG">CNG (सीएनजी)</option>
                      <option value="Petrol">Petrol (पेट्रोल)</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddManualVehicle}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ गाड़ी पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form for Drivers Tab */}
              {activeType === 'drivers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">चालक का नाम (Driver Name) *</label>
                    <input
                      type="text"
                      placeholder="e.g. संतोष कुमार मौर्य"
                      value={manualDriver.name}
                      onChange={(e) => setManualDriver({ ...manualDriver, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9415088440"
                      value={manualDriver.phone}
                      onChange={(e) => setManualDriver({ ...manualDriver, phone: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">डीएल नंबर (DL No)</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-UP3220190044120"
                      value={manualDriver.licenseNumber}
                      onChange={(e) => setManualDriver({ ...manualDriver, licenseNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">तैनात गाड़ी नंबर (Vehicle No)</label>
                    <input
                      type="text"
                      placeholder="e.g. UP32 LN 8844"
                      value={manualDriver.assignedVehicleNumber}
                      onChange={(e) => setManualDriver({ ...manualDriver, assignedVehicleNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <button
                      type="button"
                      onClick={handleAddManualDriver}
                      className="btn btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ चालक पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Form for Officers Tab */}
              {activeType === 'officers' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">अधिकारी का नाम (Officer Name) *</label>
                    <input
                      type="text"
                      placeholder="e.g. Er. रमेश चंद्र शर्मा"
                      value={manualOfficer.name}
                      onChange={(e) => setManualOfficer({ ...manualOfficer, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">पदनाम (Designation)</label>
                    <input
                      type="text"
                      placeholder="e.g. Chief Engineer (Roads)"
                      value={manualOfficer.designation}
                      onChange={(e) => setManualOfficer({ ...manualOfficer, designation: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">मोबाइल नंबर (10 अंक) *</label>
                    <input
                      type="tel"
                      placeholder="e.g. 9415011223"
                      value={manualOfficer.mobile}
                      onChange={(e) => setManualOfficer({ ...manualOfficer, mobile: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">तैनात गाड़ी नंबर</label>
                    <input
                      type="text"
                      placeholder="e.g. UP32 AB 1234"
                      value={manualOfficer.assignedVehicleNumber}
                      onChange={(e) => setManualOfficer({ ...manualOfficer, assignedVehicleNumber: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono uppercase"
                    />
                  </div>

                  <div className="flex items-end sm:col-span-2 lg:col-span-4">
                    <button
                      type="button"
                      onClick={handleAddManualOfficer}
                      className="btn btn-success"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ अधिकारी पंक्ति जोड़ें</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PREVIEW & VALIDATION TABLE (HIGHLIGHTING DRIVER NAME!) */}
          {(parsedVehicles.length > 0 ||
            parsedDrivers.length > 0 ||
            parsedOfficers.length > 0 ||
            parsedTenders.length > 0 ||
            parsedVendors.length > 0 ||
            parsedDuties.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    📋 इम्पोर्ट पूर्व प्रीव्यू (Preview & Validation):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {parsedVehicles.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('vehicles')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'vehicles'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        🚗 गाड़ियाँ ({parsedVehicles.length})
                      </button>
                    )}
                    {parsedDrivers.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('drivers')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'drivers'
                            ? 'bg-[var(--color-ink)] text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        👨‍✈️ चालक ({parsedDrivers.length})
                      </button>
                    )}
                    {parsedOfficers.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('officers')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'officers'
                            ? 'bg-[var(--color-ink)] text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        👔 अधिकारी ({parsedOfficers.length})
                      </button>
                    )}
                    {parsedTenders.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('tenders')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'tenders'
                            ? 'bg-blue-600 text-[var(--color-ink)]'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        🏢 टेंडर ({parsedTenders.length})
                      </button>
                    )}
                    {parsedVendors.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('vendors')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'vendors'
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        🤝 वेंडर ({parsedVendors.length})
                      </button>
                    )}
                    {parsedDuties.length > 0 && (
                      <button
                        onClick={() => setPreviewSubTab('duties')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          previewSubTab === 'duties'
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        📋 ड्यूटी ({parsedDuties.length})
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDuplicates}
                      onChange={(e) => setSkipDuplicates(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>मौजूदा डुप्लीकेट छोड़ें (Skip Existing Duplicates)</span>
                  </label>
                  <button
                    onClick={resetState}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    सूची खाली करें
                  </button>
                </div>
              </div>

              {/* VEHICLES PREVIEW TABLE */}
              {previewSubTab === 'vehicles' && parsedVehicles.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">गाड़ी नंबर</th>
                        <th className="p-2.5">मेक व मॉडल</th>
                        <th className="p-2.5 bg-emerald-900 text-emerald-100">👨‍✈️ चालक का नाम (Driver Name)</th>
                        <th className="p-2.5">स्वामित्व (Ownership)</th>
                        <th className="p-2.5">संबंधित अधिकारी</th>
                        <th className="p-2.5">टेंडर</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedVehicles.map((v, i) => {
                        const isDup = v.isDuplicate;
                        return (
                          <tr
                            key={i}
                            className={`hover:bg-slate-50 transition-colors ${
                              isDup ? 'bg-amber-50/60' : !v.isValid ? 'bg-rose-50/60' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center text-[var(--color-muted)] font-mono">{i + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{v.vehicleNumber}</td>
                            <td className="p-2.5">
                              <div>{v.makeModel}</div>
                              <div className="text-[10px] text-[var(--color-muted)]">{v.vehicleType} &bull; {v.fuelType}</div>
                            </td>
                            {/* PROMINENT DRIVER NAME DISPLAY */}
                            <td className="p-2.5 bg-emerald-50/60 border-x border-emerald-200">
                              {v.driverName || v.assignedDriver ? (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
                                    {v.driverName || v.assignedDriver}
                                  </span>
                                  {v.driverPhone && (
                                    <div className="text-[10px] text-slate-600 font-mono">
                                      📞 {v.driverPhone}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-rose-600 font-medium">
                                  ⚠️ कोई चालक नहीं (खाली)
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  v.ownershipType === 'Company Owned'
                                    ? 'bg-slate-100 text-slate-700'
                                    : v.ownershipType === 'Owner-Driver'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {v.ownershipType}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-700 font-medium">
                              {v.assignedOfficerName || '-'}
                            </td>
                            <td className="p-2.5 text-slate-600 truncate max-w-[140px]">
                              {v.tenderName || '-'}
                            </td>
                            <td className="p-2.5">{renderImportRowStatus(v.isValid, isDup, v.errors)}</td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => setParsedVehicles(parsedVehicles.filter((_, idx) => idx !== i))}
                                className="text-[var(--color-muted)] hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DRIVERS PREVIEW TABLE */}
              {previewSubTab === 'drivers' && parsedDrivers.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">चालक का नाम</th>
                        <th className="p-2.5">मोबाइल</th>
                        <th className="p-2.5">डीएल नंबर</th>
                        <th className="p-2.5">श्रेणी (Category)</th>
                        <th className="p-2.5 text-right">वेतन</th>
                        <th className="p-2.5">तैनात गाड़ी</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedDrivers.map((d, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50 ${
                            d.isDuplicate ? 'bg-amber-50/60' : !d.isValid ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-[var(--color-muted)]">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {d.name || <span className="text-rose-600 font-medium">नाम खाली</span>}
                          </td>
                          <td className="p-2.5 font-mono">{d.phone}</td>
                          <td className="p-2.5 font-mono">{d.licenseNumber}</td>
                          <td className="p-2.5 font-medium">{d.employmentType}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{d.monthlySalary.toLocaleString()}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-800">{d.assignedVehicleNumber || '-'}</td>
                          <td className="p-2.5">{renderImportRowStatus(d.isValid, d.isDuplicate, d.errors)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedDrivers(parsedDrivers.filter((_, idx) => idx !== i))}
                              className="text-[var(--color-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* OFFICERS PREVIEW TABLE */}
              {previewSubTab === 'officers' && parsedOfficers.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">अधिकारी का नाम</th>
                        <th className="p-2.5">पदनाम</th>
                        <th className="p-2.5">विभाग</th>
                        <th className="p-2.5">मोबाइल</th>
                        <th className="p-2.5">तैनात गाड़ी</th>
                        <th className="p-2.5">टेंडर</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedOfficers.map((o, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50 ${
                            o.isDuplicate ? 'bg-amber-50/60' : !o.isValid ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-[var(--color-muted)]">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {o.name?.trim() ? (
                              o.name
                            ) : (
                              <span className="text-rose-600 font-medium">नाम नहीं मिला</span>
                            )}
                          </td>
                          <td className="p-2.5">{o.designation}</td>
                          <td className="p-2.5">{o.department}</td>
                          <td className="p-2.5 font-mono">{o.mobile}</td>
                          <td className="p-2.5 font-mono font-bold text-teal-800">{o.assignedVehicleNumber || '-'}</td>
                          <td className="p-2.5 truncate max-w-[140px]">{o.tenderName}</td>
                          <td className="p-2.5">{renderImportRowStatus(o.isValid, o.isDuplicate, o.errors)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedOfficers(parsedOfficers.filter((_, idx) => idx !== i))}
                              className="text-[var(--color-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TENDERS PREVIEW TABLE */}
              {previewSubTab === 'tenders' && parsedTenders.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">टेंडर नंबर</th>
                        <th className="p-2.5">विभाग</th>
                        <th className="p-2.5">प्राधिकरण</th>
                        <th className="p-2.5 text-right">मासिक बजट</th>
                        <th className="p-2.5 text-center">गाड़ियाँ</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedTenders.map((t, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50 ${
                            t.isDuplicate ? 'bg-amber-50/60' : !t.isValid ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-[var(--color-muted)]">{i + 1}</td>
                          <td className="p-2.5 font-bold font-mono text-slate-900">{t.tenderNumber}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{t.departmentName}</td>
                          <td className="p-2.5 text-slate-600">{t.authorityOffice}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{t.sanctionedAmount.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-bold text-teal-800">{t.vehiclesRequired}</td>
                          <td className="p-2.5">{renderImportRowStatus(t.isValid, t.isDuplicate, t.errors)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedTenders(parsedTenders.filter((_, idx) => idx !== i))}
                              className="text-[var(--color-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VENDORS PREVIEW TABLE */}
              {previewSubTab === 'vendors' && parsedVendors.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">वेंडर नाम</th>
                        <th className="p-2.5">मोबाइल</th>
                        <th className="p-2.5">संपर्क व्यक्ति</th>
                        <th className="p-2.5">प्रकार</th>
                        <th className="p-2.5 text-right">मासिक दर</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedVendors.map((v, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50 ${
                            v.isDuplicate ? 'bg-amber-50/60' : !v.isValid ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-[var(--color-muted)]">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">🤝 {v.name}</td>
                          <td className="p-2.5 font-mono">{v.phone}</td>
                          <td className="p-2.5">{v.contactPerson}</td>
                          <td className="p-2.5 font-medium">{v.vendorType}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{v.monthlyRate.toLocaleString()}</td>
                          <td className="p-2.5">{renderImportRowStatus(v.isValid, v.isDuplicate, v.errors)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedVendors(parsedVendors.filter((_, idx) => idx !== i))}
                              className="text-[var(--color-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DUTIES PREVIEW TABLE */}
              {previewSubTab === 'duties' && parsedDuties.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--color-sand-deep)] text-[var(--color-ink)] sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">तारीख</th>
                        <th className="p-2.5">स्लिप / GR</th>
                        <th className="p-2.5">क्लाइंट</th>
                        <th className="p-2.5">गाड़ी</th>
                        <th className="p-2.5">चालक</th>
                        <th className="p-2.5 text-right">दर</th>
                        <th className="p-2.5">स्थिति</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedDuties.map((d, i) => (
                        <tr
                          key={i}
                          className={`hover:bg-slate-50 ${
                            d.isDuplicate ? 'bg-amber-50/60' : !d.isValid ? 'bg-rose-50/60' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center text-[var(--color-muted)]">{i + 1}</td>
                          <td className="p-2.5 font-mono">{d.dutyDate}</td>
                          <td className="p-2.5 font-bold font-mono text-slate-900">{d.dutySlipNumber}</td>
                          <td className="p-2.5 truncate max-w-[140px]">{d.clientName}</td>
                          <td className="p-2.5 font-mono font-bold text-teal-800">{d.vehicleNumber}</td>
                          <td className="p-2.5 font-medium">{d.driverName || '-'}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{d.baseRate.toLocaleString()}</td>
                          <td className="p-2.5">{renderImportRowStatus(d.isValid, d.isDuplicate, d.errors)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedDuties(parsedDuties.filter((_, idx) => idx !== i))}
                              className="text-[var(--color-muted)] hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[var(--color-muted)]">
              {totalValidCount > 0 ? (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  इम्पोर्ट हेतु कुल तैयार: <strong className="text-emerald-700">{totalValidCount} रिकॉर्ड्स</strong>
                  {parsedVehicles.length > 0 && ` (${currentVehiclesValid} गाड़ियाँ)`}
                  {parsedDrivers.length > 0 && ` (${currentDriversValid} चालक)`}
                  {parsedOfficers.length > 0 && ` (${currentOfficersValid} अधिकारी)`}
                  {parsedTenders.length > 0 && ` (${currentTendersValid} टेंडर)`}
                  {parsedVendors.length > 0 && ` (${currentVendorsValid} वेंडर)`}
                  {parsedDuties.length > 0 && ` (${currentDutiesValid} ड्यूटी)`}
                </span>
              ) : (
                <span>कृपया पहले एक्सेल/CSV फाइल अपलोड करें या मैन्युअल पंक्ति जोड़ें</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                रद्द करें (Close)
              </button>

              <button
                type="button"
                disabled={totalValidCount === 0 || isProcessing}
                onClick={handleExecuteImport}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                  totalValidCount > 0
                    ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-95'
                    : 'bg-slate-200 text-[var(--color-muted)] cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>
                  {totalValidCount > 0
                    ? `कुल ${totalValidCount} रिकॉर्ड्स सुरक्षित करें (Save & Commit to Fleet)`
                    : 'सिस्टम में सुरक्षित करें'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
