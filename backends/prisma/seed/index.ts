/* eslint-disable no-console */
/**
 * Seeds the database with every piece of content from the Lovable prototype so the
 * new apps render identically on day one. Destructive: truncates all tables first.
 * Run with `npm run db:seed`.
 */
import 'dotenv/config';
import { PrismaClient, VenueCategory } from '@prisma/client';
import * as argon2 from 'argon2';
import * as A from './data/actions-data';
import * as F from './data/forum-data';
import * as I from './data/inforum-data';
import * as N from './data/inline';
import pageHeaders from './data/page-headers.json';
import * as W from './data/site-content';

const prisma = new PrismaClient();
const ASSET = (f: string) => `${process.env.PUBLIC_API_URL ?? 'http://localhost:4000'}/static/assets/${f}`;

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Parse "Thursday 24 September 2026", "4 September 2026" or "September 2026". */
function parseDate(label: string | undefined, fallback = new Date()): Date {
  if (!label) return fallback;
  const full = label.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (full) {
    const m = MONTHS.indexOf(full[2].toLowerCase());
    if (m >= 0) return new Date(Date.UTC(Number(full[3]), m, Number(full[1])));
  }
  const monthYear = label.match(/([A-Za-z]+)\s+(\d{4})/);
  if (monthYear) {
    const m = MONTHS.indexOf(monthYear[1].toLowerCase());
    if (m >= 0) return new Date(Date.UTC(Number(monthYear[2]), m, 1));
  }
  return fallback;
}

/** Apply "7:00 pm" to a date (UTC). */
function withTime(date: Date, time: string | undefined): Date {
  const m = time?.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return date;
  let h = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') h += 12;
  const d = new Date(date);
  d.setUTCHours(h, Number(m[2] ?? 0), 0, 0);
  return d;
}

const minutes = (s?: string) => (s ? Number.parseInt(s, 10) || null : null);
const slug = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

function parseMoney(amount?: string): { amountCents: number | null; currency: string | null } {
  if (!amount) return { amountCents: null, currency: null };
  const currency = amount.includes('£') ? 'GBP' : amount.includes('€') ? 'EUR' : 'USD';
  return { amountCents: Math.round(Number(amount.replace(/[^0-9.]/g, '')) * 100), currency };
}

async function truncateAll() {
  const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  if (tables.length) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"public"."${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
  }
}

/**
 * Refuse to wipe a database that contains anything besides seed data (real applications,
 * users created by approving an application, uploads…) unless SEED_FORCE=1 is set.
 */
