export type FuelPolicy = 'actual_reimbursement' | 'monthly_fixed_budget';

export type DutyType = 'local' | 'outstation' | 'inspection' | 'night_halt';

export type PaymentStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'overdue';

export type ServiceType = 
  | 'scheduled' 
  | 'engine_oil' 
  | 'tyres' 
  | 'ac_repair' 
  | 'brake_suspension' 
  | 'denting_painting' 
  | 'rto_passing' 
  | 'other';

export type ReplacementReason = 
  | 'officer_request' 
  | 'leave' 
  | 'performance' 
  | 'discipline' 
  | 'routine_shift' 
  | 'resigned'
  | 'new_deployment';

export type DocumentCategory =
  | 'rc'
  | 'insurance'
  | 'puc'
  | 'tax'
  | 'fitness'
  | 'permit'
  | 'aadhaar'
  | 'driving_license'
  | 'pan'
  | 'police_verification'
  | 'work_order'
  | 'tender_agreement'
  | 'emd_bg'
  | 'gem_contract'
  | 'other';

export interface DocumentAttachment {
  id: string;
  title: string; // e.g. "RC Certificate", "Commercial Comprehensive Insurance", "Aadhaar Card"
  category: DocumentCategory;
  documentNumber?: string; // e.g. "UP32-2024-RC-9912", "0823003126P100234", "DL-UP3220180029381"
  issuingAuthority?: string; // e.g. "RTO Lucknow", "United India Insurance", "UIDAI", "Transport Commissioner"
  issueDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  fileName: string;
  fileType: 'pdf' | 'image' | 'doc';
  fileUrl?: string; // Base64 data URL or simulated preview
  fileSize?: string; // e.g. "1.4 MB"
  uploadedAt: string; // YYYY-MM-DD HH:mm
  verified: boolean;
  notes?: string;
}

export interface BillSeriesConfig {
  prefix: string; // e.g. "SF/BILL/2026-27/" or "INV/GOVT/"
  startingNumber: number; // e.g. 101 or 1
  currentNumber: number; // counter
  paddingDigits: number; // e.g. 3 => 001, 4 => 0001
  suffix: string; // e.g. "" or "/UP"
  includeMonthYear: boolean;
  useTenderPrefix: boolean; // if true, uses tender.billSeriesPrefix if available
}

export type TenderServiceScope =
  | 'vehicle_driver_fuel' // Full Package: गाड़ी + ड्राइवर + ईंधन
  | 'vehicle_driver'      // Vehicle + Driver: गाड़ी + ड्राइवर (ईंधन विभाग का / अलग बिल)
  | 'only_vehicle'        // Only Vehicle / Dry Lease: केवल गाड़ी (ड्राइवर विभाग का)
  | 'only_driver';        // Only Driver Service: केवल चालक सेवा (गाड़ी विभाग की)

export interface TenderVehiclePackage {
  id: string; // e.g. "pkg-1", "pkg-2"
  packageName: string; // e.g. "Lot 1: Sedan (Dzire / Amaze) - Executive Car"
  serviceScope: TenderServiceScope; // गाड़ी+ड्राइवर+ईंधन, गाड़ी+ड्राइवर, केवल गाड़ी, केवल ड्राइवर
  vehicleCategory: string; // "Sedan", "SUV", "Premium SUV (Innova)", "Hatchback", "MUV/Van", "Bus/Traveller", "Only Driver", etc.
  usageDutyType?: string; // e.g. "Routine Office 10-12 Hrs", "24x7 Emergency/Control Room", "Field & Outstation Inspection", "VIP Escort"
  quantity: number; // Number of vehicles / drivers required in this package (e.g. 6)
  monthlyBaseRate: number; // Base rate per vehicle per month (₹) e.g. 33120
  includedKms: number; // Monthly KM quota e.g. 2500 (0 for only_driver)
  includedHours: number; // Monthly duty hours e.g. 320
  extraKmRate: number; // ₹ / KM e.g. 10
  extraHourRate: number; // ₹ / Hour e.g. 50
  nightHaltRate: number; // ₹ / Night halt DA e.g. 190
  tollTerms?: 'reimbursable_actuals' | 'contractor_borne';
  specifications?: string; // e.g. "AC, White Color, Commercial Yellow Plate, GPS Enabled"
}

export type TenderContractType = 'monthly_attached' | 'on_call' | 'hybrid';

export interface TenderOnCallDefaults {
  defaultPackageType?: DutyTypeCategory;
  baseRate?: number;
  baseHours?: number;
  baseKm?: number;
  extraKmRate?: number;
  extraHourRate?: number;
  nightHaltRate?: number;
  driverDaRate?: number;
  gstRatePercent?: number;
  defaultPickupLocation?: string;
  defaultDropLocation?: string;
  clientGstin?: string;
  clientBillingAddress?: string;
  defaultBookerName?: string;
  defaultBookerPhone?: string;
  defaultBookerDesignation?: string;
  defaultBookerRoom?: string;
  specialInstructions?: string;
}

