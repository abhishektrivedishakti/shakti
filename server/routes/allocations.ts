import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import {
  sendBadRequest,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/apiResponse';
import { canEditModule, canViewModule } from '../lib/moduleAccess';
import {
  driverAllocDataFromBody,
  mapDbDriverAllocToApi,
  mapDbOfficerAllocToApi,
  mapDbVehicleAllocToApi,
  officerAllocDataFromBody,
  vehicleAllocDataFromBody,
} from '../lib/allocationMapper';
import { mapDbDriverToApi } from '../lib/driverMapper';
import { mapDbOfficerToApi } from '../lib/officerMapper';
import { mapDbVehicleToApi, vehicleDataFromBody } from '../lib/vehicleMapper';
import { optStr, str } from '../lib/bodyParsers';
import { withBulkTransaction } from '../lib/batchWork';

export const allocationsRouter = Router();

allocationsRouter.get('/drivers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const driverId = typeof req.query.driverId === 'string' ? req.query.driverId.trim() : '';
    const rows = await prisma.driverAllocationHistory.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(driverId ? { driverId } : {}),
      },
      orderBy: { assignedDate: 'desc' },
    });
    return sendSuccess(res, { history: rows.map(mapDbDriverAllocToApi) });
  } catch (err) {
    console.error('GET /api/allocations/drivers:', err);
    return sendError(res, 500, 'Could not load driver allocations.');
  }
});

allocationsRouter.get('/vehicles', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const tenderId = typeof req.query.tenderId === 'string' ? req.query.tenderId.trim() : '';
    const rows = await prisma.vehicleAllocationHistory.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(tenderId ? { tenderId } : {}),
      },
      orderBy: { assignedDate: 'desc' },
    });
    return sendSuccess(res, { history: rows.map(mapDbVehicleAllocToApi) });
  } catch (err) {
    console.error('GET /api/allocations/vehicles:', err);
    return sendError(res, 500, 'Could not load vehicle allocations.');
  }
});

allocationsRouter.get('/officers', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'vehicles_officers')) return sendForbidden(res);
    const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId.trim() : '';
    const officerId = typeof req.query.officerId === 'string' ? req.query.officerId.trim() : '';
    const rows = await prisma.officerAllocationHistory.findMany({
      where: {
        ...(vehicleId ? { vehicleId } : {}),
        ...(officerId ? { officerId } : {}),
      },
      orderBy: { assignedDate: 'desc' },
    });
    return sendSuccess(res, { history: rows.map(mapDbOfficerAllocToApi) });
  } catch (err) {
    console.error('GET /api/allocations/officers:', err);
    return sendError(res, 500, 'Could not load officer allocations.');
  }
});

allocationsRouter.post('/bulk-import', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const drivers = Array.isArray(body.drivers) ? body.drivers : [];
    const vehicles = Array.isArray(body.vehicles) ? body.vehicles : [];
    const officers = Array.isArray(body.officers) ? body.officers : [];

    const { driverCount, vehicleCount, officerCount, dHist, vHist, oHist } =
      await withBulkTransaction(async (tx) => {
        let driverCount = 0;
        let vehicleCount = 0;
        let officerCount = 0;

        for (const item of drivers) {
          if (!item || typeof item !== 'object') continue;
          const raw = item as Record<string, unknown>;
          const data = driverAllocDataFromBody(raw);
          if (!data.driverId || !data.vehicleId) continue;
          const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
          try {
            await tx.driverAllocationHistory.create({ data: id ? { id, ...data } : data });
            driverCount += 1;
          } catch {
            /* skip dup */
          }
        }
        for (const item of vehicles) {
          if (!item || typeof item !== 'object') continue;
          const raw = item as Record<string, unknown>;
          const data = vehicleAllocDataFromBody(raw);
          if (!data.vehicleId) continue;
          const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
          try {
            await tx.vehicleAllocationHistory.create({ data: id ? { id, ...data } : data });
            vehicleCount += 1;
          } catch {
            /* skip dup */
          }
        }
        for (const item of officers) {
          if (!item || typeof item !== 'object') continue;
          const raw = item as Record<string, unknown>;
          const data = officerAllocDataFromBody(raw);
          if (!data.vehicleId || !data.officerId) continue;
          const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : undefined;
          try {
            await tx.officerAllocationHistory.create({ data: id ? { id, ...data } : data });
            officerCount += 1;
          } catch {
            /* skip dup */
          }
        }

        const [dHist, vHist, oHist] = await Promise.all([
          tx.driverAllocationHistory.findMany({ orderBy: { assignedDate: 'desc' } }),
          tx.vehicleAllocationHistory.findMany({ orderBy: { assignedDate: 'desc' } }),
          tx.officerAllocationHistory.findMany({ orderBy: { assignedDate: 'desc' } }),
        ]);
        return { driverCount, vehicleCount, officerCount, dHist, vHist, oHist };
      });

    return sendSuccess(
      res,
      {
        imported: { drivers: driverCount, vehicles: vehicleCount, officers: officerCount },
        drivers: dHist.map(mapDbDriverAllocToApi),
        vehicles: vHist.map(mapDbVehicleAllocToApi),
        officers: oHist.map(mapDbOfficerAllocToApi),
      },
      201
    );
  } catch (err) {
    console.error('POST /api/allocations/bulk-import:', err);
    return sendError(res, 500, 'Allocation bulk import failed.');
  }
});

