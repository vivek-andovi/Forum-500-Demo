import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MEMBER_PRIVATE, PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Private addresses are never selected for lists; only `findPublishedBySlug` loads them. */
const OMIT_ADDRESS = { privateAddress: true } as const;
const PUBLIC_VENUE = { venue: { omit: OMIT_ADDRESS } } as const;
const HOSTS = { include: { member: { omit: MEMBER_PRIVATE } } } as const;
const WITH_HOSTS = { ...PUBLIC_VENUE, hosts: HOSTS } as const;

@Injectable()
export class EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.event.findMany({ where: PUBLISHED, orderBy: { startsAt: 'asc' }, omit: OMIT_ADDRESS, include: WITH_HOSTS });
  }

  listUpcoming(take: number) {
    return this.prisma.event.findMany({
      where: { ...PUBLISHED, startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' }, take, omit: OMIT_ADDRESS, include: WITH_HOSTS,
    });
  }

  listAttending(memberId: string, statuses: ('confirmed' | 'waitlisted')[] = ['confirmed']) {
    return this.prisma.event.findMany({
      where: { ...PUBLISHED, rsvps: { some: { memberId, status: { in: statuses } } } },
      orderBy: { startsAt: 'asc' }, omit: OMIT_ADDRESS, include: PUBLIC_VENUE,
    });
  }

  listAttendingWithHosts(memberId: string) {
    return this.prisma.event.findMany({
      where: { ...PUBLISHED, rsvps: { some: { memberId, status: 'confirmed' } } }, orderBy: { startsAt: 'asc' }, omit: OMIT_ADDRESS, include: WITH_HOSTS,
    });
  }

  listHosting(memberId: string) {
    return this.prisma.event.findMany({
      where: { ...PUBLISHED, hosts: { some: { memberId } } }, orderBy: { startsAt: 'asc' }, omit: OMIT_ADDRESS, include: PUBLIC_VENUE,
    });
  }

  /** Hosted events including ones still in review (dashboard "I'm hosting"). */
  listHostingIncludingReview(memberId: string) {
    return this.prisma.event.findMany({
      where: { hosts: { some: { memberId } }, status: { in: ['published', 'in_review'] } }, orderBy: { startsAt: 'asc' }, omit: OMIT_ADDRESS, include: WITH_HOSTS,
    });
  }

  listProposals(memberId: string) {
    return this.prisma.event.findMany({
      where: { proposedById: memberId, status: { in: ['in_review', 'rejected'] } },
      orderBy: { createdAt: 'desc' }, omit: OMIT_ADDRESS, include: PUBLIC_VENUE,
    });
  }

  findPublishedBySlug(slug: string) {
    return this.prisma.event.findFirst({ where: { slug, ...PUBLISHED }, include: { venue: true, hosts: HOSTS } });
  }

  findPublishedById(id: string) {
    return this.prisma.event.findFirst({ where: { id, ...PUBLISHED } });
  }

  findRsvp(eventId: string, memberId: string) {
    return this.prisma.eventRsvp.findUnique({ where: { eventId_memberId: { eventId, memberId } } });
  }

  countConfirmed(eventId: string, excludeMemberId?: string) {
    return this.prisma.eventRsvp.count({
      where: { eventId, status: 'confirmed', ...(excludeMemberId ? { NOT: { memberId: excludeMemberId } } : {}) },
    });
  }

  upsertRsvp(eventId: string, memberId: string, data: { status: 'confirmed' | 'waitlisted'; plusOnes?: number; dietaryNote?: string }) {
    return this.prisma.eventRsvp.upsert({
      where: { eventId_memberId: { eventId, memberId } }, update: data, create: { eventId, memberId, ...data },
    });
  }

  cancelRsvp(eventId: string, memberId: string) {
    return this.prisma.eventRsvp.updateMany({ where: { eventId, memberId }, data: { status: 'cancelled' } });
  }

  findChapterByName(name: string) {
    return this.prisma.chapter.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  }

  createProposal(data: Prisma.EventUncheckedCreateInput, hostId: string) {
    return this.prisma.event.create({ data: { ...data, proposedById: hostId, hosts: { create: { memberId: hostId } } } });
  }
}
