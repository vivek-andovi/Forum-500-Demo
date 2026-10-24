import { Prisma } from '@prisma/client';
import { isLegacyHash } from '../../../src/core/auth/legacy-password';
import { softDelete } from '../../../src/core/prisma/soft-delete';
import { Ctx, IMPORT_ACTOR } from '../lib/context';
import { Media } from '../lib/media';
import { phpUnserialize } from '../lib/php';
import { decodeEntities, htmlToParagraphs, htmlToText, mysqlUtc, nameKey, slugify, titleCase } from '../lib/text';

/**
 * Cities that are Forum chapters (have a WhatsApp group or their own events on the old site).
 * Every other city in the old directory is imported as a non-chapter city.
 */
const CHAPTER_CITIES = [
  'New York', 'London', 'Zürich', 'Singapore', 'Chicago', 'Dubai', 'Vienna', 'Los Angeles', 'Lisbon',
  'Tel Aviv', 'Milan', 'Nassau', 'Montevideo', 'Mumbai',
];
/** WhatsApp groups on the old site (city word in the group name → chapter). */
export const WHATSAPP_CITY: Record<string, string> = {
  LONDON: 'London', 'NEW YORK': 'New York', SINGAPORE: 'Singapore', SWITZERLAND: 'Zürich', 'TEL AVIV': 'Tel Aviv',
  VIENNA: 'Vienna', CHICAGO: 'Chicago', LISBON: 'Lisbon', MILAN: 'Milan', BAHAMAS: 'Nassau', UAE: 'Dubai', MONTEVIDEO: 'Montevideo',
};

interface Listing {
  id: number; author: number; title: string; slug: string; status: string; content: string; date: string; modified: string;
  position: string | null; thumb: string | null; verified: string | null;
}
interface WpUser {
  id: number; email: string; pass: string; registered: string; display: string; first: string | null; last: string | null;
  lastLogin: string | null; caps: string | null; linkedin: string | null;
}

/** Shared between steps: who became which member. */
export interface People {
  memberByUser: Map<number, string>;
  memberByName: Map<string, { id: string; slug: string; name: string }>;
  memberSlug: Map<string, string>; // member id → slug
  memberByEmail: Map<string, string>;
  chapterByKey: Map<string, string>; // nameKey(city) → chapter id
}