export interface Tender {
  id: string;
  tenderNumber: string; // e.g. GeM-GEM/2026/B/874129 or PWD/CAB/2026-03
  workOrderNumber: string;
  departmentName: string; // e.g. "Public Works Department (PWD)", "National Highways Authority (NHAI)"
  authorityOffice: string; // e.g. "Executive Engineer Division 1, Civil Lines"
  contractPeriodStart: string; // YYYY-MM-DD
  contractPeriodEnd: string; // YYYY-MM-DD
  billingCycleDay: number; // e.g. 1st or 25th of month
  paymentTermsDays: number; // e.g. 30 days
  baseMonthlyRate: number; // Default/Primary package rate e.g. ₹36,000 per month
  includedKms: number; // Default/Primary package KM quota e.g. 2000 KM/month
  includedHours: number; // Default/Primary package hours e.g. 250 Hours/month
  extraKmRate: number; // Default extra KM rate e.g. ₹12 / KM
  extraHourRate: number; // Default extra hour rate e.g. ₹60 / Hour
  nightHaltRate: number; // Default night halt rate e.g. ₹400 / Night
  tollTerms: 'reimbursable_actuals' | 'contractor_borne';
  penaltyClauses: string; // e.g. "₹1,000 per day absent without replacement; ₹500 for non-AC"
  officerDesignationsSummary: string; // e.g. "Chief Engineer, SE Vigilance"
  status: 'active' | 'completed' | 'renewed';
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  billSeriesPrefix?: string; // Custom bill series prefix e.g. "PWD/LKO/2026/"
  emdDetails?: string; // Performance security / EMD / Bank Guarantee
  agreementNumber?: string;
  documents?: DocumentAttachment[];

  // Contract Nature: Dedicated Monthly Attached vs On-Call Spot vs Hybrid Both
  contractType?: TenderContractType;
  onCallDefaults?: TenderOnCallDefaults;

  // Multi-variant packages & requirement scope (गाड़ियों के प्रकार, अलग-अलग KM व सेवा शर्तें)
  packages?: TenderVehiclePackage[];
}

export interface Officer {
  id: string;
  officerCode?: string; // Unique Officer Code e.g. "OFF-101" (अद्वितीय अधिकारी कोड)
  name: string; // e.g. "Er. Ramesh Chandra Sharma"
  designation: string; // e.g. "Chief Engineer (Roads & Bridges)"
  department: string; // e.g. "PWD Headquarters"
  officeAddress: string; // e.g. "Room 304, Nirman Bhawan"
  mobile: string;
  alternatePhone?: string;
  email?: string;
  assignedVehicleId?: string;
  currentDriverId?: string;
  tenderId: string;
  reportingTime: string; // e.g. "09:00 AM"
  status?: 'active' | 'transferred' | 'retired' | 'relieved';
  transferDate?: string; // YYYY-MM-DD
  transferOrderNumber?: string;
  transferDestination?: string; // e.g. "Transferred to PWD Gorakhpur Circle"
  specialInstructions?: string;
}

export type VehicleOperationalStatus =
  | 'active'
  | 'in_service'
  | 'idle'
  | 'idle_officer_transferred'
  | 'surrendered_temporary'
  | 'standby_pool';

export interface Vehicle {
  id: string;
  vehicleNumber: string; // e.g. "UP32 AB 1234"
  makeModel: string; // e.g. "Maruti Swift Dzire ZXi" or "Toyota Innova Crysta"
  vehicleType: 'Sedan' | 'SUV' | 'MUV' | 'Hatchback' | 'EV';
  fuelType: 'Diesel' | 'Petrol' | 'CNG' | 'Electric';
  color: string;
  modelYear: number;
  ownershipType: 'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver';
  registrationType?: 'Commercial' | 'Private'; // 'Commercial' (Yellow Plate) | 'Private' (White Plate)
  vendorId?: string;
  vendorName?: string;
  monthlyVendorRent?: number; // Rent payout to vendor/owner
  tenderId: string;
  tenderPackageId?: string; // Linked tender package / lot (e.g. Lot 1 Sedan, Lot 2 SUV)
  assignedOfficerId?: string;
  assignedOfficerName?: string; // Fallback / direct Officer Name
  currentDriverId?: string;
  driverName?: string; // Fallback / direct Driver Name (ensures visibility across all views)
  driverPhone?: string; // Fallback / direct Driver Phone
  currentOdometer: number;
  // Asset & Purchase Details (Company Owned Fleet)
  purchaseDate?: string; // YYYY-MM-DD e.g. "2024-03-15"
  purchaseCost?: number; // e.g. ₹8,50,000
  financingBank?: string; // e.g. "HDFC Bank Auto Loan (EMI: ₹14,200)"
  chassisNumber?: string;
  engineNumber?: string;
  // Servicing Lifecycle
  lastServiceDate?: string; // YYYY-MM-DD
  lastServiceKm?: number;
  nextServiceDueKm?: number;
  nextServiceDueDate?: string; // YYYY-MM-DD
  // Compliance and Document Expiries
  rtoFitnessExpiry: string; // YYYY-MM-DD
  insuranceExpiry: string; // YYYY-MM-DD
  insuranceCompany?: string; // e.g. "United India Insurance"
  insurancePolicyNo?: string;
  pucExpiry: string; // YYYY-MM-DD
  roadTaxExpiry: string; // YYYY-MM-DD
  permitExpiry: string; // YYYY-MM-DD
  rcNumber?: string; // e.g. "UP32-2024-RC-00918"
  fitnessCertNumber?: string; // e.g. "FIT/UP32/2026/8812"
  taxReceiptNumber?: string; // e.g. "TAX-REC-2026-99120"
  permitNumber?: string; // e.g. "CC/UP/2026/PERMIT-0144"
  permitType?: string; // e.g. "Commercial Contract Carriage", "All India Tourist Permit"
  fastagId?: string;
  status: VehicleOperationalStatus;
  idleSinceDate?: string; // YYYY-MM-DD when vehicle stopped due to transfer/post vacant
  idleReason?: string; // e.g. "Officer Er. Sharma transferred to Varanasi. Vehicle halted awaiting new officer posting."
  transferOrderRef?: string; // e.g. "PWD/GO/2026/TRF-881"
  fuelPolicy: FuelPolicy;
  monthlyFixedFuelAmount?: number; // e.g. ₹12,000 if monthly fixed
  documents?: DocumentAttachment[];
}

