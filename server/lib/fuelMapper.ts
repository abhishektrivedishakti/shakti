import type {
  FuelPumpVendor as DbPump,
  FuelRecord as DbFuelRecord,
  FuelSlip as DbFuelSlip,
  FuelVendorMonthlyBill as DbFuelBill,
} from '../generated/prisma';
import type {
  FuelPumpVendor,
  FuelRecord,
  FuelSlip,
  FuelVendorBillVehicleSummary,
  FuelVendorMonthlyBill,
} from '../../src/types';
import { num, optNum, optStr, str } from './bodyParsers';
import { asJsonInput } from './jsonInput';

export function mapDbFuelPumpToApi(row: DbPump): FuelPumpVendor {
  return {
    id: row.id,
    name: row.name,
    stationBrand: row.stationBrand as FuelPumpVendor['stationBrand'],
    location: row.location,
    contactPerson: row.contactPerson,
    phone: row.phone,
    alternatePhone: row.alternatePhone ?? undefined,
    panNumber: row.panNumber ?? undefined,
    gstin: row.gstin ?? undefined,
    creditLimit: row.creditLimit ?? undefined,
    billingCycleDay: row.billingCycleDay,
    bankDetails: row.bankDetails ?? undefined,
    isTdsApplicable: row.isTdsApplicable,
    tdsRate: row.tdsRate ?? undefined,
    tdsSection: row.tdsSection ?? undefined,
    tdsExemptionReason: row.tdsExemptionReason ?? undefined,
    status: (row.status as FuelPumpVendor['status']) || 'active',
    notes: row.notes ?? undefined,
  };
}

export function fuelPumpDataFromBody(body: Record<string, unknown>) {
  return {
    name: str(body.name),
    stationBrand: str(body.stationBrand, 'Other') || 'Other',
    location: str(body.location),
    contactPerson: str(body.contactPerson),
    phone: str(body.phone),
    alternatePhone: optStr(body.alternatePhone),
    panNumber: optStr(body.panNumber),
    gstin: optStr(body.gstin),
    creditLimit: optNum(body.creditLimit),
    billingCycleDay: num(body.billingCycleDay, 1),
    bankDetails: optStr(body.bankDetails),
    isTdsApplicable: Boolean(body.isTdsApplicable),
    tdsRate: optNum(body.tdsRate),
    tdsSection: optStr(body.tdsSection),
    tdsExemptionReason: optStr(body.tdsExemptionReason),
    status: str(body.status, 'active') || 'active',
    notes: optStr(body.notes),
  };
}

export function mapDbFuelRecordToApi(row: DbFuelRecord): FuelRecord {
  return {
    id: row.id,
    date: row.date,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    driverId: row.driverId,
    driverName: row.driverName,
    mode: (row.mode as FuelRecord['mode']) || 'slip',
    liters: row.liters,
    ratePerLiter: row.ratePerLiter,
    totalAmount: row.totalAmount,
    odometerKm: row.odometerKm,
    fuelType: (row.fuelType as FuelRecord['fuelType']) || 'Diesel',
    fuelStation: row.fuelStation,
    receiptNumber: row.receiptNumber,
    fullTank: row.fullTank,
    notes: row.notes ?? undefined,
    recordedBy: row.recordedBy ?? undefined,
    fuelSlipId: row.fuelSlipId ?? undefined,
    pumpVendorId: row.pumpVendorId ?? undefined,
  };
}

export function fuelRecordDataFromBody(body: Record<string, unknown>) {
  const liters = num(body.liters);
  const ratePerLiter = num(body.ratePerLiter);
  const totalAmount =
    body.totalAmount !== undefined && body.totalAmount !== null && body.totalAmount !== ''
      ? num(body.totalAmount)
      : Math.round(liters * ratePerLiter * 100) / 100;

  return {
    date: str(body.date),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    mode: str(body.mode, 'slip') || 'slip',
    liters,
    ratePerLiter,
    totalAmount,
    odometerKm: num(body.odometerKm),
    fuelType: str(body.fuelType, 'Diesel') || 'Diesel',
    fuelStation: str(body.fuelStation),
    receiptNumber: str(body.receiptNumber),
    fullTank: Boolean(body.fullTank),
    notes: optStr(body.notes),
    recordedBy: optStr(body.recordedBy),
    fuelSlipId: optStr(body.fuelSlipId),
    pumpVendorId: optStr(body.pumpVendorId),
  };
}

export function mapDbFuelSlipToApi(row: DbFuelSlip): FuelSlip {
  return {
    id: row.id,
    slipNumber: row.slipNumber,
    issueDate: row.issueDate,
    issueTime: row.issueTime ?? undefined,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    vehicleModel: row.vehicleModel ?? undefined,
    driverId: row.driverId,
    driverName: row.driverName,
    driverPhone: row.driverPhone ?? undefined,
    pumpVendorId: row.pumpVendorId,
    pumpVendorName: row.pumpVendorName,
    fuelType: (row.fuelType as FuelSlip['fuelType']) || 'Diesel',
    authorizedQuantityType:
      (row.authorizedQuantityType as FuelSlip['authorizedQuantityType']) || 'liters',
    authorizedValue: row.authorizedValue,
    openingOdometerKm: row.openingOdometerKm ?? undefined,
    issuedBy: row.issuedBy,
    status: (row.status as FuelSlip['status']) || 'issued',
    fillDate: row.fillDate ?? undefined,
    fillTime: row.fillTime ?? undefined,
    actualLiters: row.actualLiters ?? undefined,
    ratePerLiter: row.ratePerLiter ?? undefined,
    totalAmount: row.totalAmount ?? undefined,
    closingOdometerKm: row.closingOdometerKm ?? undefined,
    pumpReceiptNumber: row.pumpReceiptNumber ?? undefined,
    notes: row.notes ?? undefined,
    vendorBillId: row.vendorBillId ?? undefined,
    vendorBillNumber: row.vendorBillNumber ?? undefined,
  };
}