export async function importPeople(ctx: Ctx, media: Media, people: People) {
  const { db } = ctx;
  const p = ctx.opt.prefix;

  // ───────────── Chapters (cities) and sectors ─────────────
  await ctx.step('lookups', async () => {
    const terms = await ctx.q<{ termId: number; name: string; tax: string; n: number }>(
      `SELECT t.term_id termId, t.name, tt.taxonomy tax, tt.count n FROM {term_taxonomy} tt JOIN {terms} t USING(term_id)
       WHERE tt.taxonomy IN ('hp_listing_member_region', 'hp_listing_category') ORDER BY tt.count DESC, t.name`,
    );
    const existingChapters = await db.chapter.findMany({ select: { id: true, name: true } });
    const chapterKeys = new Set(CHAPTER_CITIES.map(nameKey));
    const regions = terms.filter((t) => t.tax === 'hp_listing_member_region');
    ctx.report.expect('region', regions.length);
    for (const [i, t] of regions.entries()) {
      const name = decodeEntities(t.name).trim();
      const isChapter = chapterKeys.has(nameKey(name));
      const data = { name, isChapter, whatsappEnabled: Object.values(WHATSAPP_CITY).some((c) => nameKey(c) === nameKey(name)), sortOrder: i };
      const id = await ctx.upsert('region', t.termId, 'Chapter', {
        find: async () => existingChapters.find((c) => nameKey(c.name) === nameKey(name)) ?? null,
        create: () => db.chapter.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.chapter.update({ where: { id }, data: { isChapter, whatsappEnabled: data.whatsappEnabled } }),
        exists: async (id) => !!(await db.chapter.findUnique({ where: { id }, select: { id: true } })),
      });
      if (id) people.chapterByKey.set(nameKey(name), id);
    }
    const existingSectors = await db.sector.findMany({ select: { id: true, name: true } });
    const categories = terms.filter((t) => t.tax === 'hp_listing_category');
    ctx.report.expect('category', categories.length);
    for (const [i, t] of categories.entries()) {
      const name = decodeEntities(t.name).trim();
      await ctx.upsert('category', t.termId, 'Sector', {
        find: async () => existingSectors.find((s) => nameKey(s.name) === nameKey(name)) ?? null,
        create: () => db.sector.create({ data: { name, sortOrder: i, createdBy: IMPORT_ACTOR } }),
        exists: async (id) => !!(await db.sector.findUnique({ where: { id }, select: { id: true } })),
      });
    }
  });

  // Chapters may come from an earlier run when --only skips "lookups".
  if (!people.chapterByKey.size) {
    for (const c of await db.chapter.findMany({ select: { id: true, name: true } })) people.chapterByKey.set(nameKey(c.name), c.id);
  }

  // ───────────── Load users and listings ─────────────
  const meta = (key: string) => `(SELECT meta_value FROM {usermeta} WHERE user_id = u.ID AND meta_key = '${key}' LIMIT 1)`;
  const users = await ctx.q<WpUser>(
    `SELECT u.ID id, u.user_email email, u.user_pass pass, u.user_registered registered, u.display_name display,
       ${meta('first_name')} first, ${meta('last_name')} last, ${meta('_last_login')} lastLogin,
       ${meta(`${p}capabilities`)} caps, COALESCE(${meta('linkedin')}, ${meta('user_linkedin')}) linkedin
     FROM {users} u ORDER BY u.ID`,
  );
  const pmeta = (key: string) => `(SELECT meta_value FROM {postmeta} WHERE post_id = p.ID AND meta_key = '${key}' LIMIT 1)`;
  const listings = await ctx.q<Listing>(
    `SELECT p.ID id, p.post_author author, p.post_title title, p.post_name slug, p.post_status status, p.post_content content,
       p.post_date_gmt date, p.post_modified_gmt modified, ${pmeta('hp_member_position')} position, ${pmeta('_thumbnail_id')} thumb,
       ${pmeta('hp_verified')} verified
     FROM {posts} p WHERE p.post_type = 'hp_listing' AND p.post_status IN ('publish', 'draft', 'private', 'pending') ORDER BY p.ID`,
  );
  const termRows = await ctx.q<{ id: number; tax: string; termId: number; name: string; ord: number }>(
    `SELECT tr.object_id id, tt.taxonomy tax, t.term_id termId, t.name, tr.term_order ord
     FROM {term_relationships} tr JOIN {term_taxonomy} tt USING(term_taxonomy_id) JOIN {terms} t USING(term_id)
     WHERE tt.taxonomy IN ('hp_listing_category', 'hp_listing_member_interest', 'hp_listing_member_region')
     ORDER BY tr.object_id, tr.term_order, t.name`,
  );
  const termsOf = (id: number, tax: string) => termRows.filter((r) => r.id === id && r.tax === tax);
  ctx.report.expect('user', users.length);
  ctx.report.expect('listing', listings.length);

  // Staff accounts created several listings on behalf of members; real people have at most a duplicate or two.
  const byAuthor = new Map<number, Listing[]>();
  for (const l of listings) byAuthor.set(l.author, [...(byAuthor.get(l.author) ?? []), l]);
  const staffAuthors = new Set([...byAuthor].filter(([, ls]) => ls.length >= 4).map(([a]) => a));
  const skipped = new Set<number>();
  const primaryOf = new Map<number, number>(); // author → their own listing id
  for (const [author, ls] of byAuthor) {
    if (staffAuthors.has(author)) continue;
    const ranked = [...ls].sort((a, b) =>
      Number(/backup/i.test(a.title)) - Number(/backup/i.test(b.title)) ||
      Number(b.status === 'publish') - Number(a.status === 'publish') ||
      b.modified.localeCompare(a.modified));
    primaryOf.set(author, ranked[0].id);
    for (const extra of ranked.slice(1)) {
      skipped.add(extra.id);
      ctx.report.issue('Duplicate listings (not imported)', `"${decodeEntities(extra.title)}" (#${extra.id}, ${extra.status}): same login as "${decodeEntities(ranked[0].title)}" (#${ranked[0].id}), which was kept`);
    }
  }
  // Listings staff created for someone who also has their own login (same first + last name): link them.
  const ownerOf = new Map<number, WpUser>(); // listing id → owner
  const fullNameKey = (u: WpUser) => nameKey(`${u.first ?? ''} ${u.last ?? ''}`);
  for (const a of staffAuthors) {
    for (const l of byAuthor.get(a)!) {
      const key = nameKey(decodeEntities(l.title));
      // A staff copy of someone who also has their own listing: keep only theirs.
      const withOwnListing = users.filter((u) => u.id !== a && !staffAuthors.has(u.id) && primaryOf.has(u.id) && (fullNameKey(u) === key || nameKey(u.display ?? '') === key));
      if (withOwnListing.length === 1) {
        skipped.add(l.id);
        ctx.report.issue('Duplicate listings (not imported)', `"${decodeEntities(l.title)}" (#${l.id}, ${l.status}): staff copy of ${withOwnListing[0].email}'s own listing (#${primaryOf.get(withOwnListing[0].id)}), which was kept`);
        continue;
      }
      const matches = users.filter((u) => (fullNameKey(u) === key || nameKey(u.display ?? '') === key) && (!primaryOf.has(u.id) || u.id === a));
      if (matches.length !== 1) continue;
      const u = matches[0];
      if (u.id === a) primaryOf.set(a, l.id);
      else if (primaryOf.has(u.id)) continue;
      else primaryOf.set(u.id, l.id);
      ownerOf.set(l.id, u);
      ctx.report.issue('Listings created by staff, linked to the member’s own login by name', `${decodeEntities(l.title)} → ${u.email}`);
    }
    const u = users.find((x) => x.id === a);
    const forOthers = byAuthor.get(a)!.filter((l) => !ownerOf.has(l.id)).length;
    ctx.report.issue('Staff accounts', `${u?.email ?? a} created ${forOthers} listings for other people; those members are imported without a login (invite them later)`);
  }

  // ───────────── Users ─────────────
  const userIdOf = new Map<number, string>();
  await ctx.step('users', async () => {
    for (const u of users) {
      const email = u.email.trim().toLowerCase();
      if (!email) continue;
      const id = await ctx.upsert('user', u.id, 'User', {
        find: () => db.user.findUnique({ where: { email }, select: { id: true } }),
        create: () =>
          db.user.create({
            data: {
              email, passwordHash: u.pass || null, role: 'member', status: 'active',
              lastLoginAt: mysqlUtc(u.lastLogin), createdAt: mysqlUtc(u.registered) ?? undefined, createdBy: IMPORT_ACTOR,
            },
          }),
        // Only refresh the password if the person hasn't logged in to the new app yet (their hash is still the WordPress one).
        update: async (id) => {
          const cur = await db.user.findUnique({ where: { id }, select: { passwordHash: true } });
          if (u.pass && (!cur?.passwordHash || isLegacyHash(cur.passwordHash))) {
            await db.user.update({ where: { id }, data: { passwordHash: u.pass } });
          }
        },
        exists: async (id) => !!(await db.user.findUnique({ where: { id }, select: { id: true } })),
      });
      if (id) userIdOf.set(u.id, id);
    }
  });
  if (!userIdOf.size) for (const u of users) { const id = ctx.idOf('user', u.id); if (id) userIdOf.set(u.id, id); }

  // ───────────── Members (directory listings) ─────────────
  const takenSlugs = new Set((await db.member.findMany({ select: { slug: true } })).map((m) => m.slug));
  // A listing's own WordPress slug (post_name) is kept for it, so old /member/<slug>/ links land on the right
  // person even when another profile without a post_name, processed earlier, would derive the same slug.
  const reservedFor = new Map<string, number>();
  for (const l of listings) if (l.slug && !skipped.has(l.id)) reservedFor.set(slugify(decodeSlug(l.slug)), l.id);
  const uniqueSlug = (base: string, listingId?: number) => {
    const free = (slug: string) => !takenSlugs.has(slug) && (reservedFor.get(slug) ?? listingId) === listingId;
    let slug = base;
    for (let n = 2; !free(slug); n++) slug = `${base}-${n}`;
    takenSlugs.add(slug);
    return slug;
  };
  const sectorIds = (listingId: number) =>
    termsOf(listingId, 'hp_listing_category').map((t) => ctx.idOf('category', t.termId)).filter((x): x is string => !!x);

  const saveMember = async (
    entity: 'listing' | 'user-profile', legacyId: number, data: Omit<Prisma.MemberUncheckedCreateInput, 'slug'> & { slugBase: string },
    sectors: string[], oldUrl: string | null,
  ) => {
    const { slugBase, ...fields } = data;
    const known = ctx.idOf(entity, legacyId);
    const existingSlug = known && !ctx.opt.dryRun ? (await db.member.findUnique({ where: { id: known }, select: { slug: true } }))?.slug : undefined;
    const slug = existingSlug ?? uniqueSlug(slugBase, entity === 'listing' ? legacyId : undefined);
    const id = await ctx.upsert(entity, legacyId, 'Member', {
      find: async () => (fields.userId ? db.member.findUnique({ where: { userId: fields.userId as string }, select: { id: true } }) : null),
      create: () => db.member.create({ data: { ...fields, slug, createdBy: IMPORT_ACTOR } }),
      update: (id) => db.member.update({ where: { id }, data: fields }),
      exists: async (id) => !!(await db.member.findUnique({ where: { id }, select: { id: true } })),
    }, { oldUrl, newUrl: `/membership/${slug}` });
    if (!id) return null;
    for (const [i, sectorId] of sectors.entries()) await ctx.link('MemberSector', { memberId: id, sectorId }, { sortOrder: i }, { sortOrder: i });
    people.memberSlug.set(id, slug);
    return id;
  };

  await ctx.step('members', async () => {
    const userById = new Map(users.map((u) => [u.id, u]));
    for (const l of listings) {
      if (skipped.has(l.id)) continue;
      const name = decodeEntities(l.title).trim();
      const position = l.position ? decodeEntities(l.position).replace(/\s+/g, ' ').trim() : null;
      const parts = position ? position.split('|').map((s) => s.trim()).filter(Boolean) : [];
      const region = termsOf(l.id, 'hp_listing_member_region')[0];
      const regionName = region ? decodeEntities(region.name) : null;
      // The position line starts with the city ("LONDON | Chairman | …") unless it's only a title.
      const startsWithCity = parts.length > 1 || (parts.length === 1 && people.chapterByKey.has(nameKey(parts[0])));
      const [city, headline, company, ...rest] = startsWithCity ? parts : [null, ...parts];
      const chapterId =
        (regionName && people.chapterByKey.get(nameKey(regionName))) || (city && people.chapterByKey.get(nameKey(city))) || null;
      const owner = ownerOf.get(l.id) ?? (staffAuthors.has(l.author) ? undefined : userById.get(l.author));
      const ownsThis = owner && primaryOf.get(owner.id) === l.id;
      const userId = ownsThis ? userIdOf.get(owner.id) ?? null : null;
      const sectors = sectorIds(l.id);
      const bio = htmlToText(l.content) || null;
      const id = await saveMember('listing', l.id, {
        slugBase: slugify(decodeSlug(l.slug) || name),
        fullName: name,
        positionLine: position,
        headline: headline ?? null,
        company: company ?? null,
        companyDescription: rest.length ? rest.join(' | ') : null,
        bio,
        email: owner?.email?.toLowerCase() ?? null,
        avatarUrl: await media.url(l.thumb),
        linkedinUrl: owner?.linkedin && /^https?:\/\//.test(owner.linkedin) ? owner.linkedin : null,
        interests: termsOf(l.id, 'hp_listing_member_interest').map((t) => decodeEntities(t.name).trim()),
        joinedYear: mysqlUtc(l.date)?.getUTCFullYear() ?? null,
        chapterId,
        sectorId: sectors[0] ?? null,
        isPublished: l.status === 'publish',
        profileStatus: l.status === 'publish' ? 'published' : 'draft',
        verified: l.verified === '1',
        userId,
        createdAt: mysqlUtc(l.date) ?? undefined,
      }, sectors, l.slug ? `/member/${l.slug}/` : null);
      if (!id) continue;
      if (owner && ownsThis) people.memberByUser.set(owner.id, id);
      if (owner?.email) people.memberByEmail.set(owner.email.toLowerCase(), id);
      people.memberByName.set(nameKey(name), { id, slug: people.memberSlug.get(id)!, name });
      if (!userId && l.status === 'publish') ctx.report.issue('Members without a login', `${name} (#${l.id})`);
      if (!chapterId) ctx.report.issue('Members without a city', `${name} (#${l.id}): position "${position ?? ''}"`);
    }

    // Logins without a directory listing (including staff) get a hidden draft profile, so they can still use the
    // member app and their private messages come across.
    for (const u of users) {
      if (people.memberByUser.has(u.id) || !userIdOf.get(u.id)) continue;
      const caps = phpUnserialize(u.caps) ?? {};
      if (caps.administrator) ctx.report.issue('WordPress administrators (hidden profile; make admins later)', u.email);
      const named = [u.first, u.last].map((x) => (x ?? '').trim()).filter(Boolean).join(' ');
      const name = named || (u.display && !u.display.includes('@') ? u.display : titleCase(u.email.split('@')[0].replace(/[._-]+/g, ' ').toUpperCase()));
      const id = await saveMember('user-profile', u.id, {
        slugBase: slugify(name), fullName: decodeEntities(name), email: u.email.toLowerCase(), isPublished: false, profileStatus: 'draft',
        userId: userIdOf.get(u.id)!, joinedYear: mysqlUtc(u.registered)?.getUTCFullYear() ?? null, createdAt: mysqlUtc(u.registered) ?? undefined,
      }, [], null);
      if (id) {
        people.memberByUser.set(u.id, id);
        people.memberByEmail.set(u.email.toLowerCase(), id);
      }
    }
  });

  // ───────────── New-member Q&A interviews ─────────────
  await ctx.step('interviews', async () => {
    if (!people.memberByName.size) await loadMembersFromMap(ctx, people);
    const posts = await ctx.q<{ id: number; title: string; slug: string; content: string; date: string }>(
      `SELECT p.ID id, p.post_title title, p.post_name slug, p.post_content content, p.post_date_gmt date
       FROM {posts} p JOIN {term_relationships} tr ON tr.object_id = p.ID JOIN {term_taxonomy} tt USING(term_taxonomy_id) JOIN {terms} t USING(term_id)
       WHERE p.post_type = 'post' AND p.post_status = 'publish' AND tt.taxonomy = 'category' AND t.name = 'new member'
       ORDER BY p.post_date_gmt DESC`,
    );
    ctx.report.expect('interview (Q&A post)', posts.length);
    const featured: string[] = [];
    for (const post of posts) {
      const personName = decodeEntities(post.title).replace(/\s*Q\s*&\s*A\s*$/i, '').trim();
      const member = matchMember(people, personName);
      if (!member) {
        ctx.report.issue('Q&A posts with no matching member', `"${decodeEntities(post.title)}" (#${post.id})`);
        continue;
      }
      if (member.fuzzy) ctx.report.issue('Q&A posts matched by similar name (check)', `"${personName}" → ${member.name}`);
      const qa = parseQA(htmlToParagraphs(post.content).join('\n\n'));
      await ctx.redirect(`/${post.slug}/`, `/membership/${member.slug}`);
      if (!qa.length) {
        // A bio-only post: use it when the profile has no bio.
        const text = htmlToText(post.content);
        if (!ctx.opt.dryRun && text) {
          const cur = await db.member.findUnique({ where: { id: member.id }, select: { bio: true } });
          if (cur && !cur.bio) await db.member.update({ where: { id: member.id }, data: { bio: text } });
        }
        ctx.report.issue('Q&A posts with no questions (used as bio if empty)', `"${decodeEntities(post.title)}"`);
        continue;
      }
      for (const [i, { question, answer }] of qa.entries()) {
        await ctx.upsert('interview', `${post.id}:${i}`, 'MemberInterviewQA', {
          create: () => db.memberInterviewQA.create({ data: { memberId: member.id, question, answer, sortOrder: i, createdBy: IMPORT_ACTOR } }),
          update: (id) => db.memberInterviewQA.update({ where: { id }, data: { memberId: member.id, question, answer, sortOrder: i } }),
          exists: async (id) => !!(await db.memberInterviewQA.findUnique({ where: { id }, select: { id: true } })),
        });
      }
      // The post now has fewer pairs than last run: remove the leftovers (unless changed in the app).
      for (let i = qa.length, id = ctx.idOf('interview', `${post.id}:${i}`); id; id = ctx.idOf('interview', `${post.id}:${++i}`)) {
        if (ctx.opt.dryRun || (await ctx.editedInApp('MemberInterviewQA', id))) continue;
        if (await db.memberInterviewQA.findUnique({ where: { id }, select: { id: true } })) {
          await softDelete(db, 'MemberInterviewQA', { id });
          ctx.report.count('interview', 'removed (no longer in post)');
        }
      }
      if (featured.length < 10 && !featured.includes(member.id)) {
        featured.push(member.id);
        if (!ctx.opt.dryRun && !(await ctx.editedInApp('Member', member.id))) {
          await db.member.update({
            where: { id: member.id },
            data: { featuredNewMember: true, spotlightQuestion: qa[0].question, spotlightAnswer: qa[0].answer },
          });
        }
      }
    }
    // Only the ten newest interviews stay featured (among imported members nobody has edited in the app, so
    // members an admin featured stay featured).
    if (!ctx.opt.dryRun) {
      const imported = [...people.memberByName.values()].map((m) => m.id).filter((id) => !featured.includes(id));
      await db.member.updateMany({
        where: { id: { in: imported }, featuredNewMember: true, ...(ctx.opt.refresh ? {} : { OR: [{ updatedBy: null }, { updatedBy: IMPORT_ACTOR }] }) },
        data: { featuredNewMember: false },
      });
    }
    ctx.report.count('featured new members', 'set', featured.length);
  });
}