export interface Vendor {
  id: string;
  vendorCode?: string; // Unique Vendor Code e.g. "VND-101" or "VND-OD-101" (अद्वितीय वेंडर कोड)
  name: string; // e.g. "Shree Balaji Tour & Travels" or "Manoj Kumar (Owner-Driver)"
  contactPerson: string;
  phone: string;
  alternatePhone?: string;
  panNumber: string;
  gstin?: string;
  address: string;
  bankAccountDetails: string;
  vendorType: 'fleet_vendor' | 'owner_driver' | 'fuel_vendor';
  monthlyAgreedRatePerVehicle: number; // e.g. ₹31,000 / month
  isTdsApplicable?: boolean; // whether TDS is deducted or not (TDS काटना है या नहीं)
  tdsRate: number; // 0, 1, 2, or custom rate (e.g. 0.1, 1.5, 5, etc.)
  tdsSection?: string; // e.g. '194C' | '194I' | '194Q' | 'Other'
  tdsExemptionReason?: string; // Reason if TDS is not applicable (e.g. 'Section 194C(6) Declaration (<= 10 vehicles)', 'Below Threshold', etc.)
  status: 'active' | 'inactive';
  notes?: string;
}

export type PaymentCategory = 
  | 'driver_advance' 
  | 'driver_salary' 
  | 'vendor_rent' 
  | 'fuel' 
  | 'maintenance' 
  | 'fastag_toll' 
  | 'police_challan' 
  | 'emergency_expense' 
  | 'other';

export interface DailyPaymentEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: PaymentCategory;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  payeeName: string;
  payeeType: 'driver' | 'vendor' | 'fuel_pump' | 'workshop' | 'toll' | 'other';
  driverId?: string;
  vendorId?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  description: string;
  autoRoutedTo: string; // e.g. "Driver Advance Khata", "Vendor Ledger", "Vehicle Maintenance", "Fuel Records"
  recordedBy?: string;
}

export interface VendorSettlement {
  id: string;
  voucherNumber: string;
  vendorId: string;
  vendorName: string;
  vehicleId: string;
  vehicleNumber: string;
  monthYear: string; // "YYYY-MM"
  settlementDate: string;
  agreedBaseRent: number;
  extraKmShare: number;
  totalEarned: number;
  deductionsAdvances: number;
  deductionsFuelByContractor: number;
  deductionsFastagByContractor: number;
  deductionsOther: number;
  isTdsApplicable?: boolean;
  tdsPercent: number;
  tdsAmount: number;
  tdsSection?: string;
  tdsExemptionReason?: string;
  netPayableToVendor: number;
  paymentStatus: 'draft' | 'approved' | 'paid';
  paymentDate?: string;
  paymentRef?: string;
  remarks?: string;
}

export interface Driver {
  id: string;
  driverCode?: string; // Unique Driver Code e.g. "DRV-101" or "DRV-001" (अद्वितीय चालक कोड)
  name: string; // e.g. "Rajesh Kumar Yadav"
  phone: string;
  alternatePhone?: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  badgeNumber?: string;
  policeVerificationDate: string;
  policeVerificationExpiry: string;
  aadharNumber: string;
  panNumber?: string; // 10-digit PAN e.g. "ABCDE1234F"
  bloodGroup?: string; // e.g. "B+ve"
  joiningDate: string;
  monthlySalary: number; // Base monthly salary e.g. ₹16,500
  dailyDaRate: number; // Outstation / Night DA e.g. ₹350
  status: 'active' | 'on_leave' | 'released';
  currentVehicleId?: string;
  fuelPolicy: FuelPolicy;
  monthlyFuelBudgetAmount: number; // If fixed fuel mode
  bankAccountDetails?: string;
  emergencyContact?: string;
  // Govt Labour Law & EPF / ESIC Compliance
  employmentType?: 'company_statutory' | 'contractual_khata' | 'owner_driver';
  uanNumber?: string; // 12-digit EPF Universal Account Number e.g. "101928374651"
  epfMemberId?: string; // e.g. "UP/LKO/0034812/000/00128"
  esicIpNumber?: string; // 10-digit ESIC Insurance Person # e.g. "2198374650"
  skillCategory?: 'Skilled' | 'Semi-Skilled' | 'Highly Skilled'; // Commercial driver is Skilled under Labour Law
  minimumWageBasic?: number; // Statutory basic rate e.g. ₹15,600
  vda?: number; // Variable Dearness Allowance e.g. ₹1,820
  hra?: number; // House Rent Allowance e.g. ₹1,500
  isEpfApplicable?: boolean;
  isEsicApplicable?: boolean;
  documents?: DocumentAttachment[];
}

