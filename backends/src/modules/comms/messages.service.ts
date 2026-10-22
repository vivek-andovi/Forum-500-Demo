import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { MembersService } from '../membership/members.service';
import { MessagesRepository } from './messages.repository';

export const NewMessageSchema = z.object({ recipientMemberId: z.string().uuid(), body: z.string().trim().min(1).max(4000) });
export const ReplySchema = z.object({ body: z.string().trim().min(1).max(4000) });

@Injectable()
export class MessagesService {
  constructor(
    private readonly repo: MessagesRepository,
    private readonly members: MembersService,
  ) {}

  /** Inbox: one row per conversation with the other member, last message and unread flag. */
  async inbox(user: AuthUser) {
    const memberId = requireMember(user);
    const conversations = await this.repo.listConversations(memberId);
    return conversations.map((c) => {
      const me = c.participants.find((p) => p.memberId === memberId);
      const other = c.participants.find((p) => p.memberId !== memberId)?.member ?? null;
      const last = c.messages[0] ?? null;
      return {
        id: c.id,
        otherMember: other,
        lastMessage: last ? { body: last.body, createdAt: last.createdAt, mine: last.senderId === memberId } : null,
        lastMessageAt: c.lastMessageAt,
        unread: !!last && last.senderId !== memberId && (!me?.lastReadAt || me.lastReadAt < last.createdAt),
      };
    });
  }

  /** Full thread (oldest first); opening it marks it read. */
  async thread(user: AuthUser, conversationId: string) {
    const memberId = requireMember(user);
    const conversation = await this.repo.findConversationFor(conversationId, memberId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    const messages = await this.repo.listMessages(conversationId);
    await this.repo.markRead(conversationId, memberId);
    return {
      id: conversation.id,
      otherMember: conversation.participants.find((p) => p.memberId !== memberId)?.member ?? null,
      messages: messages.reverse().map(({ sender, ...m }) => ({ ...m, senderName: sender?.fullName ?? 'Former member', mine: m.senderId === memberId })),
    };
  }

  async start(user: AuthUser, input: z.infer<typeof NewMessageSchema>) {
    const memberId = requireMember(user);
    if (input.recipientMemberId === memberId) throw new BadRequestException('You cannot message yourself');
    if (!(await this.members.findPublishedById(input.recipientMemberId))) throw new NotFoundException('Member not found');
    const conversation = await this.repo.findOrCreatePair(memberId, input.recipientMemberId);
    const message = await this.repo.addMessage(conversation.id, memberId, input.body);
    return { conversationId: conversation.id, message: { ...message, mine: true } };
  }

  async reply(user: AuthUser, conversationId: string, body: string) {
    const memberId = requireMember(user);
    const conversation = await this.repo.findConversationFor(conversationId, memberId);
    if (!conversation) throw new NotFoundException('Conversation not found');
    // The other member was deleted: keep the history readable, but nobody would receive a reply.
    if (!conversation.participants.some((p) => p.memberId !== memberId)) {
      throw new BadRequestException('This member is no longer in the club');
    }
    const message = await this.repo.addMessage(conversationId, memberId, body);
    return { conversationId, message: { ...message, mine: true } };
  }
}
