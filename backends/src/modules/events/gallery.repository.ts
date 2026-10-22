import { Injectable } from '@nestjs/common';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';
import { softDeleteMany } from '../../core/prisma/soft-delete';

@Injectable()
export class GalleryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublishedAlbums() {
    return this.prisma.galleryAlbum.findMany({
      where: PUBLISHED, orderBy: { sortOrder: 'asc' }, include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  tagsOf(memberId: string) {
    return this.prisma.memberPhotoTag.findMany({ where: { memberId } });
  }

  taggedPhotos(memberId: string) {
    return this.prisma.memberPhotoTag.findMany({
      where: { memberId, photo: { album: PUBLISHED } },
      orderBy: { createdAt: 'desc' },
      include: { photo: { include: { album: true } } },
    });
  }

  findPublishedPhoto(id: string) {
    return this.prisma.galleryPhoto.findFirst({ where: { id, album: PUBLISHED } });
  }

  tag(memberId: string, photoId: string) {
    return this.prisma.memberPhotoTag.upsert({
      where: { memberId_photoId: { memberId, photoId } }, update: {}, create: { memberId, photoId },
    });
  }

  untag(memberId: string, photoId: string) {
    return softDeleteMany(this.prisma, 'MemberPhotoTag', { memberId, photoId });
  }
}