/** WordPress stores non-ASCII post_names percent-encoded. */
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

/** "Question: …\n\nAnswer: …" text → pairs. */
function parseQA(text: string): { question: string; answer: string }[] {
  const chunks = text.split(/(?:^|\n)\s*Q(?:uestion)?\s*[:.]\s*/i).slice(1);
  const out: { question: string; answer: string }[] = [];
  for (const chunk of chunks) {
    const m = chunk.match(/^([\s\S]*?)\s*(?:^|\n|\s)A(?:nswer)?\s*:\s*([\s\S]*)$/i);
    if (!m) continue;
    const question = m[1].replace(/\s+/g, ' ').trim();
    const answer = m[2].split(/\n\s*\n+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n');
    if (question && answer) out.push({ question, answer });
  }
  return out;
}

/** Exact name match, then the same first + last name, then a near spelling. */
export function matchMember(people: People, raw: string): { id: string; slug: string; name: string; fuzzy: boolean } | null {
  const key = nameKey(raw);
  const exact = people.memberByName.get(key);
  if (exact) return { ...exact, fuzzy: false };
  const words = key.split(' ').filter((w) => w.length > 1 && !['dr', 'mr', 'mrs', 'ms', 'prof', 'sir'].includes(w));
  if (!words.length) return null;
  const first = words[0];
  const last = words[words.length - 1];
  const candidates = [...people.memberByName.entries()].filter(([k]) => {
    const w = k.split(' ');
    return w.includes(first) && w.includes(last);
  });
  if (candidates.length === 1) return { ...candidates[0][1], fuzzy: true };
  let best: { d: number; m: { id: string; slug: string; name: string } } | null = null;
  for (const [k, m] of people.memberByName) {
    const d = levenshtein(k, key);
    if (d <= 2 && (!best || d < best.d)) best = { d, m };
  }
  return best ? { ...best.m, fuzzy: true } : null;
}

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** When a later step runs on its own (--only), rebuild the people lookups from the import map. */
export async function loadMembersFromMap(ctx: Ctx, people: People) {
  const rows = await ctx.db.legacyMap.findMany({ where: { source: 'wordpress', entity: { in: ['listing', 'user-profile', 'user'] } } });
  const memberIds = rows.filter((r) => r.model === 'Member').map((r) => r.newId);
  const members = await ctx.db.member.findMany({ where: { id: { in: memberIds } }, select: { id: true, slug: true, fullName: true, email: true, userId: true } });
  const byId = new Map(members.map((m) => [m.id, m]));
  const userLegacy = new Map(rows.filter((r) => r.entity === 'user').map((r) => [r.newId, Number(r.legacyId)]));
  for (const r of rows) {
    const m = r.model === 'Member' ? byId.get(r.newId) : undefined;
    if (!m) continue;
    people.memberSlug.set(m.id, m.slug);
    if (r.entity === 'listing') people.memberByName.set(nameKey(m.fullName), { id: m.id, slug: m.slug, name: m.fullName });
    if (m.email) people.memberByEmail.set(m.email.toLowerCase(), m.id);
    const wpUser = m.userId ? userLegacy.get(m.userId) : undefined;
    if (wpUser !== undefined) people.memberByUser.set(wpUser, m.id);
  }
}
