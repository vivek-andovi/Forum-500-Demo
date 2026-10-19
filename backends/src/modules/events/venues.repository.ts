import { Injectable } from '@nestjs/common';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class VenuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.venue.findMany({ where: PUBLISHED, orderBy: { sortOrder: 'asc' }, omit: { privateAddress: true } });
  }
}
