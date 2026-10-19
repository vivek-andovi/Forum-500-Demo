import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

const MEMBER_CARD = { select: { id: true, slug: true, fullName: true, avatarUrl: true, headline: true, company: true } } as const;

/** Member-to-member direct messages. */
@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  listConversations(memberId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { memberId } } },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: { include: { member: MEMBER_CARD } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  findConversationFor(conversationId: string, memberId: string) {
    return this.prisma.conversation.findFirst({
      where: { id: conversationId, participants: { some: { memberId } } },
      include: { participants: { include: { member: MEMBER_CARD } } },
    });
  }

  listMessages(conversationId: string, take = 200) {
    return this.prisma.message.findMany({
      where: { conversationId }, orderBy: { createdAt: 'desc' }, take, include: { sender: { select: { fullName: true } } },
    });
  }

  markRead(conversationId: string, memberId: string) {
    return this.prisma.conversationParticipant.updateMany({ where: { conversationId, memberId }, data: { lastReadAt: new Date() } });
  }

  /** Find or create the single 1:1 conversation for a pair of members. */
  findOrCreatePair(a: string, b: string) {
    const pairKey = [a, b].sort().join(':');
    return this.prisma.conversation.upsert({
      where: { pairKey },
      update: {},
      create: { pairKey, participants: { create: [{ memberId: a }, { memberId: b }] } },
    });
  }

  addMessage(conversationId: string, senderId: string, body: string) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({ data: { conversationId, senderId, body } });
      await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: message.createdAt } });
      await tx.conversationParticipant.updateMany({ where: { conversationId, memberId: senderId }, data: { lastReadAt: message.createdAt } });
      return message;
    });
  }
}
