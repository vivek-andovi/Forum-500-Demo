import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Actor } from '../../core/audit/audit.service';
import { CurrentActor, Roles } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { AdminWorkflowsService } from './admin-workflows.service';

const NoteSchema = z.object({ note: z.string().trim().max(2000).optional() }).default({});
const RejectSchema = z
  .object({ note: z.string().trim().max(2000).optional(), status: z.enum(['rejected', 'waitlisted']).default('rejected') })
  .default({});
const Uuid = new ParseUUIDPipe({ version: '4' });

@ApiTags('admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminWorkflowsController {
  constructor(private readonly wf: AdminWorkflowsService) {}

  @Get('dashboard')
  dashboard() {
    return this.wf.dashboard();
  }

  @Get('approvals')
  approvals() {
    return this.wf.approvals();
  }

  @Post('applications/:id/approve')
  @HttpCode(200)
  approveApplication(@Param('id', Uuid) id: string, @Body() body: unknown, @CurrentActor() a: Actor) {
    return this.wf.approveApplication(id, parseBody(NoteSchema, body ?? {}).note, a);
  }

  @Post('applications/:id/reject')
  @HttpCode(200)
  rejectApplication(@Param('id', Uuid) id: string, @Body() body: unknown, @CurrentActor() a: Actor) {
    const { note, status } = parseBody(RejectSchema, body ?? {});
    return this.wf.rejectApplication(id, note, status, a);
  }

  @Post('profile-revisions/:id/approve')
  @HttpCode(200)
  approveRevision(@Param('id', Uuid) id: string, @CurrentActor() a: Actor) {
    return this.wf.approveRevision(id, a);
  }

  @Post('profile-revisions/:id/reject')
  @HttpCode(200)
  rejectRevision(@Param('id', Uuid) id: string, @Body() body: unknown, @CurrentActor() a: Actor) {
    return this.wf.rejectRevision(id, parseBody(NoteSchema, body ?? {}).note, a);
  }

  @Post('pitches/:id/accept')
  @HttpCode(200)
  acceptPitch(@Param('id', Uuid) id: string, @CurrentActor() a: Actor) {
    return this.wf.acceptPitch(id, a);
  }

  @Post('pitches/:id/decline')
  @HttpCode(200)
  declinePitch(@Param('id', Uuid) id: string, @CurrentActor() a: Actor) {
    return this.wf.declinePitch(id, a);
  }

  /** Email a (new) set-password link — for invited members or forgotten passwords. */
  @Post('users/:id/send-invite')
  @HttpCode(200)
  sendInvite(@Param('id', Uuid) id: string, @CurrentActor() a: Actor) {
    return this.wf.sendInvite(id, a);
  }

  /** Sign the user out of every device immediately. */
  @Post('users/:id/revoke-sessions')
  @HttpCode(200)
  revokeSessions(@Param('id', Uuid) id: string, @CurrentActor() a: Actor) {
    return this.wf.revokeSessions(id, a);
  }
}
