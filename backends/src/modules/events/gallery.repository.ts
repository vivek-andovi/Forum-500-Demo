import { Injectable } from '@nestjs/common';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

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
      where: { memberId }, orderBy: { createdAt: 'desc' }, include: { photo: { include: { album: true } } },
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
    return this.prisma.memberPhotoTag.deleteMany({ where: { memberId, photoId } });
  }
}
