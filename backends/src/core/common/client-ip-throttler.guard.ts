import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { VIA_CLOUDFLARE } from './via-cloudflare';

/**
 * Rate limits per real client. Behind Cloudflare every request arrives from a Cloudflare address, so the client
 * is taken from CF-Connecting-IP, but only on requests that proved they came through Cloudflare (ORIGIN_SECRET);
 * anyone else could fake the header.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string | symbol, any>): Promise<string> {
    const cf = req.headers?.['cf-connecting-ip'];
    if (req[VIA_CLOUDFLARE] && typeof cf === 'string' && cf) return cf;
    return req.ips?.length ? req.ips[0] : req.ip;
  }
}
