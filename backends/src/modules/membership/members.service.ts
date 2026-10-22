import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { MembersRepository } from './members.repository';

@Injectable()
export class MembersService {
  constructor(private readonly repo: MembersRepository) {}

  list(filter: { search?: string; sectorId?: string; chapterId?: string }) {
    return this.repo.listPublished({ ...filter, search: filter.search?.slice(0, 100) });
  }

  newMembers() {
    return this.repo.listFeaturedNew();
  }

  async get(slug: string) {
    const member = await this.repo.findPublishedBySlugOrId(slug, z.string().uuid().safeParse(slug).success);
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  // ── Reads used by other modules (e.g. the dashboard)

  findById(id: string) {
    return this.repo.findById(id);
  }

  findPublishedById(id: string) {
    return this.repo.findPublishedById(id);
  }

  /** Author details (name, photo, chapter) used when a member posts content. */
  findAuthor(id: string) {
    return this.repo.findAuthor(id);
  }
}
