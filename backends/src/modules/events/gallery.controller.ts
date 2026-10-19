import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { GalleryService } from './gallery.service';

/** Gallery (/events/gallery) and "My gallery" on the profile. */
@ApiTags('events')
@ApiBearerAuth()
@Controller('v1/gallery')
export class GalleryController {
  constructor(private readonly gallery: GalleryService) {}

  @Get('albums')
  albums(@CurrentUser() user: AuthUser) {
    return this.gallery.albums(user);
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.gallery.mine(user);
  }

  @Post('photos/:id/tag')
  @HttpCode(200)
  tag(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.gallery.tag(user, id);
  }

  @Delete('photos/:id/tag')
  untag(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.gallery.untag(user, id);
  }
}