export interface StatutoryPayrollEntry {
  id: string;
  driverId: string;
  driverName: string;
  phone: string;
  uanNumber: string;
  esicIpNumber: string;
  tenderId: string;
  tenderName: string;
  vehicleNumber: string;
  monthYear: string; // "YYYY-MM"
  
  // Days & Attendance
  totalMonthDays: number;
  daysWorked: number;
  weeklyOffs: number;
  paidLeave: number;
  payableDays: number;
  
  // Wage Components
  basicWage: number;
  vdaWage: number;
  hraWage: number;
  grossEarned: number;
  
  // Employee Deductions
  epfEmployee12: number; // 12% of (Basic + VDA)
  esicEmployee075: number; // 0.75% of Gross
  advancesDeduction: number;
  totalEmployeeDeductions: number;
  netInHandSalary: number; // Gross - deductions
  
  // Employer Statutory Outflow
  epfEmployer13: number; // 13% total (8.33% Pension + 3.67% EPF + 1% EDLI/Admin)
  esicEmployer325: number; // 3.25% of Gross
  statutoryBonus833: number; // 8.33% Bonus
  totalCtcOutflow: number;
  
  // Status & Challan
  paymentStatus: 'draft' | 'processed' | 'deposited';
  salaryPaidDate?: string;
  bankUtr?: string;
  epfTrrnChallan?: string;
  esicChallanNo?: string;
}

export interface DriverAllocationHistory {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  tenderId: string;
  tenderName: string;
  officerId: string;
  officerName: string;
  assignedDate: string; // YYYY-MM-DD
  releasedDate?: string; // YYYY-MM-DD or undefined if still active
  reasonForChange: ReplacementReason;
  notes: string;
}

export type VehicleReplacementReason =
  | 'breakdown_maintenance'
  | 'officer_request'
  | 'accident'
  | 'fitness_rc_expiry'
  | 'temporary_substitute'
  | 'contract_upgrade'
  | 'vendor_fleet_rotation'
  | 'other';

export interface VehicleAllocationHistory {
  id: string;
  tenderId: string;
  tenderName: string;
  vehicleId: string;
  vehicleNumber: string;
  makeModel: string;
  officerId?: string;
  officerName?: string;
  driverId?: string;
  driverName?: string;
  assignedDate: string; // YYYY-MM-DD
  releasedDate?: string; // YYYY-MM-DD or undefined if still active
  replacementVehicleId?: string;
  replacementVehicleNumber?: string;
  replacementVehicleModel?: string;
  reasonForChange: VehicleReplacementReason;
  notes: string;
  ownershipType?: 'Company Owned' | 'Attached / Market Hire' | 'Owner-Driver';
}

export type OfficerTransferReason =
  | 'routine_transfer'          // सामान्य स्थानांतरण
  | 'promotion_transfer'        // पदोन्नति उपरांत स्थानांतरण
  | 'retirement'               // सेवानिवृत्ति (Retirement)
  | 'relieved_transferred'      // कार्यमुक्त होकर नवीन तैनाती
  | 'post_vacant_car_stopped'   // पद रिक्त - गाड़ी चलना बंद (Vehicle Idle)
  | 'department_reallocation'   // विभाग आंतरिक पुनरावंटन
  | 'temporary_charge'          // अस्थायी प्रभार
  | 'vehicle_surrendered'       // गाड़ी विभाग को अस्थायी समर्पित
  | 'new_joining';             // नवीन अधिकारी कार्यभार ग्रहण

