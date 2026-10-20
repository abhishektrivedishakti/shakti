import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { deleteUploadByUrl, saveBase64Upload } from '../lib/fileStorage';
import { sendBadRequest, sendError, sendNotFound, sendSuccess } from '../lib/apiResponse';

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.post('/upload', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64 : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName : undefined;
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : undefined;

    if (!fileBase64) {
      return sendBadRequest(res, 'Provide fileBase64.');
    }

    const saved = await saveBase64Upload({ fileBase64, fileName, mimeType });
    return sendSuccess(res, { file: saved }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    if (
      message.includes('Unsupported') ||
      message.includes('Missing') ||
      message.includes('too large')
    ) {
      return sendBadRequest(res, message);
    }
    console.error('POST /api/files/upload:', err);
    return sendError(res, 500, 'Upload failed.');
  }
});

filesRouter.delete('/', async (req: Request, res: Response) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const url = typeof body.url === 'string' ? body.url : '';
    if (!url) {
      return sendBadRequest(res, 'Provide url of the file to delete.');
    }

    const deleted = await deleteUploadByUrl(url);
    if (!deleted) {
      return sendNotFound(res, 'File not found.');
    }
    return sendSuccess(res, { deleted: true, url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed.';
    if (message.includes('Only locally') || message.includes('Invalid')) {
      return sendBadRequest(res, message);
    }
    console.error('DELETE /api/files:', err);
    return sendError(res, 500, 'Delete failed.');
  }
});