allocationsRouter.post('/replace-driver', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vehicleId = str(body.vehicleId);
    const newDriverId = str(body.newDriverId);
    const reason = str(body.reason, 'routine_shift') || 'routine_shift';
    const effectiveDate = str(body.effectiveDate) || new Date().toISOString().slice(0, 10);
    const notes = str(body.notes);

    if (!vehicleId || !newDriverId) {
      return sendBadRequest(res, 'vehicleId and newDriverId are required.');
    }

    const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!veh) return sendNotFound(res, 'Vehicle not found.');
    const newDriver = await prisma.driver.findUnique({ where: { id: newDriverId } });
    if (!newDriver) return sendNotFound(res, 'New driver not found.');

    const oldDriverId = veh.currentDriverId;
    const oldDriver = oldDriverId
      ? await prisma.driver.findUnique({ where: { id: oldDriverId } })
      : null;
    const tender = veh.tenderId
      ? await prisma.tender.findUnique({ where: { id: veh.tenderId } })
      : null;
    const officer = veh.assignedOfficerId
      ? await prisma.officer.findUnique({ where: { id: veh.assignedOfficerId } })
      : null;

    await prisma.driverAllocationHistory.updateMany({
      where: { vehicleId, releasedDate: null },
      data: { releasedDate: effectiveDate },
    });

    const historyRow = await prisma.driverAllocationHistory.create({
      data: {
        driverId: newDriverId,
        driverName: newDriver.name,
        vehicleId,
        vehicleNumber: veh.vehicleNumber,
        tenderId: tender?.id || veh.tenderId || '',
        tenderName: tender?.departmentName || 'Govt Tender',
        officerId: officer?.id || '',
        officerName: officer?.name || 'Officer',
        assignedDate: effectiveDate,
        reasonForChange: reason,
        notes: notes || `Assigned to replace ${oldDriver?.name || 'previous driver'}`,
      },
    });

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        currentDriverId: newDriverId,
        driverName: newDriver.name,
        driverPhone: newDriver.phone,
      },
    });

    if (oldDriverId && oldDriverId !== newDriverId) {
      await prisma.driver.update({
        where: { id: oldDriverId },
        data: { currentVehicleId: null },
      });
    }
    const updatedNewDriver = await prisma.driver.update({
      where: { id: newDriverId },
      data: { currentVehicleId: vehicleId },
    });

    let updatedOfficer = officer;
    if (officer) {
      updatedOfficer = await prisma.officer.update({
        where: { id: officer.id },
        data: { currentDriverId: newDriverId },
      });
    }

    const updatedOldDriver = oldDriverId
      ? await prisma.driver.findUnique({ where: { id: oldDriverId } })
      : null;

    return sendSuccess(res, {
      allocation: mapDbDriverAllocToApi(historyRow),
      vehicle: mapDbVehicleToApi(updatedVehicle),
      drivers: [
        ...(updatedOldDriver ? [mapDbDriverToApi(updatedOldDriver)] : []),
        mapDbDriverToApi(updatedNewDriver),
      ],
      officer: updatedOfficer ? mapDbOfficerToApi(updatedOfficer) : null,
    });
  } catch (err) {
    console.error('POST /api/allocations/replace-driver:', err);
    return sendError(res, 500, 'Could not replace driver.');
  }
});

