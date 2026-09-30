import { promises as fs } from 'fs';
import path from 'path';

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const isNodeRuntime = () =>
  typeof window === 'undefined' && typeof process !== 'undefined' && typeof process.cwd === 'function';

function sanitizeSegment(segment: string, fallback: string): string {
  const cleaned = segment.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '').slice(0, 80);
  return cleaned || fallback;
}

function sanitizeFolder(folder: string): string {
  return folder
    .split(/[\\/]+/)
    .filter(Boolean)
    .map((segment) => sanitizeSegment(segment, 'uploads'))
    .join('/');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Runtime-agnostic file read. Uses File.arrayBuffer()/Blob.arrayBuffer() which
 * exists in both the browser and Node 18+, so this never touches FileReader
 * (FileReader is undefined on the server and throws "FileReader is not defined").
 */
async function readBytes(file: File): Promise<Uint8Array> {
  if (typeof file.arrayBuffer === 'function') {
    return new Uint8Array(await file.arrayBuffer());
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(file)) {
    return new Uint8Array(file);
  }

  throw new Error('Unsupported file input: expected a File or Blob');
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadFile(file: File, folder: string): Promise<UploadResult> {
  if (!file) {
    throw new Error('No file provided');
  }

  const bytes = await readBytes(file);

  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('File size must be less than 5MB');
  }

  const contentType = file.type || 'application/octet-stream';
  const originalName = sanitizeSegment(file.name || 'upload', 'upload');
  const extension = path.extname(originalName) || EXTENSION_BY_MIME[contentType] || '';
  const fileName = `${Date.now()}-${randomSuffix()}${extension}`;
  const pathname = `${sanitizeFolder(folder)}/${fileName}`;

  // On the server, persist to public/uploads so the proof is retrievable later.
  if (isNodeRuntime()) {
    const segments = [...pathname.split('/'), '..', '']; // guard against traversal
    const target = path.join(process.cwd(), 'public', 'uploads', ...segments);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);

    return {
      url: `/uploads/${pathname}`,
      pathname,
      contentType,
      size: bytes.byteLength,
    };
  }

  // Browser fallback: inline data URL (no server storage available).
  const base64 = toBase64(bytes);

  return {
    url: `data:${contentType};base64,${base64}`,
    pathname,
    contentType,
    size: bytes.byteLength,
  };
}

export async function uploadFiles(files: File[], folder: string): Promise<UploadResult[]> {
  const results = await Promise.all(files.map((file) => uploadFile(file, folder)));
  return results;
}