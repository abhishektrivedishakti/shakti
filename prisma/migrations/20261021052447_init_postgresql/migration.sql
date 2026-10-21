-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT 'Staff Member',
    "role" TEXT NOT NULL DEFAULT 'custom',
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "pinHash" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL DEFAULT 'bg-teal-600',
    "status" TEXT NOT NULL DEFAULT 'active',
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tender" (
    "id" TEXT NOT NULL,
    "tenderNumber" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "authorityOffice" TEXT NOT NULL,
    "contractPeriodStart" TEXT NOT NULL,
    "contractPeriodEnd" TEXT NOT NULL,
    "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "baseMonthlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includedKms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHaltRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tollTerms" TEXT NOT NULL DEFAULT 'reimbursable_actuals',
    "penaltyClauses" TEXT NOT NULL DEFAULT '',
    "officerDesignationsSummary" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "contactPerson" TEXT NOT NULL DEFAULT '',
    "contactPhone" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT,
    "billSeriesPrefix" TEXT,
    "emdDetails" TEXT,
    "agreementNumber" TEXT,
    "contractType" TEXT,
    "onCallDefaults" JSONB,
    "packages" JSONB,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tender_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL DEFAULT '',
    "issuingAuthority" TEXT NOT NULL DEFAULT '',
    "issueDate" TEXT NOT NULL,
    "expiryDate" TEXT,
    "isLifetime" BOOLEAN NOT NULL DEFAULT false,
    "alertDaysBefore" INTEGER NOT NULL DEFAULT 30,
    "custodyLocation" TEXT,
    "contactPersonOrAgent" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "fileSize" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "officerCode" TEXT,
    "name" TEXT NOT NULL,
    "designation" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "officeAddress" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "alternatePhone" TEXT,
    "email" TEXT,
    "assignedVehicleId" TEXT,
    "currentDriverId" TEXT,
    "tenderId" TEXT NOT NULL,
    "reportingTime" TEXT NOT NULL DEFAULT '09:00 AM',
    "status" TEXT NOT NULL DEFAULT 'active',
    "transferDate" TEXT,
    "transferOrderNumber" TEXT,
    "transferDestination" TEXT,
    "specialInstructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "driverCode" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "alternatePhone" TEXT,
    "address" TEXT NOT NULL DEFAULT '',
    "licenseNumber" TEXT NOT NULL DEFAULT '',
    "licenseExpiry" TEXT NOT NULL DEFAULT '',
    "badgeNumber" TEXT,
    "policeVerificationDate" TEXT NOT NULL DEFAULT '',
    "policeVerificationExpiry" TEXT NOT NULL DEFAULT '',
    "aadharNumber" TEXT NOT NULL DEFAULT '',
    "panNumber" TEXT,
    "bloodGroup" TEXT,
    "joiningDate" TEXT NOT NULL DEFAULT '',
    "monthlySalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyDaRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentVehicleId" TEXT,
    "fuelPolicy" TEXT NOT NULL DEFAULT 'actual_reimbursement',
    "monthlyFuelBudgetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bankAccountDetails" TEXT,
    "emergencyContact" TEXT,
    "employmentType" TEXT,
    "uanNumber" TEXT,
    "epfMemberId" TEXT,
    "esicIpNumber" TEXT,
    "skillCategory" TEXT,
    "minimumWageBasic" DOUBLE PRECISION,
    "vda" DOUBLE PRECISION,
    "hra" DOUBLE PRECISION,
    "isEpfApplicable" BOOLEAN,
    "isEsicApplicable" BOOLEAN,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL DEFAULT '',
    "vehicleType" TEXT NOT NULL DEFAULT 'Sedan',
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "color" TEXT NOT NULL DEFAULT '',
    "modelYear" INTEGER NOT NULL DEFAULT 2024,
    "ownershipType" TEXT NOT NULL DEFAULT 'Company Owned',
    "registrationType" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "monthlyVendorRent" DOUBLE PRECISION,
    "tenderId" TEXT NOT NULL,
    "tenderPackageId" TEXT,
    "assignedOfficerId" TEXT,
    "assignedOfficerName" TEXT,
    "currentDriverId" TEXT,
    "driverName" TEXT,
    "driverPhone" TEXT,
    "currentOdometer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseDate" TEXT,
    "purchaseCost" DOUBLE PRECISION,
    "financingBank" TEXT,
    "chassisNumber" TEXT,
    "engineNumber" TEXT,
    "lastServiceDate" TEXT,
    "lastServiceKm" DOUBLE PRECISION,
    "nextServiceDueKm" DOUBLE PRECISION,
    "nextServiceDueDate" TEXT,
    "rtoFitnessExpiry" TEXT NOT NULL DEFAULT '',
    "insuranceExpiry" TEXT NOT NULL DEFAULT '',
    "insuranceCompany" TEXT,
    "insurancePolicyNo" TEXT,
    "pucExpiry" TEXT NOT NULL DEFAULT '',
    "roadTaxExpiry" TEXT NOT NULL DEFAULT '',
    "permitExpiry" TEXT NOT NULL DEFAULT '',
    "rcNumber" TEXT,
    "fitnessCertNumber" TEXT,
    "taxReceiptNumber" TEXT,
    "permitNumber" TEXT,
    "permitType" TEXT,
    "fastagId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "idleSinceDate" TEXT,
    "idleReason" TEXT,
    "transferOrderRef" TEXT,
    "fuelPolicy" TEXT NOT NULL DEFAULT 'actual_reimbursement',
    "monthlyFixedFuelAmount" DOUBLE PRECISION,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverAllocationHistory" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL DEFAULT '',
    "tenderName" TEXT NOT NULL DEFAULT '',
    "officerId" TEXT NOT NULL DEFAULT '',
    "officerName" TEXT NOT NULL DEFAULT '',
    "assignedDate" TEXT NOT NULL,
    "releasedDate" TEXT,
    "reasonForChange" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverAllocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAllocationHistory" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL DEFAULT '',
    "tenderName" TEXT NOT NULL DEFAULT '',
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "makeModel" TEXT NOT NULL DEFAULT '',
    "officerId" TEXT,
    "officerName" TEXT,
    "driverId" TEXT,
    "driverName" TEXT,
    "assignedDate" TEXT NOT NULL,
    "releasedDate" TEXT,
    "replacementVehicleId" TEXT,
    "replacementVehicleNumber" TEXT,
    "replacementVehicleModel" TEXT,
    "reasonForChange" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "ownershipType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAllocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerAllocationHistory" (
    "id" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL DEFAULT '',
    "tenderName" TEXT NOT NULL DEFAULT '',
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "officerName" TEXT NOT NULL,
    "officerDesignation" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "assignedDate" TEXT NOT NULL,
    "relievedDate" TEXT,
    "replacementOfficerId" TEXT,
    "replacementOfficerName" TEXT,
    "replacementOfficerDesignation" TEXT,
    "vehicleAction" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "transferOrderNumber" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerAllocationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyLogEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "driverId" TEXT NOT NULL DEFAULT '',
    "driverName" TEXT NOT NULL DEFAULT '',
    "officerId" TEXT NOT NULL DEFAULT '',
    "officerName" TEXT NOT NULL DEFAULT '',
    "tenderId" TEXT NOT NULL DEFAULT '',
    "openingKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "closingKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openingTime" TEXT NOT NULL DEFAULT '',
    "closingTime" TEXT NOT NULL DEFAULT '',
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startLocation" TEXT NOT NULL DEFAULT '',
    "endLocation" TEXT NOT NULL DEFAULT '',
    "purpose" TEXT NOT NULL DEFAULT '',
    "dutyType" TEXT NOT NULL DEFAULT 'local',
    "tollParkingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverDaNightHalt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acUsed" BOOLEAN NOT NULL DEFAULT false,
    "slipNumber" TEXT NOT NULL DEFAULT '',
    "isVerifiedByOfficer" BOOLEAN NOT NULL DEFAULT false,
    "officerRemarks" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "serviceType" TEXT NOT NULL DEFAULT 'other',
    "odometerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "garageName" TEXT NOT NULL DEFAULT '',
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partsReplaced" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "invoiceNumber" TEXT,
    "nextServiceDueKm" DOUBLE PRECISION,
    "nextServiceDueDate" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelPumpVendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stationBrand" TEXT NOT NULL DEFAULT 'Other',
    "location" TEXT NOT NULL DEFAULT '',
    "contactPerson" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "alternatePhone" TEXT,
    "panNumber" TEXT,
    "gstin" TEXT,
    "creditLimit" DOUBLE PRECISION,
    "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
    "bankDetails" TEXT,
    "isTdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "tdsRate" DOUBLE PRECISION,
    "tdsSection" TEXT,
    "tdsExemptionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelPumpVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRecord" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "driverId" TEXT NOT NULL DEFAULT '',
    "driverName" TEXT NOT NULL DEFAULT '',
    "mode" TEXT NOT NULL DEFAULT 'slip',
    "liters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratePerLiter" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "odometerKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "fuelStation" TEXT NOT NULL DEFAULT '',
    "receiptNumber" TEXT NOT NULL DEFAULT '',
    "fullTank" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "recordedBy" TEXT,
    "fuelSlipId" TEXT,
    "pumpVendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelSlip" (
    "id" TEXT NOT NULL,
    "slipNumber" TEXT NOT NULL,
    "issueDate" TEXT NOT NULL,
    "issueTime" TEXT,
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "vehicleModel" TEXT,
    "driverId" TEXT NOT NULL DEFAULT '',
    "driverName" TEXT NOT NULL DEFAULT '',
    "driverPhone" TEXT,
    "pumpVendorId" TEXT NOT NULL,
    "pumpVendorName" TEXT NOT NULL DEFAULT '',
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "authorizedQuantityType" TEXT NOT NULL DEFAULT 'liters',
    "authorizedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openingOdometerKm" DOUBLE PRECISION,
    "issuedBy" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'issued',
    "fillDate" TEXT,
    "fillTime" TEXT,
    "actualLiters" DOUBLE PRECISION,
    "ratePerLiter" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION,
    "closingOdometerKm" DOUBLE PRECISION,
    "pumpReceiptNumber" TEXT,
    "notes" TEXT,
    "vendorBillId" TEXT,
    "vendorBillNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelSlip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelVendorMonthlyBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "pumpVendorId" TEXT NOT NULL,
    "pumpVendorName" TEXT NOT NULL DEFAULT '',
    "monthYear" TEXT NOT NULL,
    "billDate" TEXT NOT NULL,
    "dueDate" TEXT,
    "totalLiters" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountOrRebate" DOUBLE PRECISION,
    "isTdsApplicable" BOOLEAN NOT NULL DEFAULT false,
    "tdsRate" DOUBLE PRECISION,
    "tdsAmount" DOUBLE PRECISION,
    "tdsSection" TEXT,
    "netPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paidAmount" DOUBLE PRECISION,
    "paidDate" TEXT,
    "paymentMode" TEXT,
    "paymentReference" TEXT,
    "vehicleBreakdown" JSONB,
    "reconciledSlipsCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelVendorMonthlyBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillSeriesConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "prefix" TEXT NOT NULL DEFAULT 'ST/BILL/2026-27/',
    "startingNumber" INTEGER NOT NULL DEFAULT 1,
    "currentNumber" INTEGER NOT NULL DEFAULT 1,
    "paddingDigits" INTEGER NOT NULL DEFAULT 3,
    "suffix" TEXT NOT NULL DEFAULT '',
    "includeMonthYear" BOOLEAN NOT NULL DEFAULT false,
    "useTenderPrefix" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillSeriesConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "tenderName" TEXT NOT NULL DEFAULT '',
    "departmentName" TEXT NOT NULL DEFAULT '',
    "officerName" TEXT NOT NULL DEFAULT '',
    "vehicleId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "monthYear" TEXT NOT NULL,
    "billDate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL DEFAULT '',
    "baseAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalKmsRun" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowedKms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKmAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHoursRun" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHourAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHaltsCount" INTEGER NOT NULL DEFAULT 0,
    "nightHaltRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHaltAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tollParkingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penaltyDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penaltyRemarks" TEXT,
    "grossAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gstPercent" DOUBLE PRECISION NOT NULL DEFAULT 12,
    "gstAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsPercent" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPayableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'draft',
    "paymentReceivedDate" TEXT,
    "paymentRemarks" TEXT,
    "voucherNumber" TEXT,
    "referenceVoucher" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverKhataTransaction" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL DEFAULT '',
    "paymentMode" TEXT NOT NULL DEFAULT 'cash',
    "referenceNumber" TEXT,
    "tenderId" TEXT,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT,
    "officerId" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverKhataTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DriverLeaveRecord" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL DEFAULT '',
    "vehicleId" TEXT NOT NULL DEFAULT '',
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "tenderId" TEXT NOT NULL DEFAULT '',
    "tenderName" TEXT,
    "officerId" TEXT,
    "officerName" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "leaveReason" TEXT NOT NULL DEFAULT '',
    "hasSubstitute" BOOLEAN NOT NULL DEFAULT false,
    "substituteDriverType" TEXT,
    "substituteDriverId" TEXT,
    "substituteDriverName" TEXT,
    "substituteDriverPhone" TEXT,
    "dailySubstitutePay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSubstitutePaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "substitutePaymentMode" TEXT,
    "deductFromMainDriverSalary" BOOLEAN NOT NULL DEFAULT false,
    "deductionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverLeaveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyPaymentEntry" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMode" TEXT NOT NULL DEFAULT 'cash',
    "referenceNumber" TEXT,
    "payeeName" TEXT NOT NULL DEFAULT '',
    "payeeType" TEXT NOT NULL DEFAULT 'other',
    "driverId" TEXT,
    "vendorId" TEXT,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "autoRoutedTo" TEXT NOT NULL DEFAULT '',
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyPaymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "vendorCode" TEXT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "alternatePhone" TEXT,
    "panNumber" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT,
    "address" TEXT NOT NULL DEFAULT '',
    "bankAccountDetails" TEXT NOT NULL DEFAULT '',
    "vendorType" TEXT NOT NULL DEFAULT 'fleet_vendor',
    "monthlyAgreedRatePerVehicle" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTdsApplicable" BOOLEAN NOT NULL DEFAULT true,
    "tdsRate" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "tdsSection" TEXT,
    "tdsExemptionReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorSettlement" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL DEFAULT '',
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL DEFAULT '',
    "vehicleId" TEXT NOT NULL DEFAULT '',
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "monthYear" TEXT NOT NULL,
    "settlementDate" TEXT NOT NULL DEFAULT '',
    "agreedBaseRent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKmShare" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionsAdvances" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionsFuelByContractor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionsFastagByContractor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductionsOther" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isTdsApplicable" BOOLEAN NOT NULL DEFAULT true,
    "tdsPercent" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "tdsAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tdsSection" TEXT,
    "tdsExemptionReason" TEXT,
    "netPayableToVendor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'draft',
    "paymentDate" TEXT,
    "paymentRef" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorSettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatutoryPayrollEntry" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "driverName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "uanNumber" TEXT NOT NULL DEFAULT '',
    "esicIpNumber" TEXT NOT NULL DEFAULT '',
    "tenderId" TEXT NOT NULL DEFAULT '',
    "tenderName" TEXT NOT NULL DEFAULT '',
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "monthYear" TEXT NOT NULL,
    "totalMonthDays" INTEGER NOT NULL DEFAULT 30,
    "daysWorked" INTEGER NOT NULL DEFAULT 0,
    "weeklyOffs" INTEGER NOT NULL DEFAULT 0,
    "paidLeave" INTEGER NOT NULL DEFAULT 0,
    "payableDays" INTEGER NOT NULL DEFAULT 0,
    "basicWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vdaWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hraWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "epfEmployee12" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esicEmployee075" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advancesDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEmployeeDeductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netInHandSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "epfEmployer13" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esicEmployer325" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statutoryBonus833" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCtcOutflow" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'draft',
    "salaryPaidDate" TEXT,
    "bankUtr" TEXT,
    "epfTrrnChallan" TEXT,
    "esicChallanNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatutoryPayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyCashTransaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "staffUserName" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "time" TEXT,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "category" TEXT,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT,
    "payeeOrVendor" TEXT,
    "billSlipNumber" TEXT,
    "billPhotoUrl" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "paymentMode" TEXT NOT NULL DEFAULT 'Cash',
    "approvalStatus" TEXT NOT NULL DEFAULT 'pending_verification',
    "approvedByAdmin" TEXT,
    "approvedAt" TEXT,
    "reimbursedToStaff" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PettyCashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchProfile" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "companyName" TEXT NOT NULL DEFAULT 'Shakti Travels and Tours',
    "tagline" TEXT NOT NULL DEFAULT '',
    "gstin" TEXT NOT NULL DEFAULT '',
    "pan" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "supportPhone" TEXT NOT NULL DEFAULT '',
    "bookingEmail" TEXT NOT NULL DEFAULT '',
    "bankName" TEXT,
    "bankAccountNo" TEXT,
    "ifscCode" TEXT,
    "upiId" TEXT,
    "dutySlipTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchDirectory" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "clients" JSONB NOT NULL DEFAULT '[]',
    "bookers" JSONB NOT NULL DEFAULT '[]',
    "passengers" JSONB NOT NULL DEFAULT '[]',
    "vehicles" JSONB NOT NULL DEFAULT '[]',
    "drivers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchTariffPackage" (
    "id" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'custom_package',
    "baseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "baseKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraKmRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHourRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nightHaltRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "driverWage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchTariffPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchBooking" (
    "id" TEXT NOT NULL,
    "bookingNumber" TEXT NOT NULL,
    "tenderId" TEXT,
    "tenderNumber" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "client" JSONB NOT NULL,
    "booker" JSONB NOT NULL,
    "passenger" JSONB NOT NULL,
    "vehicleId" TEXT,
    "vehicleNumber" TEXT NOT NULL DEFAULT '',
    "vehicleModel" TEXT NOT NULL DEFAULT '',
    "vehicleClass" TEXT NOT NULL DEFAULT '',
    "driverId" TEXT,
    "driverName" TEXT NOT NULL DEFAULT '',
    "driverPhone" TEXT NOT NULL DEFAULT '',
    "reportingDate" TEXT NOT NULL,
    "reportingTime" TEXT NOT NULL DEFAULT '',
    "releaseDate" TEXT,
    "releaseTime" TEXT,
    "pickupLocation" TEXT NOT NULL DEFAULT '',
    "dropLocation" TEXT NOT NULL DEFAULT '',
    "routeStops" TEXT,
    "garageOutKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "garageInKm" DOUBLE PRECISION,
    "totalKmRun" DOUBLE PRECISION,
    "garageOutTime" TEXT,
    "garageInTime" TEXT,
    "totalHoursRun" DOUBLE PRECISION,
    "tariff" JSONB NOT NULL,
    "clientInvoiceNumber" TEXT,
    "clientPaymentStatus" TEXT NOT NULL DEFAULT 'unbilled',
    "clientPaidAmount" DOUBLE PRECISION,
    "driverPaymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "driverPaidAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispatchBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE INDEX "Tender_status_idx" ON "Tender"("status");

-- CreateIndex
CREATE INDEX "Tender_tenderNumber_idx" ON "Tender"("tenderNumber");

-- CreateIndex
CREATE INDEX "CompanyDocument_category_idx" ON "CompanyDocument"("category");

-- CreateIndex
CREATE INDEX "CompanyDocument_expiryDate_idx" ON "CompanyDocument"("expiryDate");

-- CreateIndex
CREATE INDEX "Officer_tenderId_idx" ON "Officer"("tenderId");

-- CreateIndex
CREATE INDEX "Officer_status_idx" ON "Officer"("status");

-- CreateIndex
CREATE INDEX "Officer_mobile_idx" ON "Officer"("mobile");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Driver_phone_idx" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "Driver_licenseNumber_idx" ON "Driver"("licenseNumber");

-- CreateIndex
CREATE INDEX "Vehicle_tenderId_idx" ON "Vehicle"("tenderId");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_ownershipType_idx" ON "Vehicle"("ownershipType");

-- CreateIndex
CREATE INDEX "Vehicle_vehicleNumber_idx" ON "Vehicle"("vehicleNumber");

-- CreateIndex
CREATE INDEX "DriverAllocationHistory_vehicleId_idx" ON "DriverAllocationHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "DriverAllocationHistory_driverId_idx" ON "DriverAllocationHistory"("driverId");

-- CreateIndex
CREATE INDEX "DriverAllocationHistory_tenderId_idx" ON "DriverAllocationHistory"("tenderId");

-- CreateIndex
CREATE INDEX "VehicleAllocationHistory_vehicleId_idx" ON "VehicleAllocationHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleAllocationHistory_tenderId_idx" ON "VehicleAllocationHistory"("tenderId");

-- CreateIndex
CREATE INDEX "OfficerAllocationHistory_vehicleId_idx" ON "OfficerAllocationHistory"("vehicleId");

-- CreateIndex
CREATE INDEX "OfficerAllocationHistory_officerId_idx" ON "OfficerAllocationHistory"("officerId");

-- CreateIndex
CREATE INDEX "OfficerAllocationHistory_tenderId_idx" ON "OfficerAllocationHistory"("tenderId");

-- CreateIndex
CREATE INDEX "DailyLogEntry_date_idx" ON "DailyLogEntry"("date");

-- CreateIndex
CREATE INDEX "DailyLogEntry_vehicleId_idx" ON "DailyLogEntry"("vehicleId");

-- CreateIndex
CREATE INDEX "DailyLogEntry_tenderId_idx" ON "DailyLogEntry"("tenderId");

-- CreateIndex
CREATE INDEX "DailyLogEntry_driverId_idx" ON "DailyLogEntry"("driverId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_date_idx" ON "MaintenanceRecord"("date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_idx" ON "MaintenanceRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_serviceType_idx" ON "MaintenanceRecord"("serviceType");

-- CreateIndex
CREATE INDEX "FuelPumpVendor_status_idx" ON "FuelPumpVendor"("status");

-- CreateIndex
CREATE INDEX "FuelPumpVendor_name_idx" ON "FuelPumpVendor"("name");

-- CreateIndex
CREATE INDEX "FuelRecord_date_idx" ON "FuelRecord"("date");

-- CreateIndex
CREATE INDEX "FuelRecord_vehicleId_idx" ON "FuelRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelRecord_fuelSlipId_idx" ON "FuelRecord"("fuelSlipId");

-- CreateIndex
CREATE INDEX "FuelRecord_pumpVendorId_idx" ON "FuelRecord"("pumpVendorId");

-- CreateIndex
CREATE INDEX "FuelSlip_status_idx" ON "FuelSlip"("status");

-- CreateIndex
CREATE INDEX "FuelSlip_issueDate_idx" ON "FuelSlip"("issueDate");

-- CreateIndex
CREATE INDEX "FuelSlip_vehicleId_idx" ON "FuelSlip"("vehicleId");

-- CreateIndex
CREATE INDEX "FuelSlip_pumpVendorId_idx" ON "FuelSlip"("pumpVendorId");

-- CreateIndex
CREATE INDEX "FuelSlip_slipNumber_idx" ON "FuelSlip"("slipNumber");

-- CreateIndex
CREATE INDEX "FuelVendorMonthlyBill_pumpVendorId_idx" ON "FuelVendorMonthlyBill"("pumpVendorId");

-- CreateIndex
CREATE INDEX "FuelVendorMonthlyBill_monthYear_idx" ON "FuelVendorMonthlyBill"("monthYear");

-- CreateIndex
CREATE INDEX "FuelVendorMonthlyBill_paymentStatus_idx" ON "FuelVendorMonthlyBill"("paymentStatus");

-- CreateIndex
CREATE INDEX "FuelVendorMonthlyBill_billNumber_idx" ON "FuelVendorMonthlyBill"("billNumber");

-- CreateIndex
CREATE INDEX "MonthlyBill_tenderId_idx" ON "MonthlyBill"("tenderId");

-- CreateIndex
CREATE INDEX "MonthlyBill_vehicleId_idx" ON "MonthlyBill"("vehicleId");

-- CreateIndex
CREATE INDEX "MonthlyBill_monthYear_idx" ON "MonthlyBill"("monthYear");

-- CreateIndex
CREATE INDEX "MonthlyBill_paymentStatus_idx" ON "MonthlyBill"("paymentStatus");

-- CreateIndex
CREATE INDEX "MonthlyBill_billNumber_idx" ON "MonthlyBill"("billNumber");

-- CreateIndex
CREATE INDEX "DriverKhataTransaction_driverId_idx" ON "DriverKhataTransaction"("driverId");

-- CreateIndex
CREATE INDEX "DriverKhataTransaction_date_idx" ON "DriverKhataTransaction"("date");

-- CreateIndex
CREATE INDEX "DriverKhataTransaction_type_idx" ON "DriverKhataTransaction"("type");

-- CreateIndex
CREATE INDEX "DriverLeaveRecord_driverId_idx" ON "DriverLeaveRecord"("driverId");

-- CreateIndex
CREATE INDEX "DriverLeaveRecord_startDate_idx" ON "DriverLeaveRecord"("startDate");

-- CreateIndex
CREATE INDEX "DriverLeaveRecord_vehicleId_idx" ON "DriverLeaveRecord"("vehicleId");

-- CreateIndex
CREATE INDEX "DailyPaymentEntry_date_idx" ON "DailyPaymentEntry"("date");

-- CreateIndex
CREATE INDEX "DailyPaymentEntry_category_idx" ON "DailyPaymentEntry"("category");

-- CreateIndex
CREATE INDEX "DailyPaymentEntry_driverId_idx" ON "DailyPaymentEntry"("driverId");

-- CreateIndex
CREATE INDEX "DailyPaymentEntry_vendorId_idx" ON "DailyPaymentEntry"("vendorId");

-- CreateIndex
CREATE INDEX "DailyPaymentEntry_vehicleId_idx" ON "DailyPaymentEntry"("vehicleId");

-- CreateIndex
CREATE INDEX "Vendor_status_idx" ON "Vendor"("status");

-- CreateIndex
CREATE INDEX "Vendor_vendorType_idx" ON "Vendor"("vendorType");

-- CreateIndex
CREATE INDEX "Vendor_vendorCode_idx" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE INDEX "VendorSettlement_vendorId_idx" ON "VendorSettlement"("vendorId");

-- CreateIndex
CREATE INDEX "VendorSettlement_monthYear_idx" ON "VendorSettlement"("monthYear");

-- CreateIndex
CREATE INDEX "VendorSettlement_paymentStatus_idx" ON "VendorSettlement"("paymentStatus");

-- CreateIndex
CREATE INDEX "VendorSettlement_vehicleId_idx" ON "VendorSettlement"("vehicleId");

-- CreateIndex
CREATE INDEX "StatutoryPayrollEntry_driverId_idx" ON "StatutoryPayrollEntry"("driverId");

-- CreateIndex
CREATE INDEX "StatutoryPayrollEntry_monthYear_idx" ON "StatutoryPayrollEntry"("monthYear");

-- CreateIndex
CREATE INDEX "StatutoryPayrollEntry_paymentStatus_idx" ON "StatutoryPayrollEntry"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "StatutoryPayrollEntry_driverId_monthYear_key" ON "StatutoryPayrollEntry"("driverId", "monthYear");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_staffUserId_idx" ON "PettyCashTransaction"("staffUserId");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_date_idx" ON "PettyCashTransaction"("date");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_type_idx" ON "PettyCashTransaction"("type");

-- CreateIndex
CREATE INDEX "PettyCashTransaction_approvalStatus_idx" ON "PettyCashTransaction"("approvalStatus");

-- CreateIndex
CREATE INDEX "DispatchTariffPackage_category_idx" ON "DispatchTariffPackage"("category");

-- CreateIndex
CREATE INDEX "DispatchBooking_bookingNumber_idx" ON "DispatchBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "DispatchBooking_date_idx" ON "DispatchBooking"("date");

-- CreateIndex
CREATE INDEX "DispatchBooking_status_idx" ON "DispatchBooking"("status");

-- CreateIndex
CREATE INDEX "DispatchBooking_reportingDate_idx" ON "DispatchBooking"("reportingDate");

-- CreateIndex
CREATE INDEX "DispatchBooking_vehicleNumber_idx" ON "DispatchBooking"("vehicleNumber");

-- CreateIndex
CREATE INDEX "DispatchBooking_clientPaymentStatus_idx" ON "DispatchBooking"("clientPaymentStatus");

-- CreateIndex
CREATE INDEX "DispatchBooking_driverPaymentStatus_idx" ON "DispatchBooking"("driverPaymentStatus");