allocationsRouter.post('/replace-vehicle', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const tenderId = str(body.tenderId);
    const oldVehicleId = str(body.oldVehicleId);
    const reason = str(body.reason, 'other') || 'other';
    const effectiveDate = str(body.effectiveDate) || new Date().toISOString().slice(0, 10);
    const notes = str(body.notes);
    const transferDriverAndOfficer = body.transferDriverAndOfficer !== false;
    const newVehicleData = (body.newVehicle || body.newVehicleData || {}) as Record<string, unknown>;

    if (!oldVehicleId) return sendBadRequest(res, 'oldVehicleId is required.');
    if (!str(newVehicleData.vehicleNumber) && !str(newVehicleData.id)) {
      return sendBadRequest(res, 'Provide newVehicle with vehicleNumber or existing id.');
    }

    const oldVeh = await prisma.vehicle.findUnique({ where: { id: oldVehicleId } });
    if (!oldVeh) return sendNotFound(res, 'Old vehicle not found.');

    const resolvedTenderId = tenderId || oldVeh.tenderId;
    const tender = await prisma.tender.findUnique({ where: { id: resolvedTenderId } });
    const officer = oldVeh.assignedOfficerId
      ? await prisma.officer.findUnique({ where: { id: oldVeh.assignedOfficerId } })
      : null;
    const driver = oldVeh.currentDriverId
      ? await prisma.driver.findUnique({ where: { id: oldVeh.currentDriverId } })
      : null;

    await prisma.vehicleAllocationHistory.updateMany({
      where: { vehicleId: oldVehicleId, releasedDate: null },
      data: {
        releasedDate: effectiveDate,
        replacementVehicleNumber: str(newVehicleData.vehicleNumber) || undefined,
        replacementVehicleModel: str(newVehicleData.makeModel) || undefined,
      },
    });

    let targetId = str(newVehicleData.id);
    let targetVehicle = targetId
      ? await prisma.vehicle.findUnique({ where: { id: targetId } })
      : null;

    if (!targetVehicle) {
      const createPayload = vehicleDataFromBody({
        ...newVehicleData,
        tenderId: resolvedTenderId,
        status: 'active',
        fuelPolicy: oldVeh.fuelPolicy,
        monthlyFixedFuelAmount: oldVeh.monthlyFixedFuelAmount,
        assignedOfficerId: transferDriverAndOfficer ? officer?.id : undefined,
        assignedOfficerName: transferDriverAndOfficer ? officer?.name : undefined,
        currentDriverId: transferDriverAndOfficer ? driver?.id : undefined,
        driverName: transferDriverAndOfficer ? driver?.name : undefined,
        driverPhone: transferDriverAndOfficer ? driver?.phone : undefined,
        rtoFitnessExpiry: str(newVehicleData.rtoFitnessExpiry, '2028-03-31'),
        insuranceExpiry: str(newVehicleData.insuranceExpiry, '2027-04-15'),
        pucExpiry: str(newVehicleData.pucExpiry, '2026-12-31'),
        roadTaxExpiry: str(newVehicleData.roadTaxExpiry, '2028-12-31'),
        permitExpiry: str(newVehicleData.permitExpiry, '2028-06-30'),
        currentOdometer: newVehicleData.currentOdometer ?? 15000,
        color: str(newVehicleData.color, 'White') || 'White',
        modelYear: newVehicleData.modelYear ?? 2025,
        ownershipType: str(newVehicleData.ownershipType, 'Attached / Market Hire'),
      });
      targetId = targetId || `veh-${Date.now()}`;
      targetVehicle = await prisma.vehicle.create({
        data: { id: targetId, ...createPayload },
      });
    } else {
      targetVehicle = await prisma.vehicle.update({
        where: { id: targetVehicle.id },
        data: {
          tenderId: resolvedTenderId,
          status: 'active',
          assignedOfficerId: transferDriverAndOfficer ? officer?.id ?? null : targetVehicle.assignedOfficerId,
          assignedOfficerName: transferDriverAndOfficer
            ? officer?.name ?? null
            : targetVehicle.assignedOfficerName,
          currentDriverId: transferDriverAndOfficer ? driver?.id ?? null : targetVehicle.currentDriverId,
          driverName: transferDriverAndOfficer ? driver?.name ?? null : targetVehicle.driverName,
          driverPhone: transferDriverAndOfficer ? driver?.phone ?? null : targetVehicle.driverPhone,
        },
      });
      targetId = targetVehicle.id;
    }

    const updatedOld = await prisma.vehicle.update({
      where: { id: oldVehicleId },
      data: {
        assignedOfficerId: null,
        assignedOfficerName: null,
        currentDriverId: null,
        driverName: null,
        driverPhone: null,
        status: 'idle',
        idleSinceDate: effectiveDate,
        idleReason: notes || `Replaced by ${targetVehicle.vehicleNumber}`,
      },
    });

    if (officer && transferDriverAndOfficer) {
      await prisma.officer.update({
        where: { id: officer.id },
        data: { assignedVehicleId: targetId },
      });
    }
    if (driver && transferDriverAndOfficer) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { currentVehicleId: targetId },
      });
    }

    const historyRow = await prisma.vehicleAllocationHistory.create({
      data: {
        tenderId: tender?.id || resolvedTenderId,
        tenderName: tender?.departmentName || 'Govt Tender',
        vehicleId: targetId,
        vehicleNumber: targetVehicle.vehicleNumber,
        makeModel: targetVehicle.makeModel,
        officerId: officer?.id ?? null,
        officerName: officer?.name ?? null,
        driverId: driver?.id ?? null,
        driverName: driver?.name ?? null,
        assignedDate: effectiveDate,
        replacementVehicleId: oldVeh.id,
        replacementVehicleNumber: oldVeh.vehicleNumber,
        replacementVehicleModel: oldVeh.makeModel,
        reasonForChange: reason,
        notes: notes || `Replaced ${oldVeh.vehicleNumber}`,
        ownershipType: targetVehicle.ownershipType,
      },
    });

    const refreshedOfficer = officer
      ? await prisma.officer.findUnique({ where: { id: officer.id } })
      : null;
    const refreshedDriver = driver
      ? await prisma.driver.findUnique({ where: { id: driver.id } })
      : null;

    return sendSuccess(res, {
      allocation: mapDbVehicleAllocToApi(historyRow),
      oldVehicle: mapDbVehicleToApi(updatedOld),
      vehicle: mapDbVehicleToApi(targetVehicle),
      officer: refreshedOfficer ? mapDbOfficerToApi(refreshedOfficer) : null,
      driver: refreshedDriver ? mapDbDriverToApi(refreshedDriver) : null,
    });
  } catch (err) {
    console.error('POST /api/allocations/replace-vehicle:', err);
    return sendError(res, 500, 'Could not replace vehicle.');
  }
});

