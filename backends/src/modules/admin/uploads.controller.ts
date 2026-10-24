import { BadRequestException, Body, Controller, HttpCode, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { CurrentActor, Roles } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { AssetsRepository } from './assets.repository';
import { MAX_BYTES, sniffMime } from '../../core/storage/file-sniff';
import { StorageService } from '../../core/storage/storage.service';
import { env } from '../../core/config/env';

const PresignSchema = z.object({
  filename: z.string().trim().min(1).max(200),
  mime: z.enum(Object.keys(MAX_BYTES) as [string, ...string[]]),
  size: z.number().int().positive(),
});
const ConfirmSchema = z.object({
  key: z.string().regex(/^uploads\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.[a-z0-9]+$/),
  filename: z.string().trim().min(1).max(200),
  mime: z.enum(Object.keys(MAX_BYTES) as [string, ...string[]]),
  size: z.number().int().positive(),
});

/**
 * Admin file uploads. The file's real type is detected from its bytes (the
 * browser-supplied type is ignored), SVG/HTML are rejected, and size limits apply
 * per type. Files go to S3 (production) or ./uploads (development).
 */
@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Throttle({ default: { limit: 60, ttl: 60_000 } })
@Controller('admin/uploads')
export class UploadsController {
  constructor(
    private readonly assets: AssetsRepository,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  private cleanName(name: string) {
    return name.replace(/[^\w.\- ()]/g, '_').slice(0, 200);
  }

  @Post()
  // On Lambda UPLOAD_MAX_MB is ~4 (6 MB request limit); the admin app sends bigger files through presign/confirm.
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: env().UPLOAD_MAX_MB * 1e6, files: 1 } }))
  async upload(@UploadedFile() file: Express.Multer.File | undefined, @CurrentActor() actor: Actor) {
    if (!file) throw new BadRequestException('No file uploaded (field name must be "file")');
    const mime = sniffMime(file.buffer);
    if (!mime) throw new BadRequestException('Unsupported file type. Allowed: JPG, PNG, WebP, GIF, AVIF, PDF, MP3, M4A, WAV, OGG');
    if (file.size > MAX_BYTES[mime]) {
      throw new BadRequestException(`File too large: max ${Math.round(MAX_BYTES[mime] / 1e6)} MB for ${mime}`);
    }
    const stored = await this.storage.put(file.buffer, mime);
    const filename = this.cleanName(file.originalname);
    const asset = await this.assets.create({ url: stored.url, storageKey: stored.key, driver: stored.driver, filename, mime, size: file.size, uploadedBy: actor.id });
    await this.audit.log(actor, {
      action: 'upload', entity: 'assets', entityType: 'Asset', entityId: asset.id, entityLabel: filename,
      summary: `Uploaded ${filename} (${mime}, ${(file.size / 1e6).toFixed(1)} MB)`,
    });
    return { id: asset.id, url: asset.url };
  }

  /**
   * Step 1 of a direct-to-S3 upload for large files: returns a 5-minute presigned PUT URL.
   * The admin app uses it for files above the direct-upload limit (UPLOAD_MAX_MB). Needs STORAGE_DRIVER=s3
   * and a bucket CORS rule allowing PUT from the admin origin.
   */
  @Post('presign')
  @HttpCode(200)
  async presign(@Body() body: unknown) {
    const input = parseBody(PresignSchema, body);
    if (input.size > MAX_BYTES[input.mime]) throw new BadRequestException('File too large');
    if (this.storage.driver !== 's3') throw new BadRequestException('Direct uploads need STORAGE_DRIVER=s3; use POST /admin/uploads');
    return this.storage.presignPut(input.mime);
  }

  /** Step 2: record the uploaded object as an asset. */
  @Post('confirm')
  async confirm(@Body() body: unknown, @CurrentActor() actor: Actor) {
    const input = parseBody(ConfirmSchema, body);
    // Trust only what is actually in the bucket, not what the client claims.
    const object = await this.storage.head(input.key);
    if (!object) throw new BadRequestException('Upload not found in storage');
    if (object.mime !== input.mime || object.size > MAX_BYTES[input.mime]) {
      await this.storage.remove(input.key, 's3');
      throw new BadRequestException('Uploaded file does not match the declared type or is too large');
    }
    if (await this.assets.findByKey(input.key)) {
      throw new BadRequestException('This upload was already recorded');
    }
    const asset = await this.assets.create({
      url: this.storage.publicUrl(input.key), storageKey: input.key, driver: 's3',
      filename: this.cleanName(input.filename), mime: object.mime, size: object.size, uploadedBy: actor.id,
    });
    await this.audit.log(actor, { action: 'upload', entity: 'assets', entityType: 'Asset', entityId: asset.id, entityLabel: asset.filename });
    return { id: asset.id, url: asset.url };
  }
}