export interface OfficerAllocationHistory {
  id: string;
  tenderId: string;
  tenderName: string;
  vehicleId: string;
  vehicleNumber: string;
  officerId: string;
  officerName: string;
  officerDesignation: string;
  department: string;
  assignedDate: string; // YYYY-MM-DD
  relievedDate?: string; // YYYY-MM-DD or undefined if currently active
  replacementOfficerId?: string;
  replacementOfficerName?: string;
  replacementOfficerDesignation?: string;
  vehicleAction: 'reassigned_to_new_officer' | 'halted_idle_post_vacant' | 'vehicle_surrendered' | 'transferred_to_pool';
  reason: OfficerTransferReason;
  transferOrderNumber?: string; // e.g. "PWD/GO/2026/TRF-412"
  notes: string;
}

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  officerId: string;
  officerName: string;
  tenderId: string;
  openingKm: number;
  closingKm: number;
  totalKm: number;
  openingTime: string; // HH:mm (24h)
  closingTime: string; // HH:mm (24h)
  totalHours: number;
  startLocation: string; // e.g. "Officer Residence, Gomti Nagar"
  endLocation: string; // e.g. "Head Office / Camp Office"
  purpose: string; // e.g. "Site Inspection at Highway Bypass, Office Commute"
  dutyType: DutyType;
  tollParkingCost: number;
  driverDaNightHalt: number;
  acUsed: boolean;
  slipNumber: string; // Daily duty slip number signed by officer
  isVerifiedByOfficer: boolean;
  officerRemarks?: string;
  recordedBy?: string;
}

export interface FuelRecord {
  id: string;
  date: string; // YYYY-MM-DD
  vehicleId: string;
  vehicleNumber: string;
  driverId: string;
  driverName: string;
  mode: 'slip' | 'monthly_fixed'; // Actual bill vs Fixed monthly allowance
  liters: number;
  ratePerLiter: number;
  totalAmount: number;
  odometerKm: number;
  fuelType: 'Diesel' | 'Petrol' | 'CNG';
  fuelStation: string;
  receiptNumber: string;
  fullTank: boolean;
  notes?: string;
  recordedBy?: string;
  fuelSlipId?: string; // Linked fuel slip if issued via office parchi
  pumpVendorId?: string;
}

// Fuel Pump Vendor Master (अनुबंधित पेट्रोल पंप वेंडर)
export interface FuelPumpVendor {
  id: string;
  name: string; // e.g. "Kisan Petroleum Service (IOCL)"
  stationBrand: 'IOCL' | 'BPCL' | 'HPCL' | 'Reliance' | 'Nayara' | 'Other';
  location: string; // e.g. "Faizabad Road, Chinhat, Lucknow"
  contactPerson: string;
  phone: string;
  alternatePhone?: string;
  panNumber?: string;
  gstin?: string;
  creditLimit?: number; // e.g. ₹2,00,000 monthly credit line
  billingCycleDay: number; // e.g. 1st or end of month
  bankDetails?: string;
  isTdsApplicable?: boolean; // Fuel vendor TDS option (TDS काटना है या नहीं)
  tdsRate?: number; // e.g. 0.1% for Sec 194Q or 1% / 2%
  tdsSection?: string; // e.g. '194Q' | '194C' | 'Other'
  tdsExemptionReason?: string;
  status: 'active' | 'inactive';
  notes?: string;
}

// Fuel Slip / Chit Issued by Office to Driver (ऑफिस से जारी ईंधन पर्ची / इंडेंट)
export type FuelSlipStatus = 'issued' | 'filled' | 'billed' | 'cancelled';

export interface FuelSlip {
  id: string;
  slipNumber: string; // e.g. "SLIP-2026-104"
  issueDate: string; // YYYY-MM-DD
  issueTime?: string; // HH:mm
  vehicleId: string;
  vehicleNumber: string;
  vehicleModel?: string;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  pumpVendorId: string;
  pumpVendorName: string;
  fuelType: 'Diesel' | 'Petrol' | 'CNG';
  authorizedQuantityType: 'liters' | 'full_tank' | 'fixed_amount';
  authorizedValue: number; // e.g. 35 liters or ₹3000 (0 if full tank)
  openingOdometerKm?: number;
  issuedBy: string; // e.g. "Office Cashier" or staff name
  status: FuelSlipStatus;

  // Dispensed details (filled at pump)
  fillDate?: string;
  fillTime?: string;
  actualLiters?: number;
  ratePerLiter?: number;
  totalAmount?: number;
  closingOdometerKm?: number;
  pumpReceiptNumber?: string;
  notes?: string;

  // Billing linkage
  vendorBillId?: string; // Linked to FuelVendorMonthlyBill
  vendorBillNumber?: string;
}

// Vehicle-wise Breakdown within a Monthly Fuel Vendor Bill (गाड़ी-वार ईंधन व बिल समरी)
export interface FuelVendorBillVehicleSummary {
  vehicleId: string;
  vehicleNumber: string;
  makeModel?: string;
  driverName?: string;
  refillCount: number;
  totalLiters: number;
  avgRate: number;
  totalAmount: number;
  slipNumbers: string[];
}