allocationsRouter.post('/transfer-officer', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vehicleId = str(body.vehicleId);
    const action = str(body.action, 'halt_car_post_vacant') || 'halt_car_post_vacant';
    const effectiveDate = str(body.effectiveDate) || new Date().toISOString().slice(0, 10);
    const reason = str(body.reason, 'routine_transfer') || 'routine_transfer';
    const transferOrderNumber = str(body.transferOrderNumber);
    const notes = str(body.notes);
    const driverAction = str(body.driverAction, 'keep_on_vehicle') || 'keep_on_vehicle';
    const newOfficerData = (body.newOfficer || body.newOfficerData || null) as Record<
      string,
      unknown
    > | null;

    if (!vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!veh) return sendNotFound(res, 'Vehicle not found.');

    const oldOfficer = veh.assignedOfficerId
      ? await prisma.officer.findUnique({ where: { id: veh.assignedOfficerId } })
      : await prisma.officer.findFirst({ where: { assignedVehicleId: vehicleId } });
    const tender = await prisma.tender.findUnique({ where: { id: veh.tenderId } });
    const currentDriver = veh.currentDriverId
      ? await prisma.driver.findUnique({ where: { id: veh.currentDriverId } })
      : null;

    await prisma.officerAllocationHistory.updateMany({
      where: { vehicleId, relievedDate: null },
      data: {
        relievedDate: effectiveDate,
        replacementOfficerName: newOfficerData ? str(newOfficerData.name) || null : null,
        replacementOfficerDesignation: newOfficerData
          ? str(newOfficerData.designation) || null
          : null,
        transferOrderNumber: transferOrderNumber || undefined,
      },
    });

    if (oldOfficer) {
      await prisma.officer.update({
        where: { id: oldOfficer.id },
        data: {
          assignedVehicleId: null,
          status: 'transferred',
          transferDate: effectiveDate,
          transferOrderNumber: transferOrderNumber || oldOfficer.transferOrderNumber,
          transferDestination: notes || 'Transferred / Relieved from charge',
        },
      });
    }

    let updatedVehicle = veh;
    let createdOrUpdatedOfficer = null as Awaited<ReturnType<typeof prisma.officer.findUnique>>;
    let historyRow;

    if (
      action === 'halt_car_post_vacant' ||
      action === 'surrender_vehicle' ||
      action === 'move_to_pool'
    ) {
      const newStatus =
        action === 'halt_car_post_vacant'
          ? 'idle_officer_transferred'
          : action === 'surrender_vehicle'
            ? 'surrendered_temporary'
            : 'standby_pool';
      const driverFreed = driverAction === 'free_to_pool';

      updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          assignedOfficerId: null,
          assignedOfficerName: null,
          currentDriverId: driverFreed ? null : veh.currentDriverId,
          driverName: driverFreed ? null : veh.driverName,
          driverPhone: driverFreed ? null : veh.driverPhone,
          status: newStatus,
          idleSinceDate: effectiveDate,
          idleReason:
            notes ||
            (action === 'halt_car_post_vacant'
              ? 'Officer transferred — vehicle halted pending new posting'
              : 'Vehicle temporarily surrendered / standby pool'),
          transferOrderRef: transferOrderNumber || null,
        },
      });

      if (driverFreed && currentDriver) {
        await prisma.driver.update({
          where: { id: currentDriver.id },
          data: { currentVehicleId: null },
        });
      }

      historyRow = await prisma.officerAllocationHistory.create({
        data: {
          tenderId: tender?.id || veh.tenderId,
          tenderName: tender?.departmentName || 'Govt Department',
          vehicleId: veh.id,
          vehicleNumber: veh.vehicleNumber,
          officerId: oldOfficer?.id || 'off-vacant',
          officerName: oldOfficer?.name || 'Vacant Post',
          officerDesignation: oldOfficer?.designation || 'Transferred Officer',
          department: oldOfficer?.department || tender?.departmentName || '',
          assignedDate: effectiveDate,
          relievedDate: effectiveDate,
          vehicleAction:
            action === 'halt_car_post_vacant'
              ? 'halted_idle_post_vacant'
              : action === 'surrender_vehicle'
                ? 'vehicle_surrendered'
                : 'transferred_to_pool',
          reason,
          transferOrderNumber: transferOrderNumber || null,
          notes: notes || `Vehicle status after officer transfer: ${newStatus}`,
        },
      });
    } else if (action === 'reassign_new_officer') {
      if (!newOfficerData || !str(newOfficerData.name)) {
        return sendBadRequest(res, 'newOfficer with name is required for reassignment.');
      }
      let targetOfficerId = str(newOfficerData.id);
      createdOrUpdatedOfficer = targetOfficerId
        ? await prisma.officer.findUnique({ where: { id: targetOfficerId } })
        : null;

      if (!createdOrUpdatedOfficer) {
        targetOfficerId = targetOfficerId || `off-${Date.now()}`;
        createdOrUpdatedOfficer = await prisma.officer.create({
          data: {
            id: targetOfficerId,
            name: str(newOfficerData.name),
            designation: str(newOfficerData.designation),
            department: str(newOfficerData.department) || tender?.departmentName || '',
            officeAddress: tender?.authorityOffice || '',
            mobile: str(newOfficerData.mobile),
            assignedVehicleId: vehicleId,
            tenderId: tender?.id || veh.tenderId,
            reportingTime: str(newOfficerData.reportingTime, '09:30 AM') || '09:30 AM',
            status: 'active',
            currentDriverId: veh.currentDriverId,
          },
        });
      } else {
        createdOrUpdatedOfficer = await prisma.officer.update({
          where: { id: createdOrUpdatedOfficer.id },
          data: {
            assignedVehicleId: vehicleId,
            status: 'active',
            currentDriverId: veh.currentDriverId,
          },
        });
        targetOfficerId = createdOrUpdatedOfficer.id;
      }

      updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          assignedOfficerId: targetOfficerId,
          assignedOfficerName: createdOrUpdatedOfficer.name,
          status: 'active',
          idleSinceDate: null,
          idleReason: null,
        },
      });

      historyRow = await prisma.officerAllocationHistory.create({
        data: {
          tenderId: tender?.id || veh.tenderId,
          tenderName: tender?.departmentName || 'Govt Department',
          vehicleId: veh.id,
          vehicleNumber: veh.vehicleNumber,
          officerId: targetOfficerId,
          officerName: createdOrUpdatedOfficer.name,
          officerDesignation: createdOrUpdatedOfficer.designation,
          department: createdOrUpdatedOfficer.department,
          assignedDate: effectiveDate,
          replacementOfficerId: oldOfficer?.id ?? null,
          replacementOfficerName: oldOfficer?.name ?? null,
          replacementOfficerDesignation: oldOfficer?.designation ?? null,
          vehicleAction: 'reassigned_to_new_officer',
          reason,
          transferOrderNumber: transferOrderNumber || null,
          notes:
            notes ||
            `Reassigned after ${oldOfficer?.name || 'previous officer'} left the posting.`,
        },
      });
    } else {
      return sendBadRequest(
        res,
        'action must be halt_car_post_vacant | surrender_vehicle | move_to_pool | reassign_new_officer'
      );
    }

    const refreshedOldOfficer = oldOfficer
      ? await prisma.officer.findUnique({ where: { id: oldOfficer.id } })
      : null;
    const refreshedDriver = currentDriver
      ? await prisma.driver.findUnique({ where: { id: currentDriver.id } })
      : null;

    return sendSuccess(res, {
      allocation: historyRow ? mapDbOfficerAllocToApi(historyRow) : null,
      vehicle: mapDbVehicleToApi(updatedVehicle),
      oldOfficer: refreshedOldOfficer ? mapDbOfficerToApi(refreshedOldOfficer) : null,
      officer: createdOrUpdatedOfficer ? mapDbOfficerToApi(createdOrUpdatedOfficer) : null,
      driver: refreshedDriver ? mapDbDriverToApi(refreshedDriver) : null,
    });
  } catch (err) {
    console.error('POST /api/allocations/transfer-officer:', err);
    return sendError(res, 500, 'Could not transfer officer.');
  }
});

