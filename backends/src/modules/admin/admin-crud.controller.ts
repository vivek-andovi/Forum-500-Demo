import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Actor } from '../../core/audit/audit.service';
import { CurrentActor, Roles } from '../../core/auth/decorators';
import { AdminCrudService } from './admin-crud.service';

const body = (b: unknown): Record<string, any> => (b && typeof b === 'object' && !Array.isArray(b) ? (b as Record<string, any>) : {});

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminCrudController {
  constructor(private readonly crud: AdminCrudService) {}

  @Get('meta')
  meta() {
    return this.crud.meta();
  }

  @Get('options/:resource')
  options(@Param('resource') resource: string, @Query('search') search?: string, @Query('ids') ids?: string) {
    return this.crud.options(resource, search?.slice(0, 100), ids?.slice(0, 2000));
  }

  @Get('r/:resource')
  list(@Param('resource') resource: string, @Query() query: Record<string, any>) {
    return this.crud.list(resource, query);
  }

  @Get('r/:resource/:id')
  get(@Param('resource') resource: string, @Param('id') id: string) {
    return this.crud.get(resource, id);
  }

  @Post('r/:resource')
  create(@Param('resource') resource: string, @Body() b: unknown, @CurrentActor() actor: Actor) {
    return this.crud.create(resource, body(b), actor);
  }

  @Patch('r/:resource/:id')
  update(@Param('resource') resource: string, @Param('id') id: string, @Body() b: unknown, @CurrentActor() actor: Actor) {
    return this.crud.update(resource, id, body(b), actor);
  }

  @Delete('r/:resource/:id')
  remove(@Param('resource') resource: string, @Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.crud.remove(resource, id, actor);
  }

  @Post('r/:resource/:id/status')
  @HttpCode(200)
  status(@Param('resource') resource: string, @Param('id') id: string, @Body('status') status: string, @CurrentActor() actor: Actor) {
    return this.crud.setStatus(resource, id, String(status ?? ''), actor);
  }
}