// Monthly Consolidated Bill Issued by Fuel Vendor (पेट्रोल पंप वेंडर का मासिक बिल)
export interface FuelVendorMonthlyBill {
  id: string;
  billNumber: string; // e.g. "IOC-SEP-2026-081"
  pumpVendorId: string;
  pumpVendorName: string;
  monthYear: string; // "YYYY-MM" e.g. "2026-09"
  billDate: string; // YYYY-MM-DD
  dueDate?: string;
  totalLiters: number;
  totalAmount: number;
  discountOrRebate?: number;
  isTdsApplicable?: boolean;
  tdsRate?: number;
  tdsAmount?: number;
  tdsSection?: string;
  netPayable: number;
  paymentStatus: 'pending' | 'partially_paid' | 'paid';
  paidAmount?: number;
  paidDate?: string;
  paymentMode?: 'bank_transfer' | 'cheque' | 'upi' | 'cash';
  paymentReference?: string; // UTR or Cheque number
  vehicleBreakdown: FuelVendorBillVehicleSummary[];
  reconciledSlipsCount: number;
  notes?: string;
  verifiedBy?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  vehicleId: string;
  vehicleNumber: string;
  serviceType: ServiceType;
  odometerKm: number;
  garageName: string;
  cost: number;
  partsReplaced?: string;
  description: string;
  invoiceNumber?: string;
  nextServiceDueKm?: number;
  nextServiceDueDate?: string;
  recordedBy?: string;
}

export type DriverKhataTransactionType =
  | 'advance'
  | 'salary_payment'
  | 'trip_expense'
  | 'fastag_topup'
  | 'penalty_deduction'
  | 'fuel_budget_advance'
  | 'da_food_expense'
  | 'bonus'
  | 'leave_deduction'
  | 'other';

export interface DriverKhataTransaction {
  id: string;
  driverId: string;
  driverName: string;
  date: string; // YYYY-MM-DD
  type: DriverKhataTransactionType;
  amount: number;
  description: string;
  paymentMode: 'cash' | 'upi' | 'bank_transfer';
  referenceNumber?: string;
  tenderId?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  officerId?: string;
  recordedBy?: string;
}

