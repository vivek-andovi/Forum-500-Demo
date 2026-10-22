import { BadRequestException } from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';

export interface SlugOptions {
  /** Max length of the slugified part (before the random suffix). */
  maxLength?: number;
  /** Fold accented letters to ASCII ("Café" → "cafe") instead of dropping them. */
  stripAccents?: boolean;
}

export function slugify(input: string, { maxLength = 80, stripAccents = true }: SlugOptions = {}): string {
  const base = stripAccents ? input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '') : input;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, maxLength);
}

/** Slug plus a random base-36 suffix so it is unique without a lookup ("annual-dinner-k3f9a"). */
export function uniqueSlug(input: string, { suffixLength = 5, ...opts }: SlugOptions & { suffixLength?: number } = {}): string {
  return `${slugify(input, opts)}-${Math.random().toString(36).slice(2, 2 + suffixLength)}`;
}

/** Field name → label: "authorPhotoUrl" → "Author Photo", "chapterId" → "Chapter". */
export const humanize = (name: string) =>
  name
    .replace(/Id$/, '')
    .replace(/Url$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

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
