import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MembersService } from './members.service';

/** Member directory (/membership). */
@ApiTags('membership')
@ApiBearerAuth()
@Controller('v1/members')
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('sectorId') sectorId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('interest') interest?: string,
  ) {
    return this.members.list({ search, sectorId, chapterId, interest });
  }

  @Get('new')
  newMembers() {
    return this.members.newMembers();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.members.get(slug);
  }
}
