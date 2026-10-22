import { Injectable, Logger } from '@nestjs/common';
import { humanize } from '../common/util';
import { AuditRepository } from './audit.repository';

export interface Actor {
  id: string;
  email: string;
  memberId: string | null;
  ip?: string;
}

export interface AuditEntry {
  action: 'create' | 'update' | 'delete' | 'status' | string;
  /** Resource key, e.g. "events". */
  entity: string;
  /** Human resource label, e.g. "Event". */
  entityType?: string;
  entityId?: string | null;
  entityLabel?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** Field name → human label; missing names are humanised. */
  fieldLabels?: Record<string, string>;
  /** Overrides the generated summary. */
  summary?: string;
}

const IGNORED = new Set([
  'updatedAt', 'createdAt', 'createdBy', 'updatedBy', 'deletedAt', 'deletedBy',
  'passwordHash', 'tokenVersion', 'failedLogins', 'lockedUntil',
]);
const SECRET = new Set(['password', 'passwordHash']);
const VERBS: Record<string, string> = {
  create: 'Created', update: 'Updated', delete: 'Deleted', status: 'Changed status of',
  approve: 'Approved', reject: 'Rejected', waitlisted: 'Wait-listed', rejected: 'Rejected',
  accept: 'Accepted', decline: 'Declined', upload: 'Uploaded', invite: 'Sent invite to',
  revoke_sessions: 'Signed out all sessions of',
};

/** Normalise values so dates/arrays compare and display cleanly. */
function norm(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (v === undefined || v === '') return null;
  return v;
}

function display(v: unknown): unknown {
  if (typeof v === 'string' && v.length > 300) return `${v.slice(0, 300)}…`;
  return v;
}

/**
 * Writes human-readable audit entries: who (email + name), what (resource + record
 * title), and exactly which fields changed from → to.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly names = new Map<string, string | null>();

  constructor(private readonly repo: AuditRepository) {}

  private async actorName(actor: Actor): Promise<string | null> {
    if (!actor.memberId) return null;
    if (!this.names.has(actor.memberId)) {
      const m = await this.repo.memberName(actor.memberId);
      this.names.set(actor.memberId, m?.fullName ?? null);
    }
    return this.names.get(actor.memberId) ?? null;
  }

  diff(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined, labels: Record<string, string> = {}) {
    const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    const changes: { field: string; label: string; from: unknown; to: unknown }[] = [];
    for (const field of keys) {
      if (IGNORED.has(field) || field.startsWith('_')) continue;
      if (after && !(field in after)) continue; // field not part of this write
      const from = norm(before?.[field]);
      const to = norm(after?.[field]);
      if (JSON.stringify(from) === JSON.stringify(to)) continue;
      changes.push({
        field,
        label: labels[field] ?? humanize(field),
        from: SECRET.has(field) ? '••••' : display(from),
        to: SECRET.has(field) ? '••••' : display(to),
      });
    }
    return changes;
  }

  async log(actor: Actor | null, entry: AuditEntry) {
    try {
      const changes =
        entry.action === 'delete'
          ? []
          : this.diff(entry.before ?? (entry.action === 'create' ? {} : null), entry.after, entry.fieldLabels);
      const type = entry.entityType ?? humanize(entry.entity);
      const label = entry.entityLabel ? `“${entry.entityLabel}”` : '';
      let summary = entry.summary;
      if (!summary) {
        summary = `${VERBS[entry.action] ?? humanize(entry.action)} ${type}${label ? ` ${label}` : ''}`;
        if (entry.action === 'update' && changes.length) {
          summary += ` — ${changes.slice(0, 6).map((c) => c.label).join(', ')}${changes.length > 6 ? ` +${changes.length - 6} more` : ''}`;
        }
        if (entry.action === 'status') {
          const st = changes.find((c) => c.field === 'status');
          if (st) summary += `: ${st.from ?? '—'} → ${st.to}`;
        }
      }
      await this.repo.create({
          actorId: actor?.id,
          actorEmail: actor?.email,
          actorName: actor ? await this.actorName(actor) : 'System',
          action: entry.action,
          entity: entry.entity,
          entityType: type,
          entityId: entry.entityId ?? null,
          entityLabel: entry.entityLabel ?? null,
          summary,
          changes: changes.length ? (changes as any) : undefined,
          ip: actor?.ip,
      });
    } catch (e) {
      // Auditing must never break the admin action itself.
      this.logger.error(`Audit write failed: ${(e as Error).message}`);
    }
  }
}
