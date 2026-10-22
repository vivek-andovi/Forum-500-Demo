import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../../core/notifications/notifications.service';
import { AdminCrudRepository } from './admin-crud.repository';
import { ResourceConfig } from './resources';

const APPROVED = ['published', 'approved', 'accepted', 'answered'];
const REJECTED = ['rejected', 'declined'];

/**
 * Side effects of an admin changing a record's status through the generic CRUD
 * (PATCH or `POST /admin/r/:resource/:id/status`): tell the member when an admin
 * decides on something they submitted. Add a `case` here for a new member-submitted model.
 */
@Injectable()
export class AdminStatusEffectsService {
  constructor(
    private readonly repo: AdminCrudRepository,
    private readonly notifications: NotificationsService,
  ) {}

  async afterStatusChange(res: ResourceConfig, row: any, status: string) {
    const approved = APPROVED.includes(status);
    const rejected = REJECTED.includes(status);
    if (!approved && !rejected) return;
    const verdict = approved ? 'approved' : 'not approved';
    let memberId: string | null = null;
    let title = '';
    let link: string | undefined;
    let body: string | undefined;
    switch (res.model) {
      case 'Event':
        memberId = row.proposedById; title = `Your event “${row.title}” was ${verdict}`; link = approved ? `/events/${row.slug}` : '/events/my-events';
        break;
      case 'BenefitOffer':
        memberId = row.providerMemberId; title = `Your benefit “${row.title}” was ${verdict}`; link = '/membership/benefits';
        break;
      case 'Group':
        memberId = row.proposedById; title = `Your group “${row.name}” was ${verdict}`; link = '/membership/groups';
        break;
      case 'GroupMembership': {
        const g = await this.repo.findGroupName(row.groupId);
        memberId = row.memberId; title = `Your request to join “${g?.name}” was ${verdict}`; link = '/membership/groups';
        break;
      }
      case 'WhatsappMembership': {
        const g = await this.repo.findWhatsappGroup(row.groupId);
        memberId = row.memberId; title = `Your request to join the ${g?.name} WhatsApp group was ${verdict}`;
        link = '/comms/whatsapp'; body = approved && g?.inviteLink ? `Join here: ${g.inviteLink}` : undefined;
        break;
      }
      case 'FeedPost':
        memberId = row.memberId; title = `Your newsfeed post was ${verdict}`; link = '/media/newsfeed';
        break;
      case 'Comment':
        memberId = row.memberId; title = `Your comment was ${verdict}`; link = '/media/inforum';
        break;
      case 'Recommendation':
        memberId = row.memberId; title = `Your recommendation “${row.title}” was ${verdict}`; link = '/media/inforum';
        break;
      case 'ConciergeRequest':
        memberId = row.memberId; title = 'The Forum team replied to your Ask Zola request'; body = row.adminReply ?? undefined; link = '/ask-zola';
        break;
      default:
        return;
    }
    if (memberId) {
      await this.notifications.notifyApproval(memberId, title, { body, link });
    }
  }
}
