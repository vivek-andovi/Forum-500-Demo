import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { AuthRepository } from '../../core/auth/auth.repository';
import { AuthService } from '../../core/auth/auth.service';
import { InforumService } from '../media/inforum.service';
import { ApplicationsService } from '../membership/applications.service';
import { ProfileService } from '../membership/profile.service';
import { AdminDashboardRepository, APPROVAL_QUEUES } from './admin-dashboard.repository';

/**
 * Admin workflows. Each decision is implemented by the module that owns the data
 * (applications, profile reviews, pitches); this service only exposes them to admins.
 */
@Injectable()
export class AdminWorkflowsService {
  constructor(
    private readonly dashboardRepo: AdminDashboardRepository,
    private readonly applications: ApplicationsService,
    private readonly profiles: ProfileService,
    private readonly inforum: InforumService,
    private readonly auth: AuthService,
    private readonly users: AuthRepository,
    private readonly audit: AuditService,
  ) {}

  approvals() {
    return Promise.all(
      APPROVAL_QUEUES.map(async (q) => ({
        key: q.key, label: q.label, resource: q.resource, filter: q.filter,
        count: await this.dashboardRepo.countQueue(q.model, q.filter),
      })),
    );
  }

  async dashboard() {
    const [counts, approvals, upcomingEvents, recentApplications] = await Promise.all([
      this.dashboardRepo.counts(),
      this.approvals(),
      this.dashboardRepo.upcomingEvents(5),
      this.dashboardRepo.recentApplications(5),
    ]);
    return { counts, approvals: approvals.filter((a) => a.count > 0), upcomingEvents, recentApplications };
  }

  approveApplication(id: string, note: string | undefined, actor: Actor) {
    return this.applications.approve(id, note, actor);
  }

  rejectApplication(id: string, note: string | undefined, status: 'rejected' | 'waitlisted', actor: Actor) {
    return this.applications.reject(id, note, status, actor);
  }

  approveRevision(id: string, actor: Actor) {
    return this.profiles.approveRevision(id, actor);
  }

  rejectRevision(id: string, note: string | undefined, actor: Actor) {
    return this.profiles.rejectRevision(id, note, actor);
  }

  acceptPitch(id: string, actor: Actor) {
    return this.inforum.acceptPitch(id, actor);
  }

  declinePitch(id: string, actor: Actor) {
    return this.inforum.declinePitch(id, actor);
  }

  // ── User account actions

  async sendInvite(userId: string, actor: Actor) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'suspended') throw new BadRequestException('Unsuspend the user before sending an invite');
    const result = await this.auth.sendInvite(userId);
    await this.audit.log(actor, {
      action: 'invite', entity: 'users', entityType: 'User', entityId: userId, entityLabel: user.email,
      summary: `Sent set-password invite to ${user.email}`,
    });
    return result;
  }

  async revokeSessions(userId: string, actor: Actor) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    await this.auth.revokeSessions(userId);
    await this.audit.log(actor, { action: 'revoke_sessions', entity: 'users', entityType: 'User', entityId: userId, entityLabel: user.email });
    return { ok: true };
  }
}
