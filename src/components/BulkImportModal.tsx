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
import { Vehicle, Driver, Tender, Vendor, Officer } from '../types';
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
  onImportVehicles: (newVehicles: Vehicle[], newVendors?: Vendor[]) => void;
  onImportDrivers: (newDrivers: Driver[]) => void;
  onImportOfficers?: (newOfficers: Officer[]) => void;
  onImportTenders?: (newTenders: Tender[]) => void;
  onImportDuties?: (newDuties: any[]) => void;
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

  // -------------------------------------------------------------
  // PARSER: Vehicles Rows (with Driver Name & Mobile auto-extraction)
  // -------------------------------------------------------------
  const parseVehicleRows = (jsonData: any[]): ParsedVehicleRow[] => {
    const existingNumSet = new Set(existingVehicles.map((v) => v.vehicleNumber.trim().toUpperCase()));

    return jsonData.map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];

      const rowEntries = Object.entries(row);
      const findVal = (keywords: string[]) => {
        for (const [k, v] of rowEntries) {
          const normK = normalizeKey(k);
          if (keywords.some((kw) => normK.includes(kw))) {
            return String(v !== undefined && v !== null ? v : '').trim();
          }
        }
        return '';
      };

      const vehNumRaw = findVal(['vehicle number', 'गाड़ी नंबर', 'vehicle no', 'reg no', 'registration', 'gadi number']);
      const makeModelRaw = findVal(['make', 'model', 'मेक', 'मॉडल', 'car model', 'vehicle name']);
      const typeRaw = findVal(['vehicle type', 'प्रकार', 'type', 'category']);
      const fuelRaw = findVal(['fuel', 'ईंधन', 'fuel type']);
      const ownerTypeRaw = findVal(['ownership', 'स्वामित्व', 'owner type', 'ownership type']);

      // Driver columns extraction
      const driverNameRaw = findVal(['driver name', 'चालक का नाम', 'चालक नाम', 'assigned driver', 'तैनात चालक', 'driver', 'चालक']);
      const driverPhoneRaw = findVal(['driver mobile', 'चालक का मोबाइल', 'driver phone', 'मोबाइल', 'phone', 'mobile']);
      const driverDlRaw = findVal(['driver dl', 'चालक डीएल', 'license', 'डीएल', 'dl number']);
      const driverSalaryRaw = findVal(['driver salary', 'चालक वेतन', 'मासिक वेतन', 'salary']);

      const officerNameRaw = findVal(['officer name', 'अधिकारी का नाम', 'officer', 'अधिकारी', 'assigned officer']);
      const vendorNameRaw = findVal(['vendor', 'वेंडर', 'owner name', 'मालिक']);
      const rentRaw = findVal(['rent', 'किराया', 'monthly rent', 'payout', 'rate']);
      const odoRaw = findVal(['odometer', 'किमी', 'km', 'current km', 'reading']);
      const tenderRaw = findVal(['tender', 'टेंडर', 'dept', 'department', 'work order']);

      const fitRaw = findVal(['fitness', 'फिटनेस']);
      const insRaw = findVal(['insurance', 'बीमा', 'bima']);
      const pucRaw = findVal(['puc', 'प्रदूषण', 'pollution']);
      const taxRaw = findVal(['tax', 'टैक्स', 'road tax']);
      const permitRaw = findVal(['permit', 'परमिट']);

      const cleanVehNum = vehNumRaw.toUpperCase().replace(/\s+/g, ' ').trim();
      const cleanMakeModel = makeModelRaw || 'Commercial Vehicle';

      if (!cleanVehNum) {
        errors.push('गाड़ी नंबर अनुपलब्ध (Missing Vehicle Number)');
      }

      const isDuplicate = existingNumSet.has(cleanVehNum);

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

    return jsonData.map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];

      const rowEntries = Object.entries(row);
      const findVal = (keywords: string[]) => {
        for (const [k, v] of rowEntries) {
          const normK = normalizeKey(k);
          if (keywords.some((kw) => normK.includes(kw))) {
            return String(v !== undefined && v !== null ? v : '').trim();
          }
        }
        return '';
      };

      const nameRaw = findVal(['driver name', 'name', 'चालक का नाम', 'नाम', 'driver']);
      const phoneRaw = findVal(['mobile', 'phone', 'मोबाइल', 'contact', 'फोन']);
      const altPhoneRaw = findVal(['alternate', 'दूसरा मोबाइल', 'alt phone']);
      const dlRaw = findVal(['license', 'dl', 'डीएल', 'driving license']);
      const dlExpRaw = findVal(['license expiry', 'dl expiry', 'वैधता']);
      const catRaw = findVal(['category', 'श्रेणी', 'type', 'driver type', 'employment']);
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

    return jsonData.map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];

      const rowEntries = Object.entries(row);
      const findVal = (keywords: string[]) => {
        for (const [k, v] of rowEntries) {
          const normK = normalizeKey(k);
          if (keywords.some((kw) => normK.includes(kw))) {
            return String(v !== undefined && v !== null ? v : '').trim();
          }
        }
        return '';
      };

      const nameRaw = findVal(['officer name', 'name', 'अधिकारी', 'अधिकारी का नाम', 'नाम']);
      const desigRaw = findVal(['designation', 'पद', 'पदनाम', 'post', 'rank']);
      const deptRaw = findVal(['department', 'विभाग', 'dept', 'ministry']);
      const mobRaw = findVal(['mobile', 'phone', 'मोबाइल', 'contact', 'फ़ोन']);
      const altMobRaw = findVal(['alternate', 'दूसरा मोबाइल', 'alt phone']);
      const addrRaw = findVal(['office address', 'पता', 'कार्यालय', 'address', 'room', 'chamber']);
      const tenderRaw = findVal(['tender', 'टेंडर', 'अनुबंध', 'work order']);
      const assignedVehRaw = findVal(['vehicle', 'गाड़ी', 'assigned vehicle', 'car']);
      const repTimeRaw = findVal(['reporting time', 'समय', 'reporting', 'duty time']);
      const emailRaw = findVal(['email', 'ईमेल', 'mail']);
      const specRaw = findVal(['special', 'instructions', 'निर्देश', 'route']);

      const cleanName = nameRaw.trim();
      const cleanMob = mobRaw.replace(/\D/g, '');

      if (!cleanName) {
        errors.push('अधिकारी का नाम आवश्यक है (Missing Officer Name)');
      }
      if (!cleanMob || cleanMob.length < 10) {
        errors.push('10-अंकीय मोबाइल नंबर आवश्यक है (Invalid Mobile)');
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
    return jsonData.map((row, index) => {
      const rowNum = index + 2;
      const errors: string[] = [];

      const rowEntries = Object.entries(row);
      const findVal = (keywords: string[]) => {
        for (const [k, v] of rowEntries) {
          const normK = normalizeKey(k);
          if (keywords.some((kw) => normK.includes(kw))) {
            return String(v !== undefined && v !== null ? v : '').trim();
          }
        }
        return '';
      };

      const tenderNumRaw = findVal(['tender number', 'टेंडर नंबर', 'tender no', 'work order']);
      const deptRaw = findVal(['department name', 'विभाग', 'department', 'client']);
      const authRaw = findVal(['authority office', 'कार्यालय', 'authority', 'office']);
      const startRaw = findVal(['start date', 'शुरुआत', 'from date']);
      const endRaw = findVal(['end date', 'समाप्ति', 'to date']);
      const amtRaw = findVal(['budget', 'amount', 'sanctioned', 'बजट']);
      const scopeRaw = findVal(['scope', 'service scope', 'स्कोप']);
      const countRaw = findVal(['vehicles required', 'count', 'गाड़ियां', 'qty']);

      const cleanTenderNum = tenderNumRaw.trim();
      const cleanDept = deptRaw.trim();

      if (!cleanTenderNum) errors.push('टेंडर नंबर अनिवार्य है');
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
  // FILE UPLOAD PROCESSOR
  // -------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        const isCombined =
          activeType === 'combined' ||
          workbook.SheetNames.some((n) => n.toLowerCase().includes('officer')) ||
          workbook.SheetNames.some((n) => n.toLowerCase().includes('vehicle')) ||
          workbook.SheetNames.some((n) => n.toLowerCase().includes('driver'));

        let vehiclesResult: ParsedVehicleRow[] = [];
        let driversResult: ParsedDriverRow[] = [];
        let officersResult: ParsedOfficerRow[] = [];
        let tendersResult: ParsedTenderRow[] = [];

        if (isCombined) {
          workbook.SheetNames.forEach((sheetName) => {
            const sLower = sheetName.toLowerCase();
            const ws = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(ws);

            if (sLower.includes('vehicle') || sLower.includes('गाड़ी')) {
              vehiclesResult = parseVehicleRows(json);
            } else if (sLower.includes('driver') || sLower.includes('चालक')) {
              driversResult = parseDriverRows(json);
            } else if (sLower.includes('officer') || sLower.includes('अधिकारी')) {
              officersResult = parseOfficerRows(json);
            } else if (sLower.includes('tender') || sLower.includes('टेंडर')) {
              tendersResult = parseTenderRows(json);
            }
          });

          // Fallback if sheets didn't match standard names
          if (vehiclesResult.length === 0 && driversResult.length === 0 && officersResult.length === 0) {
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(firstSheet);
            vehiclesResult = parseVehicleRows(json);
          }
        } else {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet);

          if (activeType === 'vehicles') {
            vehiclesResult = parseVehicleRows(json);
          } else if (activeType === 'drivers') {
            driversResult = parseDriverRows(json);
          } else if (activeType === 'officers') {
            officersResult = parseOfficerRows(json);
          } else if (activeType === 'tenders') {
            tendersResult = parseTenderRows(json);
          }
        }

        setParsedVehicles(vehiclesResult);
        setParsedDrivers(driversResult);
        setParsedOfficers(officersResult);
        setParsedTenders(tendersResult);

        // Auto select tab with data
        if (vehiclesResult.length > 0) setPreviewSubTab('vehicles');
        else if (driversResult.length > 0) setPreviewSubTab('drivers');
        else if (officersResult.length > 0) setPreviewSubTab('officers');
        else if (tendersResult.length > 0) setPreviewSubTab('tenders');
      } catch (err: any) {
        console.error('File parsing error:', err);
        alert('फाइल पढ़ने में त्रुटि हुई। कृपया सुनिश्चित करें कि यह एक वैध Excel (.xlsx) या CSV फाइल है।');
      } finally {
        setIsProcessing(false);
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
  const handleExecuteImport = () => {
    const validVehicles = parsedVehicles.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate));
    const validDrivers = parsedDrivers.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate));
    const validOfficers = parsedOfficers.filter((o) => o.isValid && (!skipDuplicates || !o.isDuplicate));
    const validTenders = parsedTenders.filter((t) => t.isValid && (!skipDuplicates || !t.isDuplicate));

    const totalToImport = validVehicles.length + validDrivers.length + validOfficers.length + validTenders.length;

    if (totalToImport === 0) {
      alert('इम्पोर्ट करने हेतु कोई वैध पंक्ति नहीं मिली।');
      return;
    }

    const defaultTender = tenders[0]?.id || '';
    const newVendorsToAdd: Vendor[] = [];
    const newDriversToCreate: Driver[] = [];
    const newOfficersToCreate: Officer[] = [];

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

    const newVehiclesList: Vehicle[] = validVehicles.map((row, idx) => {
      const vId = generatedVehicleIds[idx];

      let matchedTenderId = defaultTender;
      if (row.tenderName) {
        const tMatch = tenders.find(
          (t) =>
            t.departmentName.toLowerCase().includes(row.tenderName!.toLowerCase()) ||
            t.tenderNumber.toLowerCase().includes(row.tenderName!.toLowerCase())
        );
        if (tMatch) matchedTenderId = tMatch.id;
      }

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
        status: 'active',
        fuelPolicy: 'monthly_fixed_budget',
      };
    });

    // Update reverse vehicle links on newly created drivers
    newDriversToCreate.forEach((d) => {
      if (!d.currentVehicleId) {
        const foundV = newVehiclesList.find((v) => v.currentDriverId === d.id);
        if (foundV) d.currentVehicleId = foundV.id;
      }
    });

    // 3. Process Officers
    validOfficers.forEach((row) => {
      const oId = generateOfficerUniqueId(tempOfficers);

      let oTenderId = defaultTender;
      if (row.tenderName) {
        const tMatch = tenders.find(
          (t) =>
            t.departmentName.toLowerCase().includes(row.tenderName.toLowerCase()) ||
            t.tenderNumber.toLowerCase().includes(row.tenderName.toLowerCase())
        );
        if (tMatch) oTenderId = tMatch.id;
      }

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

    // 4. Process Tenders
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
      tollTerms: 'reimbursable_actuals',
      penaltyClauses: '₹1000 per day absent without replacement',
      officerDesignationsSummary: 'Executive Officers',
      contactPerson: row.contactOfficerName || 'Nodal Officer',
      contactPhone: row.contactOfficerPhone || '9415000000',
      status: 'active',
      contractType: 'monthly_attached',
      packages: [
        {
          id: `pkg-${Date.now()}-1`,
          packageName: 'Monthly Dedicated Commercial Vehicle',
          serviceScope: 'vehicle_driver_fuel',
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

    // COMMIT ALL STATE
    if (newVehiclesList.length > 0) {
      onImportVehicles(newVehiclesList, newVendorsToAdd);
    }
    if (newDriversToCreate.length > 0) {
      onImportDrivers(newDriversToCreate);
    }
    if (newOfficersToCreate.length > 0) {
      onImportOfficers(newOfficersToCreate);
    }
    if (newTendersToCreate.length > 0) {
      onImportTenders(newTendersToCreate);
    }

    const successSummary = [
      newVehiclesList.length > 0 ? `🚗 ${newVehiclesList.length} गाड़ियाँ` : '',
      newDriversToCreate.length > 0 ? `👨‍✈️ ${newDriversToCreate.length} चालक (ड्राइवर)` : '',
      newOfficersToCreate.length > 0 ? `👔 ${newOfficersToCreate.length} अधिकारी` : '',
      newTendersToCreate.length > 0 ? `🏢 ${newTendersToCreate.length} टेंडर` : '',
      newVendorsToAdd.length > 0 ? `🤝 ${newVendorsToAdd.length} वेंडर` : '',
    ]
      .filter(Boolean)
      .join(', ');

    setImportSuccessMessage(
      `सफलतापूर्वक सुरक्षित! ${successSummary} सिस्टम में दर्ज किए गए। चालक का नाम व सभी विवरण अब सभी जगह दिखाई दे रहे हैं!`
    );

    // Clear parsed lists
    setParsedVehicles([]);
    setParsedDrivers([]);
    setParsedOfficers([]);
    setParsedTenders([]);
  };

  const currentVehiclesValid = parsedVehicles.filter((v) => v.isValid && (!skipDuplicates || !v.isDuplicate)).length;
  const currentDriversValid = parsedDrivers.filter((d) => d.isValid && (!skipDuplicates || !d.isDuplicate)).length;
  const currentOfficersValid = parsedOfficers.filter((o) => o.isValid && (!skipDuplicates || !o.isDuplicate)).length;
  const currentTendersValid = parsedTenders.filter((t) => t.isValid && (!skipDuplicates || !t.isDuplicate)).length;

  const totalValidCount = currentVehiclesValid + currentDriversValid + currentOfficersValid + currentTendersValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[94vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>एक्सेल व मैन्युअल डेटा फीडिंग हब (Data Feeding & Excel Import Center)</span>
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded uppercase">
                  Fast-Track
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                गाड़ियाँ, चालक (ड्राइवर), अधिकारी, टेंडर व वेंडर अलग-अलग टैब में फीड करें या एक्सेल/CSV से अपलोड करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
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
              <Car className="w-4 h-4 text-amber-300" />
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
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-200" />
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
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
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
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
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
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-200" />
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
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
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
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
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
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
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
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
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
                    ? 'bg-slate-900 text-white shadow-xs'
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
                    ? 'bg-slate-900 text-white shadow-xs'
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
                <p className="text-xs text-slate-500">
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
                <span className="text-[11px] text-slate-500">
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
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
                      className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
            parsedTenders.length > 0) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">
                    📋 इम्पोर्ट पूर्व प्रीव्यू (Preview & Validation):
                  </span>
                  <div className="flex items-center gap-1.5">
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
                            ? 'bg-indigo-600 text-white'
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
                            ? 'bg-amber-600 text-white'
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
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        🏢 टेंडर ({parsedTenders.length})
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
                    <thead className="bg-slate-800 text-white sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
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
                            <td className="p-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-slate-900">{v.vehicleNumber}</td>
                            <td className="p-2.5">
                              <div>{v.makeModel}</div>
                              <div className="text-[10px] text-slate-500">{v.vehicleType} &bull; {v.fuelType}</div>
                            </td>
                            {/* PROMINENT DRIVER NAME DISPLAY */}
                            <td className="p-2.5 bg-emerald-50/60 border-x border-emerald-200">
                              {v.driverName || v.assignedDriver ? (
                                <div className="space-y-0.5">
                                  <span className="font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded text-xs inline-flex items-center gap-1">
                                    👨‍✈️ {v.driverName || v.assignedDriver}
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
                                    : 'bg-purple-100 text-purple-800'
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
                            <td className="p-2.5">
                              {isDup ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                  मौजूद (Duplicate)
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  वैध (Ready)
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                onClick={() => setParsedVehicles(parsedVehicles.filter((_, idx) => idx !== i))}
                                className="text-slate-400 hover:text-rose-600"
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
                    <thead className="bg-slate-800 text-white sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
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
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">👨‍✈️ {d.name}</td>
                          <td className="p-2.5 font-mono">{d.phone}</td>
                          <td className="p-2.5 font-mono">{d.licenseNumber}</td>
                          <td className="p-2.5 font-medium">{d.employmentType}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{d.monthlySalary.toLocaleString()}</td>
                          <td className="p-2.5 font-mono font-bold text-emerald-800">{d.assignedVehicleNumber || '-'}</td>
                          <td className="p-2.5">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              वैध (Ready)
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedDrivers(parsedDrivers.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-rose-600"
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
                    <thead className="bg-slate-800 text-white sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">अधिकारी का नाम</th>
                        <th className="p-2.5">पदनाम</th>
                        <th className="p-2.5">विभाग</th>
                        <th className="p-2.5">मोबाइल</th>
                        <th className="p-2.5">तैनात गाड़ी</th>
                        <th className="p-2.5">टेंडर</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedOfficers.map((o, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">👔 {o.name}</td>
                          <td className="p-2.5">{o.designation}</td>
                          <td className="p-2.5">{o.department}</td>
                          <td className="p-2.5 font-mono">{o.mobile}</td>
                          <td className="p-2.5 font-mono font-bold text-indigo-800">{o.assignedVehicleNumber || '-'}</td>
                          <td className="p-2.5 truncate max-w-[140px]">{o.tenderName}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedOfficers(parsedOfficers.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-rose-600"
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
                    <thead className="bg-slate-800 text-white sticky top-0 z-10 text-[11px] uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="p-2.5 w-12 text-center">#</th>
                        <th className="p-2.5">टेंडर नंबर</th>
                        <th className="p-2.5">विभाग</th>
                        <th className="p-2.5">प्राधिकरण</th>
                        <th className="p-2.5 text-right">मासिक बजट</th>
                        <th className="p-2.5 text-center">गाड़ियाँ</th>
                        <th className="p-2.5 text-center">हटाएँ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {parsedTenders.map((t, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-400">{i + 1}</td>
                          <td className="p-2.5 font-bold font-mono text-slate-900">{t.tenderNumber}</td>
                          <td className="p-2.5 font-semibold text-slate-800">{t.departmentName}</td>
                          <td className="p-2.5 text-slate-600">{t.authorityOffice}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{t.sanctionedAmount.toLocaleString()}</td>
                          <td className="p-2.5 text-center font-bold text-indigo-700">{t.vehiclesRequired}</td>
                          <td className="p-2.5 text-center">
                            <button
                              onClick={() => setParsedTenders(parsedTenders.filter((_, idx) => idx !== i))}
                              className="text-slate-400 hover:text-rose-600"
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
            <div className="text-xs text-slate-500">
              {totalValidCount > 0 ? (
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  इम्पोर्ट हेतु कुल तैयार: <strong className="text-emerald-700">{totalValidCount} रिकॉर्ड्स</strong>
                  {parsedVehicles.length > 0 && ` (${currentVehiclesValid} गाड़ियाँ)`}
                  {parsedDrivers.length > 0 && ` (${currentDriversValid} चालक)`}
                  {parsedOfficers.length > 0 && ` (${currentOfficersValid} अधिकारी)`}
                  {parsedTenders.length > 0 && ` (${currentTendersValid} टेंडर)`}
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
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
