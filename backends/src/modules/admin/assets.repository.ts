import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Uploaded files (media library). */
@Injectable()
export class AssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AssetUncheckedCreateInput) {
    return this.prisma.asset.create({ data });
  }

  findByKey(storageKey: string) {
    return this.prisma.asset.findFirst({ where: { storageKey } });
  }
}
