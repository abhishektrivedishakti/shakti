import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_ROOT = path.resolve(__dirname, '../../uploads');

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export type StorageMode = 'local' | 'r2';

export function getStorageMode(): StorageMode {
  if (
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET &&
    process.env.R2_PUBLIC_BASE_URL
  ) {
    return 'r2';
  }
  return 'local';
}

export function getUploadRoot(): string {
  return UPLOAD_ROOT;
}

export async function ensureUploadRoot(): Promise<void> {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
}

function extensionForMime(mimeType: string, fileName?: string): string {
  if (fileName && path.extname(fileName)) {
    return path.extname(fileName).toLowerCase();
  }
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.bin';
  }
}

export type SavedUpload = {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storage: StorageMode;
};

function decodeBase64Buffer(fileBase64: string): Buffer {
  const raw = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
  if (!raw) throw new Error('Missing file data.');
  return Buffer.from(raw, 'base64');
}

async function saveLocal(buffer: Buffer, mimeType: string, fileName?: string): Promise<SavedUpload> {
  await ensureUploadRoot();
  const safeExt = extensionForMime(mimeType, fileName);
  const storedName = `${Date.now()}-${randomUUID()}${safeExt}`;
  const absPath = path.join(UPLOAD_ROOT, storedName);
  await fs.writeFile(absPath, buffer);
  return {
    url: `/uploads/${storedName}`,
    fileName: fileName || storedName,
    mimeType,
    sizeBytes: buffer.length,
    storage: 'local',
  };
}

async function saveR2(buffer: Buffer, mimeType: string, fileName?: string): Promise<SavedUpload> {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET!;
  const publicBase = process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, '');

  // Dynamic import keeps local-dev installs light when R2 is unused.
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const safeExt = extensionForMime(mimeType, fileName);
  const key = `shakti/${Date.now()}-${randomUUID()}${safeExt}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  return {
    url: `${publicBase}/${key}`,
    fileName: fileName || path.basename(key),
    mimeType,
    sizeBytes: buffer.length,
    storage: 'r2',
  };
}

/**
 * Local disk by default. When R2_* env vars are set, uploads go to Cloudflare R2
 * (S3-compatible) without changing route handlers.
 */
export async function saveBase64Upload(input: {
  fileBase64: string;
  fileName?: string;
  mimeType?: string;
}): Promise<SavedUpload> {
  const mimeType = input.mimeType || 'application/octet-stream';
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error('Unsupported file type. Use PDF, image, or Word document.');
  }

  const buffer = decodeBase64Buffer(input.fileBase64);
  const maxBytes = Number(process.env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024);
  if (buffer.length > maxBytes) {
    throw new Error(`File too large. Max ${Math.round(maxBytes / (1024 * 1024))} MB.`);
  }

  if (getStorageMode() === 'r2') {
    return saveR2(buffer, mimeType, input.fileName);
  }
  return saveLocal(buffer, mimeType, input.fileName);
}

export async function deleteUploadByUrl(url: string): Promise<boolean> {
  if (url.startsWith('/uploads/')) {
    const base = path.basename(url);
    if (!base || base.includes('..')) {
      throw new Error('Invalid file path.');
    }
    const absPath = path.join(UPLOAD_ROOT, base);
    try {
      await fs.unlink(absPath);
      return true;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }

  // Remote R2 URLs: best-effort delete when configured
  if (getStorageMode() === 'r2' && process.env.R2_PUBLIC_BASE_URL) {
    const publicBase = process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, '');
    if (!url.startsWith(publicBase + '/')) {
      throw new Error('File URL is not managed by this storage configuration.');
    }
    const key = url.slice(publicBase.length + 1);
    const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: key,
      })
    );
    return true;
  }

  throw new Error('Only locally uploaded files can be deleted when R2 is not configured.');
}
