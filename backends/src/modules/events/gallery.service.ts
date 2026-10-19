import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { GalleryRepository } from './gallery.repository';

@Injectable()
export class GalleryService {
  constructor(private readonly repo: GalleryRepository) {}

  async albums(user: AuthUser) {
    const [albums, tags] = await Promise.all([
      this.repo.listPublishedAlbums(),
      user.memberId ? this.repo.tagsOf(user.memberId) : [],
    ]);
    return { albums, taggedPhotoIds: tags.map((t) => t.photoId) };
  }

  async mine(user: AuthUser) {
    return (await this.repo.taggedPhotos(requireMember(user))).map((t) => t.photo);
  }

  async tag(user: AuthUser, photoId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findPublishedPhoto(photoId))) throw new NotFoundException('Photo not found');
    await this.repo.tag(memberId, photoId);
    return { ok: true };
  }

  async untag(user: AuthUser, photoId: string) {
    await this.repo.untag(requireMember(user), photoId);
    return { ok: true };
  }
}
