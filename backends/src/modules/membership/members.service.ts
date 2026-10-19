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
}