export interface DriverLeaveRecord {
  id: string;
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehicleNumber: string;
  tenderId: string;
  tenderName?: string;
  officerId?: string;
  officerName?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  leaveReason: string; // e.g. "बीमारी", "घरेलू कार्य / शादी", "गांव गए", "बिना सूचना अनुपस्थित"
  hasSubstitute: boolean; // क्या बदली ड्राइवर गया?
  substituteDriverType?: 'registered_driver' | 'temporary_driver' | 'none';
  substituteDriverId?: string;
  substituteDriverName?: string;
  substituteDriverPhone?: string;
  dailySubstitutePay: number; // बदली ड्राइवर को दैनिक भुगतान (₹)
  totalSubstitutePaid: number; // कुल बदली भुगतान (₹)
  substitutePaymentMode?: 'cash' | 'upi' | 'bank_transfer';
  deductFromMainDriverSalary: boolean; // क्या मुख्य ड्राइवर के मासिक वेतन से कटेगा?
  deductionAmount: number; // मुख्य ड्राइवर से कटौती राशि (₹)
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface MonthlyBill {
  id: string;
  billNumber: string; // e.g. "SF/BILL/2026/08/PWD-01"
  tenderId: string;
  tenderName: string;
  departmentName: string;
  officerName: string;
  vehicleId: string;
  vehicleNumber: string;
  monthYear: string; // "YYYY-MM"
  billDate: string;
  dueDate: string;
  baseAmount: number;
  totalKmsRun: number;
  allowedKms: number;
  extraKms: number;
  extraKmRate: number;
  extraKmAmount: number;
  totalHoursRun: number;
  allowedHours: number;
  extraHours: number;
  extraHourRate: number;
  extraHourAmount: number;
  nightHaltsCount: number;
  nightHaltRate: number;
  nightHaltAmount: number;
  tollParkingAmount: number;
  penaltyDeductions: number;
  penaltyRemarks?: string;
  grossAmount: number;
  gstPercent: number; // e.g. 5 or 12
  gstAmount: number;
  tdsPercent: number; // e.g. 1 or 2
  tdsAmount: number;
  netPayableAmount: number;
  paymentStatus: PaymentStatus;
  paymentReceivedDate?: string;
  paymentRemarks?: string;
  voucherNumber?: string;
  referenceVoucher?: string;
}

export interface ReminderItem {
  id: string;
  type: 'bill_due' | 'bill_overdue' | 'doc_expiry' | 'company_doc_expiry' | 'service_due' | 'police_verification';
  title: string;
  description: string;
  dueDate: string;
  severity: 'high' | 'medium' | 'info';
  metadata: {
    tenderId?: string;
    vehicleId?: string;
    driverId?: string;
    billId?: string;
    companyDocId?: string;
    docType?: string;
    amount?: number;
    phone?: string;
    entityName?: string;
  };
}

// Company Document Types & Expiry Tracker (कंपनी महत्वपूर्ण दस्तावेज व एक्सपायरी ट्रैकर)
export type CompanyDocCategory =
  | 'gst_tax'             // GST सर्टिफिकेट, 3B, TAN/PAN, ITR
  | 'tour_transport'      // टूर ऑपरेटर लाइसेंस, ऑल इंडिया टूरिस्ट परमिट (AITP), RTO मास्टर
  | 'digital_token_gem'   // डिजिटल सिग्नेचर (DSC Token Class-3 e-Tender), GeM वेंडर
  | 'trade_license'       // गुमाश्ता, नगर निगम ट्रेड लाइसेंस, दुकान स्थापना
  | 'banking_guarantee'   // बैंक गारंटी (BG), FD प्लेज, करंट अकाउंट KYC
  | 'legal_lease'         // ऑफिस रेंट एग्रीमेंट, पार्किंग लीज डीड, पार्टनरशिप डीड
  | 'insurance_policy'    // ऑफिस व गैराज बीमा, फ्लीट थर्ड-पार्टी, कामगार बीमा
  | 'labour_statutory'    // EPF, ESIC मुख्य कोड, लेबर लाइसेंस
  | 'pollution_noc'       // प्रदूषण बोर्ड NOC / फायर ब्रिगेड अनापत्ति प्रमाणपत्र
  | 'iso_quality'         // MSME / उद्यम रजिस्ट्रेशन, ISO सर्टिफिकेट
  | 'other';              // अन्य महत्वपूर्ण कंपनी दस्तावेज

export interface CompanyDocument {
  id: string;
  title: string; // e.g. "GST Registration Certificate", "DSC Token e-Tender (Class 3)", "All India Tourist Permit Master"
  category: CompanyDocCategory;
  docNumber: string; // e.g. "09AAACS1234F1Z8"
  issuingAuthority: string; // e.g. "GSTN / Finance Ministry", "e-Mudhra / Capricorn", "State Transport Authority"
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD (empty if lifetime)
  isLifetime: boolean; // true if no expiry (e.g. PAN, MSME, GST)
  alertDaysBefore: number; // e.g. 15, 30, 60 days
  custodyLocation?: string; // e.g. "Locker #1 - Office Safe", "CA Alok Office", "Director Desk"
  contactPersonOrAgent?: string; // e.g. "Advocate Sharma - 9839012345"
  fileUrl?: string; // Base64 or sample preview URL
  fileName?: string;
  fileType?: 'pdf' | 'image' | 'doc';
  fileSize?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Multi-User Staff & Role-Based Access Control (RBAC)
export type StaffRole =
  | 'admin'               // मालिक / मुख्य प्रशासक (Full Control)
  | 'fleet_manager'       // फ्लीट मैनेजर (गाड़ियां, ड्राइवर, लॉग, मेंटेनेंस)
  | 'accountant'          // अकाउंटेंट / मुंशी (बिलिंग, भुगतान, खाता, पेरोल)
  | 'field_supervisor'    // फील्ड सुपरवाइजर (लॉग्स, फ्यूल, पेटी कैश, गाड़ियां)
  | 'office_boy_cashier'  // ऑफिस बॉय / पेटी कैश बॉय (फुटकर खर्च, फ्यूल, एक्सेसरीज)
  | 'billing_clerk'       // बिलिंग क्लर्क (लॉग बुक व सरकारी बिलिंग)
  | 'custom';             // कस्टम अनुमतियां

export type ModulePermissionKey =
  | 'dashboard'
  | 'company_documents'
  | 'tenders'
  | 'vehicles_officers'
  | 'logbook'
  | 'billing'
  | 'drivers_khata'
  | 'fuel_manager'
  | 'maintenance'
  | 'daily_payments'
  | 'attached_vendors'
  | 'statutory_payroll'
  | 'petty_cash'
  | 'reminders'
  | 'staff_management';

export interface ModulePermission {
  canView: boolean;
  canEdit: boolean;
}

export interface StaffUser {
  id: string;
  name: string; // e.g. "Sonu Pal"
  designation: string; // e.g. "Office Boy / Field Assistant"
  role: StaffRole;
  mobile: string;
  email?: string;
  pin: string; // 4-digit PIN e.g. "1234"
  avatarColor: string; // Tailwind class e.g. "bg-emerald-600"
  status: 'active' | 'inactive';
  permissions: Record<ModulePermissionKey, ModulePermission>;
  assignedPettyCashAccountId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

// Petty Cash & Office Boy Field Expenses (पेटी कैश / फुटकर खर्च)
export type PettyCashExpenseCategory =
  | 'fuel_emergency'       // आपातकालीन ईंधन / पेट्रोल पंप नकद
  | 'servicing_puncture'   // पंचर, आयल टॉप-अप व त्वरित सर्विसिंग
  | 'vehicle_accessories'  // गाड़ी एक्सेसरीज (मैट्स, सीट कवर, वाईपर, बल्ब)
  | 'fastag_toll_cash'     // फास्टैग रिचार्ज व नकद टोल
  | 'car_wash_cleaning'    // गाड़ी धुलाई व सफाई सामग्री
  | 'driver_refreshments'  // चालक चाय-नाश्ता (देर रात / ओवरटाइम)
  | 'rto_puc_cash'         // PUC व प्रदूषण रसीद नकद
  | 'office_errands'       // कार्यालय फुटकर खर्च / रसीद बुक
  | 'other_misc';          // अन्य फुटकर खर्च

export interface PettyCashTransaction {
  id: string;
  type: 'cash_inflow' | 'cash_expense'; // inflow = office gave cash; expense = boy spent
  staffUserId: string;
  staffUserName: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  amount: number;
  category?: PettyCashExpenseCategory;
  vehicleId?: string;
  vehicleNumber?: string;
  payeeOrVendor?: string; // e.g. "Gupta Tyres Puncture Shop"
  billSlipNumber?: string; // e.g. "PETTY-2026-081"
  billPhotoUrl?: string;
  notes: string;
  paymentMode: 'Cash' | 'UPI / PhonePe' | 'Card';
  approvalStatus: 'approved' | 'pending_verification' | 'rejected';
  approvedByAdmin?: string;
  approvedAt?: string;
  reimbursedToStaff?: boolean;
}

// =============================================================
// FLEET DISPATCH PRO TYPES (3-Party Bookings, Tariffs & Slips)
// =============================================================

export type DutyStatus =
  | 'scheduled'      // नियोजित / आगामी ड्यूटी
  | 'dispatched'     // रवाना (Vehicle & Driver Dispatched)
  | 'active_enroute' // रास्ते में / सवारी के साथ (With Passenger)
  | 'completed'      // ड्यूटी सम्पन्न (Completed / Garage In)
  | 'billed'         // इनवॉइस जारी (Billed to Client)
  | 'settled'        // पूर्ण चुकता (Settled)
  | 'cancelled';     // निरस्त (Cancelled)

export type DutyTypeCategory =
  | 'local_8hr_80km'
  | 'local_12hr_100km'
  | 'outstation'
  | 'airport_station_transfer'
  | 'night_halt_inspection'
  | 'custom_package'
  | 'pending_assignment'; // Package to be determined / assigned later

export interface CustomTariffPackage {
  id: string;
  packageName: string;
  category: DutyTypeCategory;
  baseRate: number;
  baseHours: number;
  baseKm: number;
  extraKmRate: number;
  extraHourRate: number;
  nightHaltRate: number;
  driverWage: number;
  description?: string;
}

export interface DispatcherProfile {
  companyName: string;
  tagline: string;
  gstin: string;
  pan: string;
  address: string;
  supportPhone: string;
  bookingEmail: string;
  bankName?: string;
  bankAccountNo?: string;
  ifscCode?: string;
  upiId?: string;
  dutySlipTerms?: string;
}

export interface ClientDetails {
  id?: string;
  name: string;
  gstin?: string;
  billingAddress: string;
  billingContactPerson?: string;
  billingEmail?: string;
  billingPhone?: string;
}

export interface BookerDetails {
  id?: string;
  name: string;
  phone: string;
  designation?: string;
  officeOrRoom?: string;
}

export interface PassengerDetails {
  id?: string;
  name: string;
  phone: string;
  designation?: string;
  isVIP?: boolean;
  specialRequests?: string;
}

export interface DutyTariff {
  packageType: DutyTypeCategory;
  packageName: string;
  isPendingPackage?: boolean; // True when package is yet to be decided / assigned
  customPackageTitle?: string; // Custom label when packageType is 'custom_package'
  baseRate: number;
  baseHours: number;
  baseKm: number;
  extraKmRate: number;
  extraHourRate: number;
  nightHaltRate: number;
  driverDaRate: number;
  extraKmRun: number;
  extraHoursRun: number;
  extraKmCost: number;
  extraHourCost: number;
  tollParkingAmount: number;
  stateTaxPermitCost: number;
  nightHaltAmount: number;
  grossClientAmount: number;
  gstRatePercent: number;
  gstAmount: number;
  netClientBillable: number;
  driverBaseWage: number;
  driverExtraHoursPay: number;
  driverNightDa: number;
  driverAdvanceDeduction: number;
  netDriverPayable: number;
}

export interface BookingRecord {
  id: string;
  bookingNumber: string;
  tenderId?: string;
  tenderNumber?: string;
  date: string;
  status: DutyStatus;
  client: ClientDetails;
  booker: BookerDetails;
  passenger: PassengerDetails;
  vehicleId?: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleClass: string;
  driverId?: string;
  driverName: string;
  driverPhone: string;
  reportingDate: string;
  reportingTime: string;
  releaseDate?: string;
  releaseTime?: string;
  pickupLocation: string;
  dropLocation: string;
  routeStops?: string;
  garageOutKm: number;
  garageInKm?: number;
  totalKmRun?: number;
  garageOutTime?: string;
  garageInTime?: string;
  totalHoursRun?: number;
  tariff: DutyTariff;
  clientInvoiceNumber?: string;
  clientPaymentStatus: 'unbilled' | 'invoiced' | 'paid' | 'overdue';
  clientPaidAmount?: number;
  driverPaymentStatus: 'pending' | 'partially_paid' | 'settled';
  driverPaidAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedDirectory {
  clients: ClientDetails[];
  bookers: BookerDetails[];
  passengers: PassengerDetails[];
  vehicles: Array<{ vehicleNumber: string; vehicleModel: string; vehicleClass: string }>;
  drivers: Array<{ name: string; phone: string }>;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  speedKmH: number;
  heading: number;
  address: string;
  lastUpdated: string;
  status: 'moving' | 'idle' | 'stopped' | 'sos';
  odometerKm?: number;
}

