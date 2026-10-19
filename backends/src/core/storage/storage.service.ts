import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { env } from '../config/env';

export interface StoredFile {
  key: string;
  url: string;
  driver: 'local' | 's3';
}

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
  'application/pdf': 'pdf', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
};

/**
 * File storage. `local` writes to ./uploads (development only); `s3` writes to an
 * S3 bucket (AWS, or MinIO locally via S3_ENDPOINT). Public URLs come from
 * ASSET_PUBLIC_BASE_URL (CloudFront) when set.
 */
@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name);
  private readonly cfg = env();
  private readonly s3 =
    this.cfg.STORAGE_DRIVER === 's3'
      ? new S3Client({
          region: this.cfg.AWS_REGION,
          endpoint: this.cfg.S3_ENDPOINT,
          forcePathStyle: this.cfg.S3_FORCE_PATH_STYLE,
          // Browsers PUT to presigned URLs without SDK checksum headers.
          requestChecksumCalculation: 'WHEN_REQUIRED',
          responseChecksumValidation: 'WHEN_REQUIRED',
        })
      : null;

  get driver(): 'local' | 's3' {
    return this.cfg.STORAGE_DRIVER;
  }

  /** Build a namespaced, unguessable object key, e.g. uploads/2026/10/<uuid>.jpg */
  newKey(mime: string, folder = 'uploads'): string {
    const now = new Date();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    return `${folder}/${now.getUTCFullYear()}/${month}/${randomUUID()}.${EXTENSIONS[mime] ?? 'bin'}`;
  }

  publicUrl(key: string): string {
    if (this.cfg.ASSET_PUBLIC_BASE_URL) return `${this.cfg.ASSET_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
    if (this.driver === 'local') return `${this.cfg.PUBLIC_API_URL}/${key}`;
    if (this.cfg.S3_ENDPOINT) return `${this.cfg.S3_ENDPOINT.replace(/\/$/, '')}/${this.cfg.S3_BUCKET}/${key}`;
    return `https://${this.cfg.S3_BUCKET}.s3.${this.cfg.AWS_REGION}.amazonaws.com/${key}`;
  }

  async put(body: Buffer, mime: string, folder?: string): Promise<StoredFile> {
    const key = this.newKey(mime, folder);
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.cfg.S3_BUCKET,
          Key: key,
          Body: body,
          ContentType: mime,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } else {
      const path = join(process.cwd(), key);
      await mkdir(join(path, '..'), { recursive: true });
      await writeFile(path, body);
    }
    return { key, url: this.publicUrl(key), driver: this.driver };
  }

  /** Presigned PUT URL so browsers can upload large files straight to S3. */
  async presignPut(mime: string, folder?: string): Promise<{ key: string; uploadUrl: string; url: string }> {
    if (!this.s3) throw new Error('Presigned uploads require STORAGE_DRIVER=s3');
    const key = this.newKey(mime, folder);
    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.cfg.S3_BUCKET, Key: key, ContentType: mime }),
      { expiresIn: 300 },
    );
    return { key, uploadUrl, url: this.publicUrl(key) };
  }

  /** Real size and type of an uploaded object, or null if it does not exist. */
  async head(key: string): Promise<{ size: number; mime: string } | null> {
    if (!this.s3) return null;
    try {
      const r = await this.s3.send(new HeadObjectCommand({ Bucket: this.cfg.S3_BUCKET, Key: key }));
      return { size: r.ContentLength ?? 0, mime: r.ContentType ?? 'application/octet-stream' };
    } catch {
      return null;
    }
  }

  async remove(key: string, driver: string): Promise<void> {
    try {
      if (driver === 's3' && this.s3) {
        await this.s3.send(new DeleteObjectCommand({ Bucket: this.cfg.S3_BUCKET, Key: key }));
      } else if (driver === 'local' && !key.includes('..')) {
        await unlink(join(process.cwd(), key.startsWith('uploads/') ? key : `uploads/${key}`));
      }
    } catch (e) {
      this.log.warn(`Could not delete ${driver}:${key}: ${(e as Error).message}`);
    }
  }
}
