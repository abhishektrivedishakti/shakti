import type { Officer as DbOfficer } from '../generated/prisma';
import type { Officer } from '../../src/types';
import { optStr, str } from './bodyParsers';

export function mapDbOfficerToApi(row: DbOfficer): Officer {
  return {
    id: row.id,
    officerCode: row.officerCode ?? undefined,
    name: row.name,
    designation: row.designation,
    department: row.department,
    officeAddress: row.officeAddress,
    mobile: row.mobile,
    alternatePhone: row.alternatePhone ?? undefined,
    email: row.email ?? undefined,
    assignedVehicleId: row.assignedVehicleId ?? undefined,
    currentDriverId: row.currentDriverId ?? undefined,
    tenderId: row.tenderId,
    reportingTime: row.reportingTime,
    status: (row.status as Officer['status']) ?? 'active',
    transferDate: row.transferDate ?? undefined,
    transferOrderNumber: row.transferOrderNumber ?? undefined,
    transferDestination: row.transferDestination ?? undefined,
    specialInstructions: row.specialInstructions ?? undefined,
  };
}

export function officerDataFromBody(body: Record<string, unknown>) {
  return {
    officerCode: optStr(body.officerCode),
    name: str(body.name),
    designation: str(body.designation),
    department: str(body.department),
    officeAddress: str(body.officeAddress),
    mobile: str(body.mobile),
    alternatePhone: optStr(body.alternatePhone),
    email: optStr(body.email),
    assignedVehicleId: optStr(body.assignedVehicleId),
    currentDriverId: optStr(body.currentDriverId),
    tenderId: str(body.tenderId),
    reportingTime: str(body.reportingTime, '09:00 AM') || '09:00 AM',
    status: str(body.status, 'active') || 'active',
    transferDate: optStr(body.transferDate),
    transferOrderNumber: optStr(body.transferOrderNumber),
    transferDestination: optStr(body.transferDestination),
    specialInstructions: optStr(body.specialInstructions),
  };
}
