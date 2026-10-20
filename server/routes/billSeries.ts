import { Router, type Request, type Response } from 'express';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/auth';
import {
  sendBadRequest,
  sendError,
  sendForbidden,
  sendSuccess,
} from '../lib/apiResponse';
import { canEditModule, canViewModule } from '../lib/moduleAccess';
import {
  DEFAULT_BILL_SERIES,
  billSeriesDataFromBody,
  formatBillNumber,
  mapDbBillSeriesToApi,
} from '../lib/billMapper';
import { optStr, str } from '../lib/bodyParsers';

export const billSeriesRouter = Router();

async function ensureBillSeries() {
  const existing = await prisma.billSeriesConfig.findUnique({ where: { id: 'default' } });
  if (existing) return existing;
  return prisma.billSeriesConfig.create({
    data: { id: 'default', ...DEFAULT_BILL_SERIES },
  });
}

billSeriesRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canViewModule(req, 'billing')) return sendForbidden(res);
    const row = await ensureBillSeries();
    return sendSuccess(res, { series: mapDbBillSeriesToApi(row) });
  } catch (err) {
    console.error('GET /api/bill-series:', err);
    return sendError(res, 500, 'Could not load bill series config.');
  }
});

billSeriesRouter.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    await ensureBillSeries();
    const body = (req.body ?? {}) as Record<string, unknown>;
    const data = billSeriesDataFromBody(body);
    if (!data.prefix.trim()) return sendBadRequest(res, 'prefix is required.');

    const row = await prisma.billSeriesConfig.update({
      where: { id: 'default' },
      data,
    });
    return sendSuccess(res, { series: mapDbBillSeriesToApi(row) });
  } catch (err) {
    console.error('PUT /api/bill-series:', err);
    return sendError(res, 500, 'Could not update bill series config.');
  }
});

/** Atomically reserve the next bill number and advance the counter. */
billSeriesRouter.post('/next-number', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canEditModule(req, 'billing')) return sendForbidden(res);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const monthYear = optStr(body.monthYear) || undefined;
    const overridePrefix = optStr(body.overridePrefix) || undefined;
    const tenderId = str(body.tenderId);
    const count = Math.max(1, Math.min(200, Math.round(Number(body.count) || 1)));

    const tender = tenderId
      ? await prisma.tender.findUnique({ where: { id: tenderId } })
      : null;

    const result = await prisma.$transaction(async (tx) => {
      let series = await tx.billSeriesConfig.findUnique({ where: { id: 'default' } });
      if (!series) {
        series = await tx.billSeriesConfig.create({
          data: { id: 'default', ...DEFAULT_BILL_SERIES },
        });
      }

      const config = mapDbBillSeriesToApi(series);
      const numbers: string[] = [];
      let seq = series.currentNumber;
      for (let i = 0; i < count; i++) {
        numbers.push(
          formatBillNumber(config, {
            sequenceNum: seq,
            monthYear,
            tender: tender
              ? { billSeriesPrefix: tender.billSeriesPrefix ?? undefined }
              : null,
            overridePrefix,
          })
        );
        seq += 1;
      }

      const updated = await tx.billSeriesConfig.update({
        where: { id: 'default' },
        data: { currentNumber: seq },
      });

      return {
        billNumber: numbers[0],
        billNumbers: numbers,
        series: mapDbBillSeriesToApi(updated),
      };
    });

    return sendSuccess(res, result);
  } catch (err) {
    console.error('POST /api/bill-series/next-number:', err);
    return sendError(res, 500, 'Could not reserve next bill number.');
  }
});
