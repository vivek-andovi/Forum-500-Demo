import { BadRequestException } from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

export function uniqueSlug(input: string): string {
  return `${slugify(input)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Parse a request body with zod, turning failures into a 400 with readable messages. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`),
    );
  }
  return result.data;
}

/** Only http(s) URLs or site-relative paths ("/", "/events") — blocks javascript:/data: and protocol-relative "//host" URLs. */
export const SAFE_URL = /^(https?:\/\/\S+|\/(?!\/)\S*)$/i;

export const httpUrl = (max = 1000) =>
  z.string().trim().max(max).regex(SAFE_URL, 'must be an http(s) URL');

/** Password policy: 10+ characters with at least one letter and one number. */
export const passwordSchema = z
  .string()
  .min(10, 'must be at least 10 characters')
  .max(128)
  .regex(/[A-Za-z]/, 'must contain a letter')
  .regex(/\d/, 'must contain a number');
