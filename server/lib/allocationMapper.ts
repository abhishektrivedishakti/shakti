import type {
  DriverAllocationHistory as DbDriverHist,
  VehicleAllocationHistory as DbVehicleHist,
  OfficerAllocationHistory as DbOfficerHist,
} from '../generated/prisma';
import type {
  DriverAllocationHistory,
  OfficerAllocationHistory,
  OfficerTransferReason,
  ReplacementReason,
  VehicleAllocationHistory,
  VehicleReplacementReason,
} from '../../src/types';
import { optStr, str } from './bodyParsers';

export function mapDbDriverAllocToApi(row: DbDriverHist): DriverAllocationHistory {
  return {
    id: row.id,
    driverId: row.driverId,
    driverName: row.driverName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    tenderId: row.tenderId,
    tenderName: row.tenderName,
    officerId: row.officerId,
    officerName: row.officerName,
    assignedDate: row.assignedDate,
    releasedDate: row.releasedDate ?? undefined,
    reasonForChange: row.reasonForChange as ReplacementReason,
    notes: row.notes,
  };
}

export function mapDbVehicleAllocToApi(row: DbVehicleHist): VehicleAllocationHistory {
  return {
    id: row.id,
    tenderId: row.tenderId,
    tenderName: row.tenderName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    makeModel: row.makeModel,
    officerId: row.officerId ?? undefined,
    officerName: row.officerName ?? undefined,
    driverId: row.driverId ?? undefined,
    driverName: row.driverName ?? undefined,
    assignedDate: row.assignedDate,
    releasedDate: row.releasedDate ?? undefined,
    replacementVehicleId: row.replacementVehicleId ?? undefined,
    replacementVehicleNumber: row.replacementVehicleNumber ?? undefined,
    replacementVehicleModel: row.replacementVehicleModel ?? undefined,
    reasonForChange: row.reasonForChange as VehicleReplacementReason,
    notes: row.notes,
    ownershipType: (row.ownershipType as VehicleAllocationHistory['ownershipType']) ?? undefined,
  };
}

export function mapDbOfficerAllocToApi(row: DbOfficerHist): OfficerAllocationHistory {
  return {
    id: row.id,
    tenderId: row.tenderId,
    tenderName: row.tenderName,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    officerId: row.officerId,
    officerName: row.officerName,
    officerDesignation: row.officerDesignation,
    department: row.department,
    assignedDate: row.assignedDate,
    relievedDate: row.relievedDate ?? undefined,
    replacementOfficerId: row.replacementOfficerId ?? undefined,
    replacementOfficerName: row.replacementOfficerName ?? undefined,
    replacementOfficerDesignation: row.replacementOfficerDesignation ?? undefined,
    vehicleAction: row.vehicleAction as OfficerAllocationHistory['vehicleAction'],
    reason: row.reason as OfficerTransferReason,
    transferOrderNumber: row.transferOrderNumber ?? undefined,
    notes: row.notes,
  };
}

export function driverAllocDataFromBody(body: Record<string, unknown>) {
  return {
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    tenderId: str(body.tenderId),
    tenderName: str(body.tenderName),
    officerId: str(body.officerId),
    officerName: str(body.officerName),
    assignedDate: str(body.assignedDate),
    releasedDate: optStr(body.releasedDate),
    reasonForChange: str(body.reasonForChange, 'routine_shift') || 'routine_shift',
    notes: str(body.notes),
  };
}

export function vehicleAllocDataFromBody(body: Record<string, unknown>) {
  return {
    tenderId: str(body.tenderId),
    tenderName: str(body.tenderName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    makeModel: str(body.makeModel),
    officerId: optStr(body.officerId),
    officerName: optStr(body.officerName),
    driverId: optStr(body.driverId),
    driverName: optStr(body.driverName),
    assignedDate: str(body.assignedDate),
    releasedDate: optStr(body.releasedDate),
    replacementVehicleId: optStr(body.replacementVehicleId),
    replacementVehicleNumber: optStr(body.replacementVehicleNumber),
    replacementVehicleModel: optStr(body.replacementVehicleModel),
    reasonForChange: str(body.reasonForChange, 'other') || 'other',
    notes: str(body.notes),
    ownershipType: optStr(body.ownershipType),
  };
}

export function officerAllocDataFromBody(body: Record<string, unknown>) {
  return {
    tenderId: str(body.tenderId),
    tenderName: str(body.tenderName),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    officerId: str(body.officerId),
    officerName: str(body.officerName),
    officerDesignation: str(body.officerDesignation),
    department: str(body.department),
    assignedDate: str(body.assignedDate),
    relievedDate: optStr(body.relievedDate),
    replacementOfficerId: optStr(body.replacementOfficerId),
    replacementOfficerName: optStr(body.replacementOfficerName),
    replacementOfficerDesignation: optStr(body.replacementOfficerDesignation),
    vehicleAction: str(body.vehicleAction, 'halted_idle_post_vacant') || 'halted_idle_post_vacant',
    reason: str(body.reason, 'routine_transfer') || 'routine_transfer',
    transferOrderNumber: optStr(body.transferOrderNumber),
    notes: str(body.notes),
  };
}
