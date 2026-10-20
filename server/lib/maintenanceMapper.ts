import type { MaintenanceRecord as DbMaint } from '../generated/prisma';
import type { MaintenanceRecord, ServiceType } from '../../src/types';
import { num, optNum, optStr, str } from './bodyParsers';

export function mapDbMaintenanceToApi(row: DbMaint): MaintenanceRecord {
  return {
    id: row.id,
    date: row.date,
    vehicleId: row.vehicleId,
    vehicleNumber: row.vehicleNumber,
    serviceType: row.serviceType as ServiceType,
    odometerKm: row.odometerKm,
    garageName: row.garageName,
    cost: row.cost,
    partsReplaced: row.partsReplaced ?? undefined,
    description: row.description,
    invoiceNumber: row.invoiceNumber ?? undefined,
    nextServiceDueKm: row.nextServiceDueKm ?? undefined,
    nextServiceDueDate: row.nextServiceDueDate ?? undefined,
    recordedBy: row.recordedBy ?? undefined,
  };
}

export function maintenanceDataFromBody(body: Record<string, unknown>) {
  return {
    date: str(body.date),
    vehicleId: str(body.vehicleId),
    vehicleNumber: str(body.vehicleNumber),
    serviceType: str(body.serviceType, 'other') || 'other',
    odometerKm: num(body.odometerKm),
    garageName: str(body.garageName),
    cost: num(body.cost),
    partsReplaced: optStr(body.partsReplaced),
    description: str(body.description),
    invoiceNumber: optStr(body.invoiceNumber),
    nextServiceDueKm: optNum(body.nextServiceDueKm),
    nextServiceDueDate: optStr(body.nextServiceDueDate),
    recordedBy: optStr(body.recordedBy),
  };
}