allocationsRouter.post('/relieve-officer', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vehicleId = str(body.vehicleId);
    const effectiveDate = str(body.effectiveDate) || new Date().toISOString().slice(0, 10);
    const reason = str(body.reason, 'relieved_transferred') || 'relieved_transferred';
    const transferOrderNumber = str(body.transferOrderNumber);
    const notes = str(body.notes);
    const driverAction = str(body.driverAction, 'free_to_pool') || 'free_to_pool';

    if (!vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!veh) return sendNotFound(res, 'Vehicle not found.');

    const oldOfficer = veh.assignedOfficerId
      ? await prisma.officer.findUnique({ where: { id: veh.assignedOfficerId } })
      : await prisma.officer.findFirst({ where: { assignedVehicleId: vehicleId } });
    const tender = await prisma.tender.findUnique({ where: { id: veh.tenderId } });
    const currentDriver = veh.currentDriverId
      ? await prisma.driver.findUnique({ where: { id: veh.currentDriverId } })
      : null;

    await prisma.officerAllocationHistory.updateMany({
      where: { vehicleId, relievedDate: null },
      data: { relievedDate: effectiveDate, transferOrderNumber: transferOrderNumber || undefined },
    });

    if (oldOfficer) {
      await prisma.officer.update({
        where: { id: oldOfficer.id },
        data: {
          assignedVehicleId: null,
          status: 'relieved',
          transferDate: effectiveDate,
          transferOrderNumber: transferOrderNumber || oldOfficer.transferOrderNumber,
          transferDestination: notes || 'Relieved from posting',
        },
      });
    }

    const driverFreed = driverAction === 'free_to_pool';
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        assignedOfficerId: null,
        assignedOfficerName: null,
        currentDriverId: driverFreed ? null : veh.currentDriverId,
        driverName: driverFreed ? null : veh.driverName,
        driverPhone: driverFreed ? null : veh.driverPhone,
        status: 'idle',
        idleSinceDate: effectiveDate,
        idleReason: notes || `Officer ${oldOfficer?.name || ''} relieved`,
        transferOrderRef: transferOrderNumber || null,
      },
    });

    if (driverFreed && currentDriver) {
      await prisma.driver.update({
        where: { id: currentDriver.id },
        data: { currentVehicleId: null },
      });
    }

    const historyRow = await prisma.officerAllocationHistory.create({
      data: {
        tenderId: tender?.id || veh.tenderId,
        tenderName: tender?.departmentName || 'Govt Department',
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        officerId: oldOfficer?.id || 'off-vacant',
        officerName: oldOfficer?.name || 'Vacant Post',
        officerDesignation: oldOfficer?.designation || '',
        department: oldOfficer?.department || tender?.departmentName || '',
        assignedDate: effectiveDate,
        relievedDate: effectiveDate,
        vehicleAction: 'halted_idle_post_vacant',
        reason,
        transferOrderNumber: transferOrderNumber || null,
        notes: notes || 'Officer relieved; vehicle halted.',
      },
    });

    const refreshedOld = oldOfficer
      ? await prisma.officer.findUnique({ where: { id: oldOfficer.id } })
      : null;
    const refreshedDriver = currentDriver
      ? await prisma.driver.findUnique({ where: { id: currentDriver.id } })
      : null;

    return sendSuccess(res, {
      allocation: mapDbOfficerAllocToApi(historyRow),
      vehicle: mapDbVehicleToApi(updatedVehicle),
      oldOfficer: refreshedOld ? mapDbOfficerToApi(refreshedOld) : null,
      officer: null,
      driver: refreshedDriver ? mapDbDriverToApi(refreshedDriver) : null,
    });
  } catch (err) {
    console.error('POST /api/allocations/relieve-officer:', err);
    return sendError(res, 500, 'Could not relieve officer.');
  }
});

