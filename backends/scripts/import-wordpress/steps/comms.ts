import { Ctx, IMPORT_ACTOR } from '../lib/context';
import { cleanMailpoetShortcodes, renderMailpoet } from '../lib/mailpoet';
import { Media } from '../lib/media';
import { phpUnserialize } from '../lib/php';
import { decodeEntities, htmlToText, mysqlUtc, nameKey, titleCase, truncate } from '../lib/text';
import { loadMembersFromMap, People, WHATSAPP_CITY } from './people';

export async function importComms(ctx: Ctx, media: Media, people: People) {
  const { db } = ctx;
  const ensurePeople = async () => {
    if (!people.memberByUser.size) await loadMembersFromMap(ctx, people);
    if (!people.chapterByKey.size) for (const c of await db.chapter.findMany({ select: { id: true, name: true } })) people.chapterByKey.set(nameKey(c.name), c.id);
  };

  // ───────────── WhatsApp groups ─────────────
  await ctx.step('whatsapp', async () => {
    await ensurePeople();
    const rows = await ctx.q<{ id: number; title: string; status: string; info: string | null; ord: number }>(
      `SELECT p.ID id, p.post_title title, p.post_status status, p.menu_order ord,
         (SELECT meta_value FROM {postmeta} WHERE post_id = p.ID AND meta_key = 'nta_wa_account_info' LIMIT 1) info
       FROM {posts} p WHERE p.post_type = 'whatsapp-accounts' AND p.post_status IN ('publish', 'draft') ORDER BY p.ID`,
    );
    ctx.report.expect('whatsapp group', rows.length);
    const existing = await db.whatsappGroup.findMany({ select: { id: true, name: true } });
    for (const [i, r] of rows.entries()) {
      const info = phpUnserialize(r.info) ?? {};
      const target = String(info.number ?? '').trim();
      const inviteLink = /^https?:\/\//.test(target) ? target : target.replace(/\D/g, '') ? `https://wa.me/${target.replace(/\D/g, '')}` : null;
      const raw = decodeEntities(r.title).trim();
      const name = raw === 'ForumWAGroup' ? 'Forum (general)' : titleCase(raw.toUpperCase());
      const cityWord = Object.keys(WHATSAPP_CITY).find((w) => raw.toUpperCase().startsWith(w));
      const chapterId = cityWord ? people.chapterByKey.get(nameKey(WHATSAPP_CITY[cityWord])) ?? null : null;
      const data = { name, inviteLink, chapterId, active: r.status === 'publish', sortOrder: i };
      await ctx.upsert('whatsapp', r.id, 'WhatsappGroup', {
        find: async () => existing.find((g) => nameKey(g.name) === nameKey(name)) ?? null,
        create: () => db.whatsappGroup.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.whatsappGroup.update({ where: { id }, data }),
        exists: async (id) => !!(await db.whatsappGroup.findUnique({ where: { id }, select: { id: true } })),
      });
    }
    // On the old site every member could join any group straight away.
    if (!ctx.opt.dryRun) {
      const cur = await db.setting.findUnique({ where: { key: 'features' } });
      const value = { ...((cur?.value as object) ?? {}), whatsappOpenAccess: true };
      await db.setting.upsert({ where: { key: 'features' }, create: { key: 'features', value, createdBy: IMPORT_ACTOR }, update: { value } });
    }
  });

  // ───────────── Private messages (HivePress) ─────────────
  await ctx.step('messages', async () => {
    await ensurePeople();
    const rows = await ctx.q<{ id: number; sender: number; recipient: number; body: string; at: string; read: string }>(
      `SELECT comment_ID id, user_id sender, comment_karma recipient, comment_content body, comment_date_gmt at, comment_approved \`read\`
       FROM {comments} WHERE comment_type = 'hp_message' ORDER BY comment_date_gmt, comment_ID`,
    );
    ctx.report.expect('message', rows.length);
    const threads = new Map<string, { a: string; b: string; rows: typeof rows }>();
    for (const r of rows) {
      const from = people.memberByUser.get(Number(r.sender));
      const to = people.memberByUser.get(Number(r.recipient));
      if (!from || !to || from === to) {
        ctx.report.issue('Messages not imported', `#${r.id}: sender ${r.sender} or recipient ${r.recipient} has no member profile`);
        continue;
      }
      const [a, b] = [from, to].sort();
      const key = `${a}:${b}`;
      const t = threads.get(key) ?? { a, b, rows: [] };
      t.rows.push(r);
      threads.set(key, t);
    }
    for (const [pairKey, t] of threads) {
      const last = mysqlUtc(t.rows[t.rows.length - 1].at) ?? new Date();
      const conversationId = await ctx.upsert('conversation', pairKey, 'Conversation', {
        find: () => db.conversation.findUnique({ where: { pairKey }, select: { id: true } }),
        create: () =>
          db.conversation.create({
            data: { pairKey, lastMessageAt: last, createdAt: mysqlUtc(t.rows[0].at) ?? undefined, createdBy: IMPORT_ACTOR, participants: { create: [{ memberId: t.a }, { memberId: t.b }] } },
          }),
        update: (id) => db.conversation.update({ where: { id }, data: { lastMessageAt: last } }),
        exists: async (id) => !!(await db.conversation.findUnique({ where: { id }, select: { id: true } })),
      });
      if (!conversationId) continue;
      for (const r of t.rows) {
        const senderId = people.memberByUser.get(Number(r.sender))!;
        const body = htmlToText(r.body) || r.body.trim();
        await ctx.upsert('message', r.id, 'Message', {
          create: () => db.message.create({ data: { conversationId, senderId, body, createdAt: mysqlUtc(r.at) ?? undefined, createdBy: IMPORT_ACTOR } }),
          exists: async (id) => !!(await db.message.findUnique({ where: { id }, select: { id: true } })),
        });
      }
      if (ctx.opt.dryRun) continue;
      // A participant has read the thread up to their own latest message, or the latest message sent to them that they opened.
      for (const memberId of [t.a, t.b]) {
        let lastRead: Date | null = null;
        for (const r of t.rows) {
          const mine = people.memberByUser.get(Number(r.sender)) === memberId;
          if (mine || r.read === '1') lastRead = mysqlUtc(r.at);
        }
        await db.conversationParticipant.updateMany({ where: { conversationId, memberId }, data: { lastReadAt: lastRead } });
      }
    }
    ctx.report.count('conversation (threads)', 'total', threads.size);
  });

  // ───────────── Newsletters (MailPoet) ─────────────
  await ctx.step('newsletters', async () => {
    await ensurePeople();
    const subs = await ctx.q<{ id: number; email: string; first: string; last: string; status: string; created: string }>(
      `SELECT id, email, first_name first, last_name last, status, created_at created FROM {mailpoet_subscribers} WHERE deleted_at IS NULL`,
    );
    const emailOf = new Map(subs.map((s) => [s.id, s.email.trim().toLowerCase()]));
    const lists = await ctx.q<{ sid: number; name: string }>(
      `SELECT ss.subscriber_id sid, s.name FROM {mailpoet_subscriber_segment} ss JOIN {mailpoet_segments} s ON s.id = ss.segment_id
       WHERE ss.status = 'subscribed' AND s.deleted_at IS NULL AND s.type = 'default'`,
    );
    ctx.report.expect('subscriber', subs.length);
    for (const s of subs) {
      const email = s.email.trim().toLowerCase();
      const memberId = people.memberByEmail.get(email) ?? null;
      const data = {
        email, name: [s.first, s.last].map((x) => (x ?? '').trim()).filter(Boolean).join(' ') || null, status: s.status,
        lists: lists.filter((l) => l.sid === s.id).map((l) => l.name), source: 'wordpress-mailpoet', memberId,
      };
      await ctx.upsert('subscriber', s.id, 'Subscriber', {
        find: () => db.subscriber.findUnique({ where: { email }, select: { id: true } }),
        create: () => db.subscriber.create({ data: { ...data, createdAt: mysqlUtc(s.created) ?? undefined, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.subscriber.update({ where: { id }, data }),
        exists: async (id) => !!(await db.subscriber.findUnique({ where: { id }, select: { id: true } })),
      });
      if (!memberId) ctx.report.count('subscriber', 'not a member');
    }

    const letters = await ctx.q<{ id: number; subject: string; body: string; sentAt: string; sender: string | null; preheader: string | null; rendered: string | null }>(
      `SELECT n.id, n.subject, n.body, n.sent_at sentAt, n.sender_name sender, n.preheader,
         (SELECT q.newsletter_rendered_body FROM {mailpoet_sending_queues} q WHERE q.newsletter_id = n.id AND q.newsletter_rendered_body IS NOT NULL ORDER BY q.id DESC LIMIT 1) rendered
       FROM {mailpoet_newsletters} n WHERE n.status = 'sent' AND n.deleted_at IS NULL ORDER BY n.sent_at`,
    );
    ctx.report.expect('newsletter', letters.length);
    for (const n of letters) {
      let html: string | null = null;
      let text: string | null = null;
      try {
        const r = n.rendered ? JSON.parse(n.rendered) : null;
        html = r?.html ?? null;
        text = r?.text ?? null;
      } catch {
        // fall through to rendering the editor content
      }
      if (html) ctx.report.count('newsletter', 'exact HTML');
      else {
        html = renderMailpoet(n.body, n.subject);
        ctx.report.count('newsletter', 'rebuilt from editor content');
      }
      if (!html) {
        ctx.report.issue('Newsletters not imported', `"${n.subject}" (#${n.id}): no content`);
        continue;
      }
      html = await media.rewriteHtml(cleanMailpoetShortcodes(html));
      const body = (text ? cleanMailpoetShortcodes(text) : htmlToText(html)).trim();
      const sentAt = mysqlUtc(n.sentAt);
      const data = {
        subject: decodeEntities(n.subject), senderLabel: n.sender?.trim() || 'Forum Team', status: 'sent' as const, sentAt, html, body,
        preview: truncate((n.preheader?.trim() || body.replace(/\s+/g, ' ')).trim(), 180),
      };
      const campaignId = await ctx.upsert('newsletter', n.id, 'EmailCampaign', {
        create: () => db.emailCampaign.create({ data: { ...data, createdAt: sentAt ?? undefined, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.emailCampaign.update({ where: { id }, data }),
        exists: async (id) => !!(await db.emailCampaign.findUnique({ where: { id }, select: { id: true } })),
      });
      if (!campaignId) continue;

      // The old Newsletter Archive showed every newsletter to every member, so by default no recipient rows are
      // written (a campaign without recipients is visible to all members). --newsletter-recipients imports who
      // received / opened each one instead, which limits each newsletter to its recipients.
      if (!ctx.opt.newsletterRecipients) continue;
      const sent = await ctx.q<{ sid: number }>(`SELECT DISTINCT subscriber_id sid FROM {mailpoet_statistics_newsletters} WHERE newsletter_id = ?`, [n.id]);
      const opens = await ctx.q<{ sid: number; at: string }>(
        `SELECT subscriber_id sid, MIN(created_at) at FROM {mailpoet_statistics_opens} WHERE newsletter_id = ? GROUP BY subscriber_id`, [n.id],
      );
      const openedAt = new Map(opens.map((o) => [o.sid, mysqlUtc(o.at)]));
      const deliveries = new Map<string, Date | null>();
      for (const { sid } of sent) {
        const memberId = people.memberByEmail.get(emailOf.get(sid) ?? '');
        if (memberId) deliveries.set(memberId, openedAt.get(sid) ?? null);
      }
      ctx.report.count('newsletter delivery (member)', 'rows', deliveries.size);
      if (ctx.opt.dryRun || !deliveries.size) continue;
      await db.emailDelivery.createMany({
        data: [...deliveries].map(([memberId, opened]) => ({ campaignId, memberId, openedAt: opened, createdBy: IMPORT_ACTOR })),
        skipDuplicates: true,
      });
    }
    await ctx.redirect('/newsletter-archive/', '/comms/emails');
  });
}
