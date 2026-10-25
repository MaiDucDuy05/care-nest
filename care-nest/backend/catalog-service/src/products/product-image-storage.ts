import { BadRequestException } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

export const PRODUCT_IMAGE_UPLOAD_DIR = path.resolve(
  process.env.PRODUCT_IMAGE_UPLOAD_DIR || path.resolve(__dirname, '..', '..', 'uploads', 'products'),
);

const IMAGE_FORMATS: Record<string, { extension: string; isValid: (buffer: Buffer) => boolean }> = {
  'image/jpeg': {
    extension: 'jpg',
    isValid: (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    isValid: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: 'webp',
    isValid: (buffer) => buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP',
  },
  'image/gif': {
    extension: 'gif',
    isValid: (buffer) => ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6)),
  },
};

export async function storeProductImage(
  file: { buffer: Buffer; mimetype: string },
  request: Request,
): Promise<{ url: string }> {
  const format = IMAGE_FORMATS[file.mimetype];
  if (!format || !format.isValid(file.buffer)) {
    throw new BadRequestException('Upload a valid JPEG, PNG, WebP, or GIF image.');
  }

  await mkdir(PRODUCT_IMAGE_UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${format.extension}`;
  await writeFile(path.join(PRODUCT_IMAGE_UPLOAD_DIR, filename), file.buffer, { flag: 'wx' });

  const protocol = (request.get('x-forwarded-proto') || request.protocol).split(',')[0].trim();
  const host = (request.get('x-forwarded-host') || request.get('host') || 'localhost').split(',')[0].trim();
  return { url: `${protocol}://${host}/uploads/products/${filename}` };
}
