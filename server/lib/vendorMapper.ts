import type {
  Vendor as DbVendor,
  VendorSettlement as DbSettlement,
} from '../generated/prisma';
import type { Vendor, VendorSettlement } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export function mapDbVendorToApi(row: DbVendor): Vendor {
  return {
    id: row.id,
    vendorCode: row.vendorCode ?? undefined,
    name: row.name,
    contactPerson: row.contactPerson,
    phone: row.phone,
    alternatePhone: row.alternatePhone ?? undefined,
    panNumber: row.panNumber,
    gstin: row.gstin ?? undefined,
    address: row.address,
    bankAccountDetails: row.bankAccountDetails,
    vendorType: (row.vendorType as Vendor['vendorType']) || 'fleet_vendor',
    monthlyAgreedRatePerVehicle: row.monthlyAgreedRatePerVehicle,
    isTdsApplicable: row.isTdsApplicable,
    tdsRate: row.tdsRate,
    tdsSection: row.tdsSection ?? undefined,
    tdsExemptionReason: row.tdsExemptionReason ?? undefined,
    status: (row.status as Vendor['status']) || 'active',
    notes: row.notes ?? undefined,
  };
}

export function vendorDataFromBody(body: Record<string, unknown>) {
  const vendorType = str(body.vendorType, 'fleet_vendor') || 'fleet_vendor';
  const status = str(body.status, 'active') || 'active';
  return {
    vendorCode: optStr(body.vendorCode),
    name: str(body.name),
    contactPerson: str(body.contactPerson),
    phone: str(body.phone),
    alternatePhone: optStr(body.alternatePhone),
    panNumber: str(body.panNumber),
    gstin: optStr(body.gstin),
    address: str(body.address),
    bankAccountDetails: str(body.bankAccountDetails),
    vendorType:
      vendorType === 'owner_driver' || vendorType === 'fuel_vendor' ? vendorType : 'fleet_vendor',
    monthlyAgreedRatePerVehicle: num(body.monthlyAgreedRatePerVehicle),
    isTdsApplicable: body.isTdsApplicable !== false && body.isTdsApplicable !== 0,
    tdsRate: num(body.tdsRate, 1),
    tdsSection: optStr(body.tdsSection),
    tdsExemptionReason: optStr(body.tdsExemptionReason),
    status: status === 'inactive' ? 'inactive' : 'active',
    notes: optStr(body.notes),
  };
}

export function mapDbVendorSettlementToApi(row: DbSettlement): VendorSettlement {
  return {
    id: row.id,
    voucherNumber: row.voucherNumber,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    monthYear: row.monthYear,
    settlementDate: row.settlementDate,
    agreedBaseRent: row.agreedBaseRent,
    extraKmShare: row.extraKmShare,
    totalEarned: row.totalEarned,
    deductionsAdvances: row.deductionsAdvances,
    deductionsFuelByContractor: row.deductionsFuelByContractor,
    deductionsFastagByContractor: row.deductionsFastagByContractor,
    deductionsOther: row.deductionsOther,
    isTdsApplicable: row.isTdsApplicable,
    tdsPercent: row.tdsPercent,
    tdsAmount: row.tdsAmount,
    tdsSection: row.tdsSection ?? undefined,
    tdsExemptionReason: row.tdsExemptionReason ?? undefined,
    netPayableToVendor: row.netPayableToVendor,
    paymentStatus: (row.paymentStatus as VendorSettlement['paymentStatus']) || 'draft',
    paymentDate: row.paymentDate ?? undefined,
    paymentRef: row.paymentRef ?? undefined,
    remarks: row.remarks ?? undefined,
  };
}

export function vendorSettlementDataFromBody(body: Record<string, unknown>) {
  const paymentStatus = str(body.paymentStatus, 'draft') || 'draft';
  return {
    voucherNumber: str(body.voucherNumber),
    vendorId: str(body.vendorId),
    vendorName: str(body.vendorName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    monthYear: str(body.monthYear),
    settlementDate: str(body.settlementDate),
    agreedBaseRent: num(body.agreedBaseRent),
    extraKmShare: num(body.extraKmShare),
    totalEarned: num(body.totalEarned),
    deductionsAdvances: num(body.deductionsAdvances),
    deductionsFuelByContractor: num(body.deductionsFuelByContractor),
    deductionsFastagByContractor: num(body.deductionsFastagByContractor),
    deductionsOther: num(body.deductionsOther),
    isTdsApplicable: body.isTdsApplicable !== false && body.isTdsApplicable !== 0,
    tdsPercent: num(body.tdsPercent),
    tdsAmount: num(body.tdsAmount),
    tdsSection: optStr(body.tdsSection),
    tdsExemptionReason: optStr(body.tdsExemptionReason),
    netPayableToVendor: num(body.netPayableToVendor),
    paymentStatus:
      paymentStatus === 'approved' || paymentStatus === 'paid' ? paymentStatus : 'draft',
    paymentDate: optStr(body.paymentDate),
    paymentRef: optStr(body.paymentRef),
    remarks: optStr(body.remarks),
  };
}
