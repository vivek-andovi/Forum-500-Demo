import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { AuthService } from '../../core/auth/auth.service';
import { MailService } from '../../core/mail/mail.service';
import { ApplicationsRepository } from './applications.repository';
import { MembersRepository } from './members.repository';

const list = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((v) => (Array.isArray(v) ? v : (v ?? '').split(',')).map((s) => s.trim()).filter(Boolean));

export const ApplicationSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().max(40).optional(),
  linkedin: z.string().trim().max(300).regex(/^(https?:\/\/[^\s]+)?$/i, 'must be an http(s) URL').optional(),
  /** Honeypot: real users never fill this hidden field. */
  website: z.string().max(0, 'invalid submission').optional(),
  role: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(200),
  sector: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120),
  travelCities: list,
  recommenderName: z.string().trim().min(1).max(120),
  recommenderRelation: z.string().max(300).optional(),
  whyJoin: z.string().trim().min(1).max(1000),
  contribution: z.string().trim().min(1).max(1000),
  about: z.string().max(1000).optional(),
});

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly repo: ApplicationsRepository,
    private readonly members: MembersRepository,
    private readonly audit: AuditService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  async apply(input: z.infer<typeof ApplicationSchema>) {
    const { website: _honeypot, ...data } = input;
    const email = data.email.toLowerCase();
    const open = await this.repo.findOpenByEmail(email);
    if (open) return { id: open.id, status: open.status };
    const recommender = await this.members.findByName(data.recommenderName);
    const app = await this.repo.create({ ...data, email, recommenderMemberId: recommender?.id ?? null });
    return { id: app.id, status: app.status };
  }

  async approve(id: string, note: string | undefined, actor: Actor) {
    const app = await this.repo.findById(id);
    if (!app) throw new NotFoundException('Application not found');
    if (app.status === 'approved') throw new BadRequestException('Application already approved');
    const email = app.email.trim().toLowerCase();
    if (await this.repo.userExists(email)) throw new BadRequestException('A user with this email already exists');

    const { application, member, userId } = await this.repo.approve(app, email, note);
    await this.audit.log(actor, {
      action: 'approve', entity: 'applications', entityType: 'Application', entityId: id, entityLabel: app.fullName,
      summary: `Approved application from “${app.fullName}” — created member and sent invite to ${email}`,
      before: { status: app.status }, after: { status: 'approved' },
    });
    const invite = await this.auth.sendInvite(userId);
    return { application, member, invite };
  }

  async reject(id: string, note: string | undefined, status: 'rejected' | 'waitlisted', actor: Actor) {
    const before = await this.repo.findById(id);
    if (!before) throw new NotFoundException('Application not found');
    if (before.status === 'approved') throw new BadRequestException('An approved application cannot be rejected');
    const application = await this.repo.setDecision(id, status, note);
    await this.audit.log(actor, {
      action: status, entity: 'applications', entityType: 'Application', entityId: id, entityLabel: before.fullName,
      before: { status: before.status }, after: { status, decisionNote: note ?? null },
    });
    await this.mail.sendApplicationDecision(before.email, before.fullName, status, note);
    return application;
  }
}