async function guardAgainstRealData() {
  if (process.env.SEED_FORCE === '1') return;
  const [applications, users, assets] = await Promise.all([
    prisma.application.count({ where: { NOT: { email: 'olivia.chen@example.com' } } }),
    prisma.user.count({ where: { NOT: { email: { endsWith: '@forum500.club' } } } }),
    prisma.asset.count(),
  ]);
  if (applications + users + assets > 0) {
    console.error(
      `Refusing to seed: the database has real data (${applications} applications, ${users} users, ${assets} uploads).\n` +
        'Seeding deletes EVERYTHING. If you really want that, run:  SEED_FORCE=1 npm run db:seed',
    );
    process.exit(1);
  }
}

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0 && process.env.SEED_FORCE !== '1') {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
    return;
  }
  await guardAgainstRealData();
  console.log('Truncating tables…');
  await truncateAll();
  const memberPassword = await argon2.hash(process.env.SEED_MEMBER_PASSWORD ?? 'Member@12345');

  // ── Admin
  await prisma.user.create({
    data: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@forum500.club',
      passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'),
      role: 'admin',
      status: 'active',
    },
  });

  // ── Configuration
  const chapterNames = new Set<string>([...F.cities, ...F.whatsappGroups, 'Nassau', 'Paris']);
  const chapters = new Map<string, string>();
  for (const name of [...chapterNames].sort()) {
    const c = await prisma.chapter.create({
      data: {
        name,
        isChapter: (F.cities as string[]).includes(name),
        whatsappEnabled: (F.whatsappGroups as string[]).includes(name),
        sortOrder: Math.max(0, (F.cities as string[]).indexOf(name)),
      },
    });
    chapters.set(name, c.id);
  }
  const sectors = new Map<string, string>();
  for (const [i, name] of F.sectors.entries()) {
    sectors.set(name, (await prisma.sector.create({ data: { name, sortOrder: i } })).id);
  }
  const fullTier = await prisma.membershipTier.create({
    data: { name: 'Full Member', priceCents: 240000, currency: 'GBP', sortOrder: 0 },
  });
  await prisma.membershipTier.create({ data: { name: 'Member', sortOrder: 1 } });
  const questions = [];
  for (const [i, text] of F.forumQuestions.entries()) {
    questions.push(await prisma.profileQuestion.create({ data: { text, sortOrder: i } }));
  }
  // ── Website content (CMS)
  await prisma.setting.createMany({
    data: [
      { key: 'site', value: W.siteSettings as any },
      { key: 'inforum_tabs', value: W.inforumTabs as any },
    ],
  });
  for (const [i, b] of F.benefits.entries()) {
    await prisma.clubBenefit.create({ data: { title: b.title, description: b.description, sortOrder: i } });
  }
  for (const page of W.publicPages) {
    await prisma.page.create({ data: { ...page, blocks: (page as any).blocks ?? undefined } as any });
  }
  for (const [slug, h] of Object.entries(pageHeaders as Record<string, { eyebrow: string | null; title: string; subtitle: string | null }>)) {
    await prisma.page.create({
      data: {
        slug,
        title: h.title,
        eyebrow: h.eyebrow,
        subtitle: h.subtitle,
        body:
          slug === 'membership/club-rules'
            ? 'Club Rules content coming soon.\n\nAdmins can edit this page from the admin portal under Website → Pages & Page Headers.'
            : undefined,
        ...(W.memberPageExtras[slug] as any),
      },
    });
  }
  for (const [i, c] of W.engageCards.entries()) {
    await prisma.contentCard.create({ data: { placement: 'home_engage', ...c, sortOrder: i } });
  }
  for (const [menu, items] of [['member_sidebar', W.memberSidebar], ['site_header', W.siteHeader], ['site_footer', W.siteFooter]] as const) {
    for (const [i, item] of items.entries()) {
      const parent = await prisma.navItem.create({
        data: { menu, label: item.label, href: item.href, icon: item.icon, highlight: !!item.highlight, sortOrder: i },
      });
      for (const [j, child] of (item.children ?? []).entries()) {
        await prisma.navItem.create({ data: { menu, parentId: parent.id, label: child.label, href: child.href, sortOrder: j } });
      }
    }
  }
  for (const [i, q] of W.quickPrompts.entries()) {
    await prisma.quickPrompt.create({ data: { ...q, sortOrder: i } });
  }

  // ── Members (prototype directory + current user + new-member spotlights)
  const members = new Map<string, string>(); // name -> id
  async function createMember(input: {
    slug: string; fullName: string; headline?: string; company?: string; city?: string; sector?: string;
    interests?: string[]; bio?: string; joinedYear?: number; avatarUrl?: string; featured?: boolean;
    spotlightQuestion?: string; spotlightAnswer?: string; travelCities?: string[]; linkedinUrl?: string;
  }) {
    const email = `${input.slug.replace(/[^a-z0-9-]/g, '')}@forum500.club`;
    const user = await prisma.user.create({
      data: { email, passwordHash: memberPassword, role: 'member', status: 'active' },
    });
    const m = await prisma.member.create({
      data: {
        userId: user.id,
        slug: input.slug,
        fullName: input.fullName,
        email,
        headline: input.headline,
        company: input.company,
        bio: input.bio,
        avatarUrl: input.avatarUrl,
        interests: input.interests ?? [],
        travelCities: input.travelCities ?? [],
        joinedYear: input.joinedYear,
        linkedinUrl: input.linkedinUrl,
        chapterId: input.city ? chapters.get(input.city) : undefined,
        sectorId: input.sector ? sectors.get(input.sector) : undefined,
        tierId: fullTier.id,
        featuredNewMember: !!input.featured,
        spotlightQuestion: input.spotlightQuestion,
        spotlightAnswer: input.spotlightAnswer,
      },
    });
    members.set(input.fullName, m.id);
    return m;
  }

  for (const m of F.members) {
    await createMember({
      slug: slug(m.id), fullName: m.name, headline: m.headline, company: m.company, city: m.city,
      sector: m.sector, interests: m.interests, bio: m.bio, joinedYear: m.joined, avatarUrl: m.photo,
    });
  }
  const anish = await createMember({
    slug: 'anish', fullName: 'Anish Malhotra', headline: 'Founder', company: 'Plotify', city: 'London',
    sector: 'Technology', interests: ['Proptech', 'Travel', 'Food'], joinedYear: 2024,
    avatarUrl: ASSET('member-shreyas.jpg'), travelCities: ['New York', 'Singapore', 'Dubai'],
    bio: 'Founder of Plotify. Building tools that make property decisions simpler.',
  });
  for (const [i, q] of questions.slice(0, 3).entries()) {
    await prisma.memberQuestionAnswer.create({
      data: {
        memberId: anish.id, questionId: q.id,
        answer: ['A good book, a camera and a cricket bat.', 'The Nineties by Chuck Klosterman.', 'Patagonia.'][i],
      },
    });
  }
  for (const nm of F.newMemberQandAs) {
    const m = await createMember({
      slug: slug(nm.id), fullName: nm.name, city: nm.city, avatarUrl: nm.photo, featured: true,
      spotlightQuestion: nm.question, spotlightAnswer: nm.answer, joinedYear: 2026,
    });
    for (const [i, qa] of nm.interview.entries()) {
      await prisma.memberInterviewQA.create({
        data: { memberId: m.id, question: qa.question, answer: qa.answer, sortOrder: i },
      });
    }
  }
  const memberId = (name?: string) => (name ? members.get(name) : undefined);

  // ── Benefits
  const categories = new Map<string, string>();
  for (const [kind, offers] of [['member', F.memberOffers], ['partner', F.partnerOffers]] as const) {
    for (const [i, o] of offers.entries()) {
      const catKey = `${kind}:${o.category}`;
      if (!categories.has(catKey)) {
        const c = await prisma.benefitCategory.create({ data: { name: o.category, kind, sortOrder: categories.size } })
          .catch(() => prisma.benefitCategory.findUniqueOrThrow({ where: { name: o.category } }));
        categories.set(catKey, c.id);
      }
      await prisma.benefitOffer.create({
        data: {
          slug: o.id, kind, title: o.title, offer: o.offer, categoryId: categories.get(catKey),
          providerName: o.provider, providerMemberId: memberId(o.provider), providerRole: o.providerRole,
          location: o.location, about: o.about, detail: o.detail, howToRedeem: o.howToRedeem,
          imageUrl: o.image, companyImageUrl: o.companyImage, featured: !!o.featured, sortOrder: i,
        },
      });
    }
  }
  for (const s of ['plotify-membership', 'harbour-house-nassau']) {
    const offer = await prisma.benefitOffer.findUnique({ where: { slug: s } });
    if (offer) await prisma.benefitOptIn.create({ data: { memberId: anish.id, offerId: offer.id } });
  }

  // ── Groups
  const myGroupIds = new Set(F.myGroups.map((g) => g.id));
  for (const [i, g] of F.allGroups.entries()) {
    const group = await prisma.group.create({
      data: { slug: slug(g.name), name: g.name, note: g.note, sortOrder: i },
    });
    if (myGroupIds.has(g.id)) {
      await prisma.groupMembership.create({ data: { groupId: group.id, memberId: anish.id, status: 'approved' } });
    }
    // Spread the other directory members across groups so counts are non-zero.
    const others = [...members.values()].filter((id) => id !== anish.id);
    for (const id of others.slice(0, (i % others.length) + 1)) {
      await prisma.groupMembership.create({ data: { groupId: group.id, memberId: id, status: 'approved' } });
    }
  }

  // ── Venues
  const venueCategory = (c: string) => c.replace(' ', '_') as VenueCategory;
  for (const [i, v] of N.venues_venues.entries()) {
    await prisma.venue.create({
      data: {
        slug: v.id, name: v.name, city: v.city, chapterId: chapters.get(v.city), category: venueCategory(v.category),
        access: v.access, description: v.description, imageUrl: v.image, sortOrder: i,
      },
    });
  }

  // ── Events
  const events = new Map<string, string>();
  for (const e of F.events) {
    const day = parseDate(e.date);
    const allDay = !/\d\s*(am|pm)/i.test(e.time);
    const startsAt = allDay ? day : withTime(day, e.time);
    const endMatch = e.time.split('–')[1];
    let endsAt: Date | null = endMatch && !allDay ? withTime(day, endMatch) : null;
    if (e.date.includes('–')) {
      const endDay = parseDate(e.date.split('–')[1]);
      endsAt = endDay;
    }
    const ev = await prisma.event.create({
      data: {
        slug: e.id, title: e.title, kind: e.kind, city: e.city, chapterId: chapters.get(e.city),
        venueText: e.venue, startsAt, endsAt, allDay, dateLabel: e.date, timeLabel: e.time,
        description: e.description, imageUrl: e.image, featured: true, capacity: 40,
        privateAddress: `${e.venue} — full address shared with confirmed guests`,
      },
    });
    events.set(e.id, ev.id);
  }
  for (const id of F.hostingEventIds) {
    await prisma.eventHost.create({ data: { eventId: events.get(id)!, memberId: anish.id } });
  }
  for (const id of F.attendingEventIds) {
    await prisma.eventRsvp.create({ data: { eventId: events.get(id)!, memberId: anish.id, status: 'confirmed' } });
  }
  // A few RSVPs from other members.
  for (const [i, id] of [...members.values()].slice(0, 4).entries()) {
    await prisma.eventRsvp.create({
      data: { eventId: [...events.values()][i % events.size], memberId: id, status: 'confirmed' },
    }).catch(() => undefined);
  }

  // ── Gallery
  for (const [i, a] of N.gallery_albums.entries()) {
    const linked = F.events.find((e) => e.city === a.city);
    const album = await prisma.galleryAlbum.create({
      data: {
        slug: a.id, title: a.event, city: a.city, chapterId: chapters.get(a.city), dateLabel: a.date,
        takenOn: parseDate(a.date), coverUrl: a.cover, sortOrder: i,
        eventId: linked ? events.get(linked.id) : undefined,
      },
    });
    for (const [j, p] of a.photos.entries()) {
      await prisma.galleryPhoto.create({
        data: { albumId: album.id, caption: p.caption, url: p.src, kind: p.kind, sortOrder: j },
      });
    }
  }

  // ── In:Forum
  const sections = new Map<string, string>();
  for (const [i, s] of I.inforumSections.entries()) {
    sections.set(s.id, (await prisma.inforumSection.create({ data: { key: s.id, label: s.label, sortOrder: i } })).id);
  }
  for (const s of [{ id: 'editors-choice', label: "Editor's choice" }, { id: 'around-the-world', label: 'From around the world' }, { id: 'by-members', label: 'By members' }]) {
    // Pseudo-sections used by the pitch form; kept for pitch → article mapping.
    sections.set(s.id, (await prisma.inforumSection.create({ data: { key: s.id, label: s.label, sortOrder: 100 + sections.size } })).id);
  }
  const articles = new Map<string, string>();
  async function upsertInforumArticle(a: (typeof I.inforumArticles)[number], order: number) {
    if (articles.has(a.id)) return articles.get(a.id)!;
    const created = await prisma.article.create({
      data: {
        slug: a.id, publication: 'inforum', title: a.title, standfirst: a.standfirst, body: a.body,
        sectionId: sections.get(a.section), sectionLabel: a.sectionLabel, authorName: a.author,
        authorMemberId: memberId(a.author), authorRole: a.authorRole, authorPhotoUrl: a.authorPhoto,
        isMember: a.isMember, editorsChoice: !!a.editorsChoice, fromAroundWorld: !!a.fromAroundTheWorld,
        dateline: a.dateline, dateLabel: a.date, readMinutes: minutes(a.readTime), imageUrl: a.image,
        caption: a.caption, sortOrder: order, publishedAt: parseDate(a.date),
        visibility: a.editorsChoice ? 'public' : 'members',
      },
    });
    articles.set(a.id, created.id);
    return created.id;
  }
  for (const ed of I.inforumEditions) {
    const edition = await prisma.inforumEdition.create({
      data: {
        slug: ed.id, label: ed.label, publishedOn: parseDate(ed.publishedOn), coverLine: ed.coverLine,
        coverUrl: ed.cover, visibility: 'public',
      },
    });
    for (const [i, a] of ed.articles.entries()) {
      const articleId = await upsertInforumArticle(a, i);
      await prisma.editionArticle.create({ data: { editionId: edition.id, articleId, sortOrder: i } });
    }
  }
  for (const [i, r] of I.memberRecommendations.entries()) {
    await prisma.recommendation.create({
      data: {
        category: r.category, title: r.title, place: r.place, note: r.note, memberName: r.member,
        memberId: memberId(r.member), memberPhotoUrl: r.memberPhoto, memberChapter: r.memberChapter,
        imageUrl: r.image, createdAt: hoursAgo(200 - i),
      },
    });
  }
  for (const [i, c] of I.memberComments.entries()) {
    const comment = await prisma.comment.create({
      data: {
        body: c.text, memberName: c.member, memberId: memberId(c.member), memberPhotoUrl: c.memberPhoto || null,
        memberChapter: c.memberChapter, recommends: c.recommends, createdAt: hoursAgo(i * 6 + 2),
      },
    });
    for (const [j, r] of c.replies.entries()) {
      await prisma.comment.create({
        data: {
          body: r.text, parentId: comment.id, memberName: r.member, memberId: memberId(r.member),
          memberPhotoUrl: r.memberPhoto || null, memberChapter: r.memberChapter, recommends: r.recommends,
          createdAt: hoursAgo(i * 6 + 1 - j * 0.1),
        },
      });
    }
  }

  // ── Forecast
  for (const ed of N.forecast_editions) {
    const issue = await prisma.forecastIssue.create({
      data: {
        slug: ed.id, issue: ed.issue, title: ed.title, dateLabel: ed.date, publishedOn: parseDate(ed.date),
        coverUrl: ed.cover, letterTitle: ed.letter.title, letterBody: ed.letter.body, letterSignoff: ed.letter.signoff,
      },
    });
    for (const [i, a] of ed.articles.entries()) {
      await prisma.article.create({
        data: {
          slug: `forecast-${ed.id}-${a.id}`, publication: 'forecast', forecastIssueId: issue.id, title: a.title,
          standfirst: a.standfirst, body: a.body, sectionLabel: a.section, authorName: a.author,
          authorMemberId: memberId(a.author), dateline: a.dateline, readMinutes: minutes(a.readTime),
          imageUrl: a.image, caption: a.caption, sortOrder: i, publishedAt: parseDate(ed.date), dateLabel: ed.date,
        },
      });
    }
  }

  // ── Member articles
  for (const [i, a] of F.memberArticles.entries()) {
    await prisma.article.create({
      data: {
        slug: `member-${a.id}-${slug(a.title)}`.slice(0, 80), publication: 'member', title: a.title,
        authorName: a.author, authorMemberId: memberId(a.author), isMember: true, readMinutes: minutes(a.readTime),
        imageUrl: a.image, sortOrder: i, publishedAt: hoursAgo(24 * (i + 1)),
      },
    });
  }

  // ── Podcasts
  for (const p of F.podcastEpisodes) {
    await prisma.podcastEpisode.create({
      data: {
        slug: p.id, number: p.number, title: p.title, description: p.description, guestName: p.guest,
        guestMemberId: memberId(p.guest), durationMinutes: minutes(p.duration), coverUrl: p.cover,
        publishedAt: new Date(Date.UTC(2026, 8, 1) - (42 - p.number) * 7 * 86400_000),
      },
    });
  }

  // ── Books & reading
  for (const [i, b] of F.memberBooks.entries()) {
    await prisma.book.create({
      data: { title: b.title, authorName: b.author, authorMemberId: memberId(b.author), isMemberBook: true, note: b.note, coverUrl: b.cover, sortOrder: i },
    });
  }
  for (const [i, b] of F.recommendedBooks.entries()) {
    const book = await prisma.book.create({ data: { title: b.title, authorName: b.author, coverUrl: b.cover, sortOrder: i } });
    await prisma.bookRecommendation.create({
      data: { bookId: book.id, title: b.title, note: b.note, recommendedByName: b.recommendedBy, chapter: b.chapter, sortOrder: i },
    });
  }
  for (const [i, r] of F.readingPicks.entries()) {
    const curator = r.note.split(':')[0]?.trim();
    await prisma.bookRecommendation.create({
      data: {
        title: r.title, note: r.note, isCuratedPick: true, sortOrder: i,
        recommendedByName: curator && curator.length < 20 ? curator : 'Jess & Simon',
      },
    });
  }

  // ── Library
  for (const l of F.libraryItems) {
    await prisma.libraryItem.create({
      data: {
        slug: l.id, title: l.title, kind: l.kind === 'Annual Report' ? 'Annual_Report' : 'Journal',
        pages: l.pages, description: l.description, coverUrl: ASSET('inforum-hero.jpg'),
        publishedAt: new Date(),
      },
    });
  }

  // ── Newsfeed
  for (const [i, p] of N.newsfeed_posts.entries()) {
    await prisma.feedPost.create({
      data: {
        authorName: p.name, memberId: memberId(p.name), authorMeta: p.meta, authorPhotoUrl: p.photo,
        body: p.text, imageUrl: p.image, imageAlt: p.imageAlt, likes: p.likes, createdAt: hoursAgo(i * 8 + 2),
      },
    });
  }

  // ── WhatsApp groups
  const myWa = new Set(F.myWhatsappGroups);
  for (const name of F.whatsappGroups) {
    const g = await prisma.whatsappGroup.create({
      data: { name, chapterId: chapters.get(name), inviteLink: `https://chat.whatsapp.com/forum500-${slug(name)}` },
    });
    if (myWa.has(name)) {
      await prisma.whatsappMembership.create({ data: { groupId: g.id, memberId: anish.id, status: 'approved' } });
    }
  }

  // Group chat history
  for (const [groupName, messages] of Object.entries(W.groupChats)) {
    const group = await prisma.whatsappGroup.findUnique({ where: { name: groupName } });
    if (!group) continue;
    for (const m of messages) {
      await prisma.whatsappMessage.create({
        data: { groupId: group.id, memberId: memberId(m.author) ?? null, authorName: m.author, body: m.body, createdAt: hoursAgo(m.hoursAgo) },
      });
    }
  }

  // ── Direct messages for the demo member
  for (const [otherName, messages] of Object.entries(W.directMessages)) {
    const otherId = memberId(otherName);
    if (!otherId) continue;
    const last = messages[messages.length - 1];
    const conversation = await prisma.conversation.create({
      data: {
        pairKey: [anish.id, otherId].sort().join(':'),
        lastMessageAt: hoursAgo(last.hoursAgo),
        participants: {
          create: [
            // The demo member has read everything except the newest incoming message.
            { memberId: anish.id, lastReadAt: last.me ? hoursAgo(last.hoursAgo) : hoursAgo(last.hoursAgo + 0.5) },
            { memberId: otherId, lastReadAt: hoursAgo(last.hoursAgo) },
          ],
        },
      },
    });
    for (const m of messages) {
      await prisma.message.create({
        data: { conversationId: conversation.id, senderId: m.me ? anish.id : otherId, body: m.body, createdAt: hoursAgo(m.hoursAgo) },
      });
    }
  }

  // ── Introductions (made to the current user)
  const directory = F.members.slice(1, 5);
  for (const [i, m] of directory.entries()) {
    const introducer = F.members[i];
    await prisma.introduction.create({
      data: {
        requesterId: memberId(m.name), targetId: anish.id, introducerId: memberId(introducer?.name),
        introducerName: introducer?.name ?? 'Forum Team',
        reason: F.memberIntroductions[i % F.memberIntroductions.length]?.note ?? `You both share an interest in ${m.interests[0]}.`,
        status: i % 2 === 0 ? 'accepted' : 'pending', createdAt: hoursAgo(24 * (i + 1)),
      },
    });
  }

  // ── Emails, notifications, actions
  for (const [i, e] of N.emails_emails.entries()) {
    const campaign = await prisma.emailCampaign.create({
      data: { subject: e.subject, senderLabel: e.sender, preview: e.preview, body: e.preview, status: 'sent', sentAt: hoursAgo(i * 20 + 5) },
    });
    if (!e.unread) {
      // Read receipts only for the demo member; unread campaigns stay visible to everyone.
      await prisma.emailDelivery.create({ data: { campaignId: campaign.id, memberId: anish.id, openedAt: new Date() } });
    }
  }
  const notifTypes = ['new_member', 'rsvp_reminder', 'publication', 'profile_view'] as const;
  for (const [i, n] of N.notifications_notifications.entries()) {
    await prisma.notification.create({
      data: { memberId: anish.id, type: notifTypes[i] ?? 'general', title: n.title, body: n.body, createdAt: hoursAgo(i * 10 + 1) },
    });
  }
  for (const a of A.initialActions) {
    const dueMatch = a.due?.match(/(\d{1,2})\s+([A-Za-z]{3})/);
    const month = dueMatch ? MONTHS.findIndex((m) => m.startsWith(dueMatch[2].toLowerCase())) : -1;
    await prisma.actionItem.create({
      data: {
        memberId: anish.id, type: a.type, context: a.context, title: a.title, detail: a.detail,
        dueAt: dueMatch && month >= 0 ? new Date(Date.UTC(2026, month, Number(dueMatch[1]))) : null,
        ...parseMoney(a.amount),
      },
    });
  }

  // ── A sample application waiting in the admin queue
  await prisma.application.create({
    data: {
      fullName: 'Olivia Chen', email: 'olivia.chen@example.com', role: 'Managing Partner', company: 'Harbour Lane Capital',
      sector: 'Finance', city: 'Singapore', country: 'Singapore', travelCities: ['London', 'Hong Kong'],
      recommenderName: 'Priya Nair', recommenderMemberId: memberId('Priya Nair'), recommenderRelation: 'Former colleague',
      whyJoin: 'To meet founders and investors who care about long-term ideas.',
      contribution: 'Host dinners in Singapore and mentor early-stage founders.',
    },
  });

  const counts = {
    members: await prisma.member.count(), events: await prisma.event.count(), venues: await prisma.venue.count(),
    albums: await prisma.galleryAlbum.count(), articles: await prisma.article.count(),
    editions: await prisma.inforumEdition.count(), podcasts: await prisma.podcastEpisode.count(),
    offers: await prisma.benefitOffer.count(), groups: await prisma.group.count(), actions: await prisma.actionItem.count(),
    chapters: await prisma.chapter.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
