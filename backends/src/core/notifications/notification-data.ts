import { Prisma } from '@prisma/client';

/**
 * The one place that defines what an in-app "decision" notification looks like
 * (the member is told an admin approved / rejected something they submitted).
 *
 * Used two ways, on purpose:
 *  - NotificationsService.notifyApproval() writes it on its own (e.g. generic admin status changes).
 *  - Repositories that already run a Prisma transaction (profile review, pitch decisions) pass it to
 *    `tx.notification.create({ data })` so the notification commits or rolls back together with the
 *    decision. Correctness beats tidiness there: routing those writes through the service would
 *    move them outside the transaction.
 */
export function approvalNotification(
  memberId: string,
  title: string,
  extra: { body?: string | null; link?: string } = {},
): Prisma.NotificationUncheckedCreateInput {
  return { memberId, type: 'approval', title, body: extra.body, link: extra.link };
}