export function fuelSlipDataFromBody(body: Record<string, unknown>) {
  return {
    slipNumber: str(body.slipNumber),
    issueDate: str(body.issueDate),
    issueTime: optStr(body.issueTime),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    vehicleModel: optStr(body.vehicleModel),
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    driverPhone: optStr(body.driverPhone),
    pumpVendorId: str(body.pumpVendorId),
    pumpVendorName: str(body.pumpVendorName),
    fuelType: str(body.fuelType, 'Diesel') || 'Diesel',
    authorizedQuantityType: str(body.authorizedQuantityType, 'liters') || 'liters',
    authorizedValue: num(body.authorizedValue),
    openingOdometerKm: optNum(body.openingOdometerKm),
    issuedBy: str(body.issuedBy),
    status: str(body.status, 'issued') || 'issued',
    fillDate: optStr(body.fillDate),
    fillTime: optStr(body.fillTime),
    actualLiters: optNum(body.actualLiters),
    ratePerLiter: optNum(body.ratePerLiter),
    totalAmount: optNum(body.totalAmount),
    closingOdometerKm: optNum(body.closingOdometerKm),
    pumpReceiptNumber: optStr(body.pumpReceiptNumber),
    notes: optStr(body.notes),
    vendorBillId: optStr(body.vendorBillId),
    vendorBillNumber: optStr(body.vendorBillNumber),
  };
}

function asBreakdown(raw: unknown): FuelVendorBillVehicleSummary[] {
  return Array.isArray(raw) ? (raw as FuelVendorBillVehicleSummary[]) : [];
}

export function mapDbFuelBillToApi(row: DbFuelBill): FuelVendorMonthlyBill {
  return {
    id: row.id,
    billNumber: row.billNumber,
    pumpVendorId: row.pumpVendorId,
    pumpVendorName: row.pumpVendorName,
    monthYear: row.monthYear,
    billDate: row.billDate,
    dueDate: row.dueDate ?? undefined,
    totalLiters: row.totalLiters,
    totalAmount: row.totalAmount,
    discountOrRebate: row.discountOrRebate ?? undefined,
    isTdsApplicable: row.isTdsApplicable,
    tdsRate: row.tdsRate ?? undefined,
    tdsAmount: row.tdsAmount ?? undefined,
    tdsSection: row.tdsSection ?? undefined,
    netPayable: row.netPayable,
    paymentStatus: (row.paymentStatus as FuelVendorMonthlyBill['paymentStatus']) || 'pending',
    paidAmount: row.paidAmount ?? undefined,
    paidDate: row.paidDate ?? undefined,
    paymentMode: (row.paymentMode as FuelVendorMonthlyBill['paymentMode']) || undefined,
    paymentReference: row.paymentReference ?? undefined,
    vehicleBreakdown: asBreakdown(row.vehicleBreakdown),
    reconciledSlipsCount: row.reconciledSlipsCount,
    notes: row.notes ?? undefined,
    verifiedBy: row.verifiedBy ?? undefined,
  };
}

export function fuelBillDataFromBody(body: Record<string, unknown>) {
  const breakdown = Array.isArray(body.vehicleBreakdown) ? body.vehicleBreakdown : null;
  return {
    billNumber: str(body.billNumber),
    pumpVendorId: str(body.pumpVendorId),
    pumpVendorName: str(body.pumpVendorName),
    monthYear: str(body.monthYear),
    billDate: str(body.billDate),
    dueDate: optStr(body.dueDate),
    totalLiters: num(body.totalLiters),
    totalAmount: num(body.totalAmount),
    discountOrRebate: optNum(body.discountOrRebate),
    isTdsApplicable: Boolean(body.isTdsApplicable),
    tdsRate: optNum(body.tdsRate),
    tdsAmount: optNum(body.tdsAmount),
    tdsSection: optStr(body.tdsSection),
    netPayable: num(body.netPayable),
    paymentStatus: str(body.paymentStatus, 'pending') || 'pending',
    paidAmount: optNum(body.paidAmount),
    paidDate: optStr(body.paidDate),
    paymentMode: optStr(body.paymentMode),
    paymentReference: optStr(body.paymentReference),
    vehicleBreakdown: asJsonInput(breakdown),
    reconciledSlipsCount: num(body.reconciledSlipsCount),
    notes: optStr(body.notes),
    verifiedBy: optStr(body.verifiedBy),
  };
}

export function parseLinkedSlipIds(body: Record<string, unknown>): string[] {
  const raw = body.linkedSlipIds ?? body.slipIds ?? body.slips;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      if (typeof v === 'string') return v.trim();
      if (v && typeof v === 'object' && 'id' in v && typeof (v as { id: unknown }).id === 'string') {
        return (v as { id: string }).id.trim();
      }
      return '';
    })
    .filter(Boolean);
}

/** Mark-filled payload helpers (optional fuel record create). */
export function markFilledPatchFromBody(body: Record<string, unknown>) {
  return {
    fillDate: optStr(body.fillDate) || str(body.date) || new Date().toISOString().slice(0, 10),
    fillTime: optStr(body.fillTime),
    actualLiters: optNum(body.actualLiters ?? body.liters),
    ratePerLiter: optNum(body.ratePerLiter),
    totalAmount: optNum(body.totalAmount),
    closingOdometerKm: optNum(body.closingOdometerKm ?? body.odometerKm),
    pumpReceiptNumber: optStr(body.pumpReceiptNumber ?? body.receiptNumber),
    notes: optStr(body.notes),
    createFuelRecord: body.createFuelRecord !== false,
  };
}
