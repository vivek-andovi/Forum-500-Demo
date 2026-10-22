import { Injectable, NotFoundException } from '@nestjs/common';
import { EventKind } from '@prisma/client';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { uniqueSlug } from '../../core/common/util';
import { EventsRepository } from './events.repository';

export const RsvpSchema = z.object({
  plusOnes: z.number().int().min(0).max(5).optional(),
  dietaryNote: z.string().max(500).optional(),
});

export const ProposalSchema = z.object({
  title: z.string().min(1).max(200),
  kind: z.nativeEnum(EventKind),
  city: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  venueText: z.string().max(300).optional(),
  description: z.string().max(5000).optional(),
  inviteAudiences: z.array(z.string()).default([]),
  supportRequested: z.array(z.string()).default([]),
});

@Injectable()
export class EventsService {
  constructor(private readonly repo: EventsRepository) {}

  list() {
    return this.repo.listPublished();
  }

  async mine(user: AuthUser) {
    const memberId = requireMember(user);
    const [hosting, attending, proposals] = await Promise.all([
      this.repo.listHosting(memberId),
      this.repo.listAttending(memberId, ['confirmed', 'waitlisted']),
      this.repo.listProposals(memberId),
    ]);
    return { hosting, attending, proposals };
  }

  /** Event detail; the private address is revealed only to hosts and confirmed guests inside the reveal window. */
  async detail(user: AuthUser, slug: string) {
    const event = await this.repo.findPublishedBySlug(slug);
    if (!event) throw new NotFoundException('Event not found');
    const [myRsvp, rsvpCount] = await Promise.all([
      user.memberId ? this.repo.findRsvp(event.id, user.memberId) : null,
      this.repo.countConfirmed(event.id),
    ]);
    const revealFrom = event.startsAt.getTime() - event.addressRevealHours * 3600_000;
    const isHost = event.hosts.some((h) => h.memberId === user.memberId);
    const canSeeAddress = isHost || (myRsvp?.status === 'confirmed' && Date.now() >= revealFrom);
    const { privateAddress, venue, ...rest } = event;
    const { privateAddress: venueAddress, ...publicVenue } = venue ?? ({} as any);
    return {
      ...rest,
      venue: venue ? publicVenue : null,
      myRsvp,
      rsvpCount,
      address: canSeeAddress ? privateAddress ?? venueAddress ?? null : null,
    };
  }

  /** RSVP; goes to the waitlist once confirmed guests reach capacity. */
  async rsvp(user: AuthUser, eventId: string, input: z.infer<typeof RsvpSchema>) {
    const memberId = requireMember(user);
    const event = await this.repo.findPublishedById(eventId);
    if (!event) throw new NotFoundException('Event not found');
    let status: 'confirmed' | 'waitlisted' = 'confirmed';
    if (event.capacity && (await this.repo.countConfirmed(eventId, memberId)) >= event.capacity) status = 'waitlisted';
    return this.repo.upsertRsvp(eventId, memberId, { status, ...input });
  }

  async cancelRsvp(user: AuthUser, eventId: string) {
    await this.repo.cancelRsvp(eventId, requireMember(user));
    return { ok: true };
  }

  async propose(user: AuthUser, input: z.infer<typeof ProposalSchema>) {
    const memberId = requireMember(user);
    const chapter = await this.repo.findChapterByName(input.city);
    return this.repo.createProposal(
      {
        slug: uniqueSlug(input.title),
        title: input.title,
        kind: input.kind,
        city: input.city,
        chapterId: chapter?.id,
        startsAt: new Date(`${input.date}T19:00:00Z`),
        venueText: input.venueText,
        description: input.description,
        inviteAudiences: input.inviteAudiences,
        supportRequested: input.supportRequested,
        status: 'in_review',
      },
      memberId,
    );
  }

  // ── Reads used by other modules (e.g. the dashboard)

  upcoming(take: number) {
    return this.repo.listUpcoming(take);
  }

  attendingWithHosts(memberId: string) {
    return this.repo.listAttendingWithHosts(memberId);
  }

  hostingIncludingReview(memberId: string) {
    return this.repo.listHostingIncludingReview(memberId);
  }
}