allocationsRouter.post('/reactivate-vehicle', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'vehicles_officers')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const vehicleId = str(body.vehicleId);
    const effectiveDate = str(body.effectiveDate) || new Date().toISOString().slice(0, 10);
    const notes = str(body.notes);
    const officerId = optStr(body.officerId);
    const newOfficer = (body.newOfficer || null) as Record<string, unknown> | null;

    if (!vehicleId) return sendBadRequest(res, 'vehicleId is required.');
    const veh = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!veh) return sendNotFound(res, 'Vehicle not found.');
    const tender = await prisma.tender.findUnique({ where: { id: veh.tenderId } });

    let assignedOffId = '';
    let officerRow = null as Awaited<ReturnType<typeof prisma.officer.findUnique>>;

    if (officerId) {
      officerRow = await prisma.officer.findUnique({ where: { id: officerId } });
      if (!officerRow) return sendNotFound(res, 'Officer not found.');
      assignedOffId = officerRow.id;
      officerRow = await prisma.officer.update({
        where: { id: assignedOffId },
        data: {
          assignedVehicleId: vehicleId,
          status: 'active',
          currentDriverId: veh.currentDriverId,
        },
      });
    } else if (newOfficer && str(newOfficer.name)) {
      assignedOffId = str(newOfficer.id) || `off-${Date.now()}`;
      officerRow = await prisma.officer.create({
        data: {
          id: assignedOffId,
          name: str(newOfficer.name),
          designation: str(newOfficer.designation),
          department: str(newOfficer.department) || tender?.departmentName || '',
          officeAddress: tender?.authorityOffice || '',
          mobile: str(newOfficer.mobile),
          assignedVehicleId: vehicleId,
          tenderId: veh.tenderId,
          reportingTime: '09:30 AM',
          status: 'active',
          currentDriverId: veh.currentDriverId,
        },
      });
    } else {
      return sendBadRequest(res, 'Provide officerId or newOfficer details.');
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        assignedOfficerId: assignedOffId,
        assignedOfficerName: officerRow!.name,
        status: 'active',
        idleSinceDate: null,
        idleReason: null,
        transferOrderRef: null,
      },
    });

    const historyRow = await prisma.officerAllocationHistory.create({
      data: {
        tenderId: tender?.id || veh.tenderId,
        tenderName: tender?.departmentName || 'Govt Department',
        vehicleId: veh.id,
        vehicleNumber: veh.vehicleNumber,
        officerId: assignedOffId,
        officerName: officerRow!.name,
        officerDesignation: officerRow!.designation,
        department: officerRow!.department || tender?.departmentName || '',
        assignedDate: effectiveDate,
        vehicleAction: 'reassigned_to_new_officer',
        reason: 'new_joining',
        notes: notes || 'Vehicle reactivated with incoming officer posting.',
      },
    });

    return sendSuccess(res, {
      allocation: mapDbOfficerAllocToApi(historyRow),
      vehicle: mapDbVehicleToApi(updatedVehicle),
      officer: mapDbOfficerToApi(officerRow!),
    });
  } catch (err) {
    console.error('POST /api/allocations/reactivate-vehicle:', err);
    return sendError(res, 500, 'Could not reactivate vehicle.');
  }
});
