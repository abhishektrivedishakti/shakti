import type { Tender as DbTender } from '../generated/prisma';
import type {
  DocumentAttachment,
  Tender,
  TenderContractType,
  TenderOnCallDefaults,
  TenderVehiclePackage,
} from '../../src/types';
import { asJsonInput } from './jsonInput';

export function mapDbTenderToApi(row: DbTender): Tender {
  return {
    id: row.id,
    tenderNumber: row.tenderNumber,
    workOrderNumber: row.workOrderNumber,
    departmentName: row.departmentName,
    authorityOffice: row.authorityOffice,
    contractPeriodStart: row.contractPeriodStart,
    contractPeriodEnd: row.contractPeriodEnd,
    billingCycleDay: row.billingCycleDay,
    paymentTermsDays: row.paymentTermsDays,
    baseMonthlyRate: row.baseMonthlyRate,
    includedKms: row.includedKms,
    includedHours: row.includedHours,
    extraKmRate: row.extraKmRate,
    extraHourRate: row.extraHourRate,
    nightHaltRate: row.nightHaltRate,
    tollTerms: row.tollTerms as Tender['tollTerms'],
    penaltyClauses: row.penaltyClauses,
    officerDesignationsSummary: row.officerDesignationsSummary,
    status: row.status as Tender['status'],
    contactPerson: row.contactPerson,
    contactPhone: row.contactPhone,
    contactEmail: row.contactEmail ?? undefined,
    billSeriesPrefix: row.billSeriesPrefix ?? undefined,
    emdDetails: row.emdDetails ?? undefined,
    agreementNumber: row.agreementNumber ?? undefined,
    documents: (row.documents as DocumentAttachment[] | null) ?? undefined,
    contractType: (row.contractType as TenderContractType | null) ?? undefined,
    onCallDefaults: (row.onCallDefaults as TenderOnCallDefaults | null) ?? undefined,
    packages: (row.packages as TenderVehiclePackage[] | null) ?? undefined,
  };
}

export function tenderCreateDataFromBody(body: Record<string, unknown>) {
  const num = (v: unknown, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);

  return {
    tenderNumber: str(body.tenderNumber),
    workOrderNumber: str(body.workOrderNumber),
    departmentName: str(body.departmentName),
    authorityOffice: str(body.authorityOffice),
    contractPeriodStart: str(body.contractPeriodStart),
    contractPeriodEnd: str(body.contractPeriodEnd),
    billingCycleDay: num(body.billingCycleDay, 1),
    paymentTermsDays: num(body.paymentTermsDays, 30),
    baseMonthlyRate: num(body.baseMonthlyRate),
    includedKms: num(body.includedKms),
    includedHours: num(body.includedHours),
    extraKmRate: num(body.extraKmRate),
    extraHourRate: num(body.extraHourRate),
    nightHaltRate: num(body.nightHaltRate),
    tollTerms: str(body.tollTerms, 'reimbursable_actuals') || 'reimbursable_actuals',
    penaltyClauses: str(body.penaltyClauses),
    officerDesignationsSummary: str(body.officerDesignationsSummary),
    status: str(body.status, 'active') || 'active',
    contactPerson: str(body.contactPerson),
    contactPhone: str(body.contactPhone),
    contactEmail: typeof body.contactEmail === 'string' && body.contactEmail.trim() ? body.contactEmail.trim() : null,
    billSeriesPrefix:
      typeof body.billSeriesPrefix === 'string' && body.billSeriesPrefix.trim()
        ? body.billSeriesPrefix.trim()
        : null,
    emdDetails: typeof body.emdDetails === 'string' && body.emdDetails.trim() ? body.emdDetails.trim() : null,
    agreementNumber:
      typeof body.agreementNumber === 'string' && body.agreementNumber.trim()
        ? body.agreementNumber.trim()
        : null,
    contractType:
      typeof body.contractType === 'string' && body.contractType.trim() ? body.contractType.trim() : null,
    onCallDefaults: asJsonInput(body.onCallDefaults ?? null),
    packages: asJsonInput(
      Array.isArray(body.packages) ? body.packages : body.packages != null ? body.packages : null
    ),
    documents: asJsonInput(
      Array.isArray(body.documents) ? body.documents : body.documents != null ? body.documents : null
    ),
  };
}
