import type { DailyLogEntry as DbLog } from '../generated/prisma';
import type { DailyLogEntry, DutyType } from '../../src/types';
import { num, optStr, str } from './bodyParsers';

export function mapDbDailyLogToApi(row: DbLog): DailyLogEntry {
  return {
    id: row.id,
    date: row.date,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    driverId: row.driverId,
    driverName: row.driverName,
    officerId: row.officerId,
    officerName: row.officerName,
    tenderId: row.tenderId,
    openingKm: row.openingKm,
    closingKm: row.closingKm,
    totalKm: row.totalKm,
    openingTime: row.openingTime,
    closingTime: row.closingTime,
    totalHours: row.totalHours,
    startLocation: row.startLocation,
    endLocation: row.endLocation,
    purpose: row.purpose,
    dutyType: row.dutyType as DutyType,
    tollParkingCost: row.tollParkingCost,
    driverDaNightHalt: row.driverDaNightHalt,
    acUsed: row.acUsed,
    slipNumber: row.slipNumber,
    isVerifiedByOfficer: row.isVerifiedByOfficer,
    officerRemarks: row.officerRemarks ?? undefined,
    recordedBy: row.recordedBy ?? undefined,
  };
}

export function dailyLogDataFromBody(body: Record<string, unknown>) {
  const openingKm = num(body.openingKm);
  const closingKm = num(body.closingKm);
  const totalKm =
    body.totalKm !== undefined && body.totalKm !== null && body.totalKm !== ''
      ? num(body.totalKm)
      : Math.max(0, closingKm - openingKm);

  return {
    date: str(body.date),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    driverId: str(body.driverId),
    driverName: str(body.driverName),
    officerId: str(body.officerId),
    officerName: str(body.officerName),
    tenderId: str(body.tenderId),
    openingKm,
    closingKm,
    totalKm,
    openingTime: str(body.openingTime),
    closingTime: str(body.closingTime),
    totalHours: num(body.totalHours),
    startLocation: str(body.startLocation),
    endLocation: str(body.endLocation),
    purpose: str(body.purpose),
    dutyType: str(body.dutyType, 'local') || 'local',
    tollParkingCost: num(body.tollParkingCost),
    driverDaNightHalt: num(body.driverDaNightHalt),
    acUsed: Boolean(body.acUsed),
    slipNumber: str(body.slipNumber),
    isVerifiedByOfficer: Boolean(body.isVerifiedByOfficer),
    officerRemarks: optStr(body.officerRemarks),
    recordedBy: optStr(body.recordedBy),
  };
}
