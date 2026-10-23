import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Ctx, IMPORT_ACTOR } from '../lib/context';
import { Media } from '../lib/media';
import { phpUnserialize } from '../lib/php';
import {
  decodeEntities, htmlToParagraphs, htmlToText, mysqlUtc, nameKey, parseLooseDate, slugify, SPELLED, textParagraphs, titleCase, truncate,
} from '../lib/text';
import { loadMembersFromMap, matchMember, People } from './people';

/** Old WordPress page ids for the content that only exists as page layouts. */
const PAGE = {
  podcast: 17356, fiveMinutes: 16904, zoomYears: 17184, youtube: 17308, links: 21124, documents: 20148,
  gallery: 17000, inForum: 17332, forumMovie: 27657,
  reports: [23940, 23976, 27930, 28199, 28428],
};

interface Widget { widgetType: string; settings: Record<string, any> }

async function elementor(ctx: Ctx, postId: number): Promise<Widget[]> {
  const [row] = await ctx.q<{ v: string }>(`SELECT meta_value v FROM {postmeta} WHERE post_id = ? AND meta_key = '_elementor_data' LIMIT 1`, [postId]);
  if (!row?.v) return [];
  const out: Widget[] = [];
  const walk = (n: any) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (n && typeof n === 'object') {
      if (n.elType === 'widget') out.push(n);
      (n.elements ?? []).forEach(walk);
    }
  };
  try {
    walk(JSON.parse(row.v));
  } catch {
    ctx.report.issue('Unreadable page layouts', `page #${postId}`);
  }
  return out;
}

const widgetText = (w: Widget) => htmlToText(String(w.settings.editor ?? w.settings.text_editor ?? w.settings.title ?? ''));
const linksIn = (w: Widget) => Object.values(w.settings).filter((v): v is { url: string } => !!v && typeof v === 'object' && typeof (v as any).url === 'string' && !!(v as any).url).map((v) => v.url);
const firstImg = (html: string) => html.match(/<img[^>]+src="([^"]+)"/i)?.[1] ?? null;
const readMinutes = (paras: string[]) => Math.max(1, Math.round(paras.join(' ').split(/\s+/).length / 220));

export async function importContent(ctx: Ctx, media: Media, people: People) {
  const { db } = ctx;
  const ensurePeople = async () => {
    if (!people.memberByName.size) await loadMembersFromMap(ctx, people);
  };
  const exists = (model: 'article' | 'libraryItem' | 'podcastEpisode' | 'galleryAlbum' | 'galleryPhoto' | 'inforumEdition' | 'forecastIssue' | 'feedPost') =>
    async (id: string) => !!(await (db[model] as any).findUnique({ where: { id }, select: { id: true } }));
  const takenArticleSlugs = new Set((await db.article.findMany({ select: { slug: true } })).map((a) => a.slug));
  const articleSlug = async (entity: string, legacyId: string | number, base: string) => {
    const known = ctx.idOf(entity, legacyId);
    if (known && !ctx.opt.dryRun) {
      const cur = await db.article.findUnique({ where: { id: known }, select: { slug: true } });
      if (cur) return cur.slug;
    }
    let slug = base;
    for (let n = 2; takenArticleSlugs.has(slug); n++) slug = `${base}-${n}`;
    takenArticleSlugs.add(slug);
    return slug;
  };

  // ───────────── In:Forum editions + Forecast (flipbook PDFs + article text folder) ─────────────
  await ctx.step('magazines', async () => {
    await ensurePeople();
    const options = await ctx.q<{ name: string; value: string }>(`SELECT option_name name, option_value value FROM {options} WHERE option_name REGEXP '^real3dflipbook_[0-9]+$'`);
    const [inForum] = await ctx.q<{ content: string }>(`SELECT post_content content FROM {posts} WHERE ID = ?`, [PAGE.inForum]);
    // The In:Forum page lists "[real3dflipbook id='5'] SUMMER 2025", which names each edition.
    const labelOf = new Map<string, string>();
    for (const m of (inForum?.content ?? '').replace(/<[^>]+>/g, ' ').matchAll(/\[real3dflipbook id='(\d+)'\]\s*([A-Za-z]+\s+\d{4})/g)) {
      labelOf.set(m[1], titleCase(m[2].toUpperCase()));
    }
    const books = options.map((o) => ({ id: o.name.split('_')[1], ...(phpUnserialize(o.value) ?? {}) })).filter((b) => b.pdfUrl);
    ctx.report.expect('magazine (flipbook)', books.length);
    const thumbOf = async (postId: number | undefined) => {
      if (!postId) return null;
      const [t] = await ctx.q<{ v: string }>(`SELECT meta_value v FROM {postmeta} WHERE post_id = ? AND meta_key = '_thumbnail_id'`, [postId]);
      return t?.v ? media.url(t.v) : null;
    };
    const SEASON_MONTH: Record<string, number> = { spring: 3, summer: 6, autumn: 9, winter: 0 };
    const editionIdBySlug = new Map<string, string>();
    let forecastId: string | null = null;
    for (const b of books) {
      const cover = (await thumbOf(b.post_id)) ?? (await media.url(String(b.lightboxThumbnailUrl ?? '').split('?')[0]));
      const pdfUrl = await media.url(b.pdfUrl);
      if (/forecast/i.test(String(b.name))) {
        const year = String(b.name).match(/\d{4}/)?.[0] ?? '2026';
        const [post] = await ctx.q<{ date: string }>(`SELECT post_date_gmt date FROM {posts} WHERE ID = ?`, [b.post_id ?? 0]);
        const data = {
          slug: `forecast-${year}`, issue: year, title: `Forum 500 Forecast ${year}`, dateLabel: `January ${year}`,
          publishedOn: mysqlUtc(post?.date) ?? new Date(Date.UTC(+year, 0, 15)), coverUrl: cover, pdfUrl, status: 'published' as const,
        };
        forecastId = await ctx.upsert('flipbook', b.id, 'ForecastIssue', {
          find: () => db.forecastIssue.findUnique({ where: { slug: data.slug }, select: { id: true } }),
          create: () => db.forecastIssue.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
          update: (id) => db.forecastIssue.update({ where: { id }, data: { coverUrl: cover, pdfUrl } }),
          exists: exists('forecastIssue'),
        });
        continue;
      }
      const label = labelOf.get(b.id) ?? titleCase(String(b.name).replace(/^IN:FORUM\s*/i, '').toUpperCase());
      const [season, year] = label.toLowerCase().split(/\s+/);
      const slug = slugify(label);
      const data = {
        slug, label, publishedOn: new Date(Date.UTC(+year || 2024, SEASON_MONTH[season] ?? 0, 15)),
        coverUrl: cover, pdfUrl, status: 'published' as const, visibility: 'members' as const,
      };
      const id = await ctx.upsert('flipbook', b.id, 'InforumEdition', {
        find: () => db.inforumEdition.findUnique({ where: { slug }, select: { id: true } }),
        create: () => db.inforumEdition.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.inforumEdition.update({ where: { id }, data: { label, coverUrl: cover, pdfUrl } }),
        exists: exists('inforumEdition'),
      });
      if (id) editionIdBySlug.set(slug, id);
    }

    // Article text from the magazine content folder (Things/Content/<edition>/<Title [pNN]>/).
    const dir = ctx.opt.contentDir;
    if (!dir || !existsSync(dir)) {
      ctx.report.issue('Skipped', 'magazine articles: WP_CONTENT_DIR not set or missing');
      return;
    }
    for (const folder of readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      const ed = folder.name.match(/INFORUM-(Spring|Summer|Autumn|Winter)(\d{4})/i);
      const isForecast = /forecast/i.test(folder.name);
      const editionSlug = ed ? `${ed[1].toLowerCase()}-${ed[2]}` : null;
      const editionId = editionSlug ? editionIdBySlug.get(editionSlug) ?? ctx.idOf('edition-slug', editionSlug) : null;
      if (!isForecast && !editionId) {
        ctx.report.issue('Magazine folders not matched to an edition', folder.name);
        continue;
      }
      for (const art of readdirSync(join(dir, folder.name), { withFileTypes: true }).filter((d) => d.isDirectory())) {
        const artDir = join(dir, folder.name, art.name);
        const files = readdirSync(artDir);
        const rtf = files.find((f) => f.toLowerCase().endsWith('.rtf'));
        if (!rtf) continue;
        const page = Number(art.name.match(/\[p(\d+)\]/)?.[1] ?? 999);
        const title = art.name.replace(/\s*\[p\d+\]\s*$/, '').trim();
        const parsed = parseMagazineArticle(rtfToText(join(artDir, rtf)), title);
        const images = files.filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
        const authorWords = nameKey(parsed.authorName ?? '').split(' ').filter((w) => w.length > 2);
        const headshot = images.find((f) => authorWords.length > 0 && authorWords.some((w) => nameKey(f).includes(w)) && !/main|inset|image\d/i.test(f));
        const hero = images.find((f) => /main ?image|mainimage|cover/i.test(f)) ?? images.find((f) => f !== headshot && !/logo|icon|portrait/i.test(f));
        const keyBase = `content/${slugify(folder.name)}/${slugify(title)}`;
        const legacyId = `${folder.name}/${art.name}`;
        const slug = await articleSlug('magazine-article', legacyId, `${editionSlug ?? 'forecast'}-${slugify(title)}`);
        const author = parsed.authorName ? matchMember(people, parsed.authorName) : null;
        const data = {
          slug,
          publication: isForecast ? ('forecast' as const) : ('inforum' as const),
          title,
          standfirst: parsed.standfirst,
          body: parsed.body,
          authorName: parsed.authorName ?? (isForecast ? 'Forum 500' : 'IN:FORUM'),
          authorRole: parsed.authorRole,
          authorMemberId: author && !author.fuzzy ? author.id : null,
          isMember: !!(author && !author.fuzzy),
          authorPhotoUrl: headshot ? await media.local(join(artDir, headshot), `${keyBase}/${headshot}`) : null,
          imageUrl: hero ? await media.local(join(artDir, hero), `${keyBase}/${hero}`) : null,
          forecastIssueId: isForecast ? forecastId : null,
          sortOrder: page,
          readMinutes: readMinutes(parsed.body),
          dateLabel: ed ? `${ed[1]} ${ed[2]}` : null,
          status: 'published' as const,
          visibility: 'members' as const,
        };
        const articleId = await ctx.upsert('magazine-article', legacyId, 'Article', {
          create: () => db.article.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
          update: (id) => db.article.update({ where: { id }, data: { ...data, slug: undefined } }),
          exists: exists('article'),
        });
        if (articleId && editionId && !ctx.opt.dryRun) {
          await db.editionArticle.upsert({
            where: { editionId_articleId: { editionId, articleId } },
            create: { editionId, articleId, sortOrder: page, createdBy: IMPORT_ACTOR },
            update: { sortOrder: page },
          });
        }
        if (parsed.body.length < 3) ctx.report.issue('Magazine articles with little text (check)', `${folder.name} / ${title}`);
      }
    }
  });

  // ───────────── Forum Radio (podcast page) ─────────────
  await ctx.step('podcast', async () => {
    await ensurePeople();
    const widgets = await elementor(ctx, PAGE.podcast);
    type Ep = { series: number | null; number: number; date: Date | null; image: string | null; guestLine: string | null; text: string[]; spotify: string | null; apple: string | null };
    const episodes: Ep[] = [];
    let series: number | null = null;
    let cur: Ep | null = null;
    for (const w of widgets) {
      const text = w.widgetType.includes('text') || w.widgetType.includes('heading') ? widgetText(w) : '';
      const s = text.match(/^SERIES\s+([A-Z]+|\d+)$/i);
      if (s) {
        series = SPELLED[s[1].toLowerCase()] ?? (Number(s[1]) || null);
        continue;
      }
      const e = text.match(/^Episode\s+(\d+)\s*(.*)$/i);
      if (e) {
        cur = { series, number: Number(e[1]), date: parseLooseDate(e[2]), image: null, guestLine: null, text: [], spotify: null, apple: null };
        episodes.push(cur);
        continue;
      }
      if (!cur) continue;
      if (w.widgetType.includes('image')) {
        const links = linksIn(w);
        const spotify = links.find((u) => /spotify\.com/.test(u));
        const apple = links.find((u) => /podcasts\.apple\.com/.test(u));
        if (spotify) cur.spotify = spotify;
        else if (apple) cur.apple = apple;
        else if (!cur.image) cur.image = w.settings.image?.url ?? links[0] ?? null;
      } else if (text) {
        if (!cur.guestLine) cur.guestLine = text.replace(/\s+/g, ' ');
        else cur.text.push(text);
      }
    }
    ctx.report.expect('podcast episode', episodes.length);
    const used = new Set<string>();
    for (const ep of episodes) {
      const guestLine = ep.guestLine ?? '';
      // "Charlotte Holl - New York | President …" or "Justin Peimani London | Strategic Advisor …"
      let guestName = guestLine.split(/\s+[-–]\s+|\s*\|\s*/)[0].trim();
      for (const city of people.chapterByKey.size ? [...people.chapterByKey.keys()] : []) {
        const re = new RegExp(`\\s+${city.replace(/\s+/g, '\\s+')}$`, 'i');
        if (re.test(nameKey(guestName))) guestName = guestName.slice(0, guestName.length - city.length).trim();
      }
      const multi = /,|&| and /.test(guestName);
      const member = !multi ? matchMember(people, guestName) : null;
      let slug = `forum-radio-s${ep.series ?? 0}-e${ep.number}`;
      while (used.has(slug)) slug += '-b';
      used.add(slug);
      const description = [guestLine, ...ep.text].filter(Boolean).join('\n\n');
      const data = {
        slug, number: ep.number, series: ep.series, title: guestName || `Episode ${ep.number}`, guestName: guestName || 'Forum member',
        guestMemberId: member && !member.fuzzy ? member.id : null, description: description || null,
        coverUrl: await media.url(ep.image), spotifyUrl: ep.spotify, appleUrl: ep.apple, publishedAt: ep.date, status: 'published' as const,
      };
      await ctx.upsert('podcast', slug, 'PodcastEpisode', {
        create: () => db.podcastEpisode.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.podcastEpisode.update({ where: { id }, data }),
        exists: exists('podcastEpisode'),
      });
    }
    await ctx.redirect('/podcast/', '/media/forum-radio');
  });

  // ───────────── Library: Five Minutes audio, Zoom Years video, documents, links ─────────────
  await ctx.step('library', async () => {
    const save = async (key: string, data: Record<string, any>) => {
      const row = { status: 'published' as const, ...data, slug: slugify(key) };
      await ctx.upsert('library', key, 'LibraryItem', {
        find: () => db.libraryItem.findUnique({ where: { slug: row.slug }, select: { id: true } }),
        create: () => db.libraryItem.create({ data: { ...(row as any), createdBy: IMPORT_ACTOR } }),
        update: (id) => db.libraryItem.update({ where: { id }, data: row as any }),
        exists: exists('libraryItem'),
      });
    };
    // Five Minutes with Forum: fancy boxes linking to audio files.
    for (const w of (await elementor(ctx, PAGE.fiveMinutes)).filter((x) => x.widgetType === 'pxl_fancy_box')) {
      const title = decodeEntities(String(w.settings.title ?? '')).trim();
      const audio = w.settings.hyper_link?.url;
      if (!title || !audio) continue;
      const recordedOn = parseLooseDate(String(w.settings.price ?? ''));
      await save(`five-minutes-${title}`, {
        title, kind: 'audio', speaker: decodeEntities(String(w.settings.desc ?? '')).trim() || null,
        durationLabel: String(w.settings.duration ?? '').trim() || null, recordedOn, publishedAt: recordedOn,
        description: 'Five Minutes with Forum: one idea, a weekly broadcast in 2020.', mediaUrl: await media.url(audio),
      });
    }
    await ctx.redirect('/five-minutes-with-forum/', '/media/library');
    // The Zoom Years: each video is followed by a text block naming the speakers.
    const zoom = await elementor(ctx, PAGE.zoomYears);
    for (const [i, w] of zoom.entries()) {
      if (w.widgetType !== 'video') continue;
      const file = w.settings.hosted_url?.url as string | undefined;
      if (!file) continue;
      const next = zoom.slice(i + 1).find((x) => x.widgetType === 'text-editor');
      const base = decodeURIComponent(file.split('/').pop() ?? '').replace(/\.\w+$/, '');
      const m = base.match(/^(.*?)_([A-Za-z]{3,9})(\d{1,2})_(\d{2})/);
      const title = (m?.[1] ?? base).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
      const recordedOn = m ? parseLooseDate(`${m[2]} ${m[3]} 20${m[4]}`) ?? parseLooseDate(`${m[3]} ${m[2]} 20${m[4]}`) : null;
      await save(`zoom-years-${base}`, {
        title, kind: 'video', speaker: next ? widgetText(next).replace(/\s+/g, ' ') : null, recordedOn, publishedAt: recordedOn,
        description: 'The Zoom Years: unable to meet in person, Forum members met via Zoom for discussion.',
        mediaUrl: await media.url(file), coverUrl: await media.url(w.settings.poster?.url),
      });
    }
    await ctx.redirect('/zoom-years/', '/media/library');
    // Home-page film.
    const [movie] = await ctx.q<{ content: string }>(`SELECT post_content content FROM {posts} WHERE ID = ?`, [PAGE.forumMovie]);
    const movieUrl = movie?.content.match(/https?:\/\/[^\s"'<>]+\.mp4/i)?.[0];
    if (movieUrl) await save('forum-movie', { title: 'Forum: the film', kind: 'video', description: 'The Forum film from the old home page.', mediaUrl: await media.url(movieUrl) });
    // YouTube channel.
    const yt = await elementor(ctx, PAGE.youtube);
    const ytIntro = yt.map(widgetText).find((t) => t.length > 60) ?? null;
    await save('youtube-channel', {
      title: 'Forum YouTube channel: Digital Broadcasts', kind: 'link', description: ytIntro,
      fileUrl: 'https://www.youtube.com/channel/UC3Lb6JhjOYVxlSQ-vE6RNwA',
    });
    await ctx.redirect('/youtube-channel/', '/media/library');
    // Essential documents and the Links page.
    for (const pageId of [PAGE.documents, PAGE.links]) {
      const widgets = await elementor(ctx, pageId);
      for (const [i, w] of widgets.entries()) {
        if (w.widgetType !== 'pxl_fancy_box') continue;
        const title = titleCase(decodeEntities(String(w.settings.title ?? '')).trim());
        let url: string | undefined = w.settings.hyper_link?.url;
        if (!url || url === '#') url = widgets.slice(i + 1).find((x) => x.widgetType === 'pxl_button')?.settings.link?.url;
        if (!title || !url || url === '#') continue;
        if (/forum\.club\/(new-york-form|interests-form)/.test(url)) {
          ctx.report.issue('Old site forms not carried over', `${title} (${url}): a Contact Form 7 page; answers were only emailed`);
          continue;
        }
        const isPdf = /\.pdf($|\?)/i.test(url);
        await save(`document-${title}`, {
          title, kind: isPdf ? 'document' : 'link', description: decodeEntities(String(w.settings.desc ?? '')).trim() || null,
          fileUrl: isPdf ? await media.url(url) : url,
        });
      }
    }
    await ctx.redirect('/essential-documents/', '/media/library');
    await ctx.redirect('/links/', '/media/library');
  });

  // ───────────── Gallery ─────────────
  await ctx.step('gallery', async () => {
    const widgets = await elementor(ctx, PAGE.gallery);
    const heading = widgets.find((w) => w.widgetType === 'pxl_fancybox_carousel')?.settings.content_list?.[0] ?? {};
    const photos: { id: number; url: string }[] = widgets.find((w) => w.widgetType === 'pxl_gallery_carousel')?.settings.wp_gallery ?? [];
    if (!photos.length) return;
    const title = decodeEntities(String(heading.title ?? 'Forum gallery')).trim();
    const dateLabel = decodeEntities(String(heading.desc ?? '')).trim() || 'Gallery';
    const albumData = {
      slug: slugify(title), title, city: /cliveden/i.test(title) ? 'Cliveden' : 'London', dateLabel,
      takenOn: parseLooseDate(dateLabel.replace(/^.*?to\s+\w+\s+/i, '')) ?? null, status: 'published' as const,
    };
    const albumId = await ctx.upsert('gallery', PAGE.gallery, 'GalleryAlbum', {
      find: () => db.galleryAlbum.findUnique({ where: { slug: albumData.slug }, select: { id: true } }),
      create: () => db.galleryAlbum.create({ data: { ...albumData, createdBy: IMPORT_ACTOR } }),
      update: (id) => db.galleryAlbum.update({ where: { id }, data: albumData }),
      exists: exists('galleryAlbum'),
    });
    if (!albumId) return;
    ctx.report.expect('gallery photo', photos.length);
    let cover: string | null = null;
    for (const [i, p] of photos.entries()) {
      const url = (await media.url(p.id)) ?? (await media.url(p.url));
      if (!url) continue;
      cover ??= url;
      await ctx.upsert('gallery-photo', p.id, 'GalleryPhoto', {
        create: () => db.galleryPhoto.create({ data: { albumId, url, sortOrder: i, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.galleryPhoto.update({ where: { id }, data: { url, sortOrder: i } }),
        exists: exists('galleryPhoto'),
      });
    }
    if (cover && !ctx.opt.dryRun) await db.galleryAlbum.update({ where: { id: albumId }, data: { coverUrl: cover } });
    await ctx.redirect('/galleries/', '/events/gallery');
  });

  // ───────────── Blog posts (news → Newsfeed, long pieces → member articles) and event write-ups ─────────────
  await ctx.step('posts', async () => {
    await ensurePeople();
    const posts = await ctx.q<{ id: number; title: string; slug: string; content: string; date: string; thumb: string | null; cats: string }>(
      `SELECT p.ID id, p.post_title title, p.post_name slug, p.post_content content, p.post_date_gmt date,
         (SELECT meta_value FROM {postmeta} WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1) thumb,
         (SELECT GROUP_CONCAT(t.name SEPARATOR '|') FROM {term_relationships} tr JOIN {term_taxonomy} tt USING(term_taxonomy_id) JOIN {terms} t USING(term_id)
            WHERE tr.object_id = p.ID AND tt.taxonomy = 'category') cats
       FROM {posts} p WHERE p.post_type = 'post' AND p.post_status = 'publish' ORDER BY p.post_date_gmt`,
    );
    const others = posts.filter((p) => !(p.cats ?? '').split('|').includes('new member'));
    ctx.report.expect('blog post', others.length);
    for (const p of others) {
      const paras = htmlToParagraphs(p.content);
      const rawTitle = decodeEntities(p.title).trim();
      const image = (await media.url(p.thumb)) ?? (await media.url(firstImg(p.content)));
      const date = mysqlUtc(p.date);
      const category = (p.cats ?? '').split('|').filter(Boolean)[0] ?? null;
      if (paras.join(' ').length > 1500) {
        // "'Seizing the Moment' by Jake Heyka"
        const m = rawTitle.match(/^['‘“"]?(.+?)['’”"]?\s+by\s+(.+)$/i);
        const title = m ? m[1].trim() : rawTitle;
        const authorName = m ? m[2].trim() : 'Forum 500';
        const author = m ? matchMember(people, authorName) : null;
        const slug = await articleSlug('post', p.id, slugify(p.slug || title));
        const data = {
          slug, publication: 'member' as const, title, body: paras, authorName, authorMemberId: author && !author.fuzzy ? author.id : null,
          isMember: !!(author && !author.fuzzy), imageUrl: image, publishedAt: date, readMinutes: readMinutes(paras),
          sectionLabel: category, status: 'published' as const, visibility: 'members' as const,
        };
        await ctx.upsert('post', p.id, 'Article', {
          create: () => db.article.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
          update: (id) => db.article.update({ where: { id }, data: { ...data, slug: undefined } }),
          exists: exists('article'),
        }, { oldUrl: `/${p.slug}/`, newUrl: `/media/articles/${slug}` });
      } else {
        const data = {
          authorName: 'Forum Team', authorMeta: category, body: [rawTitle, ...paras].join('\n\n'), imageUrl: image,
          imageAlt: image ? rawTitle : null, status: 'published' as const,
        };
        await ctx.upsert('post', p.id, 'FeedPost', {
          create: () => db.feedPost.create({ data: { ...data, createdAt: date ?? undefined, createdBy: IMPORT_ACTOR } }),
          update: (id) => db.feedPost.update({ where: { id }, data }),
          exists: exists('feedPost'),
        }, { oldUrl: `/${p.slug}/`, newUrl: '/media/newsfeed' });
      }
    }

    const pages = await ctx.q<{ id: number; title: string; slug: string; content: string; date: string; thumb: string | null }>(
      `SELECT p.ID id, p.post_title title, p.post_name slug, p.post_content content, p.post_date_gmt date,
         (SELECT meta_value FROM {postmeta} WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1) thumb
       FROM {posts} p WHERE p.ID IN (?)`, [PAGE.reports],
    );
    ctx.report.expect('event write-up', pages.length);
    for (const p of pages) {
      const paras = htmlToParagraphs(p.content).filter((x) => !/^(connecting\.{3}|read more|back to top)$/i.test(x));
      const title = decodeEntities(p.title).trim();
      const slug = await articleSlug('report', p.id, slugify(p.slug || title));
      const data = {
        slug, publication: 'report' as const, title, body: paras, authorName: 'Forum 500', standfirst: paras[0] && paras[0].length < 300 ? paras[0] : null,
        imageUrl: (await media.url(p.thumb)) ?? (await media.url(firstImg(p.content))), publishedAt: mysqlUtc(p.date),
        readMinutes: readMinutes(paras), dateLabel: title.match(/\d{1,2}(?:st|nd|rd|th)?\s+[A-Z][a-z]+(?:\s+\d{4})?/)?.[0] ?? null,
        status: 'published' as const, visibility: 'members' as const,
      };
      await ctx.upsert('report', p.id, 'Article', {
        create: () => db.article.create({ data: { ...data, createdBy: IMPORT_ACTOR } }),
        update: (id) => db.article.update({ where: { id }, data: { ...data, slug: undefined } }),
        exists: exists('article'),
      }, { oldUrl: `/${p.slug}/`, newUrl: `/media/articles/${slug}` });
    }
  });

  // ───────────── Event-planning boards → CSV (not rebuilt in the app) ─────────────
  await ctx.step('projects-csv', async () => {
    const projects = await ctx.q(`SELECT id, title, description, status, created_at, completed_at FROM {pm_projects}`);
    const tasks = await ctx.q(`SELECT id, project_id, title, description, status, start_at, due_date, completed_at, created_at FROM {pm_tasks}`);
    const csv = (rows: Record<string, any>[]) => {
      if (!rows.length) return '';
      const cols = Object.keys(rows[0]);
      const cell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
    };
    writeFileSync(join(ctx.opt.reportDir, 'wp-projects.csv'), csv(projects));
    writeFileSync(join(ctx.opt.reportDir, 'wp-project-tasks.csv'), csv(tasks));
    ctx.report.note('project boards (CSV)', `${projects.length} projects, ${tasks.length} tasks → wp-projects.csv, wp-project-tasks.csv`);
  });
}

// ───────────── Magazine article text ─────────────

function rtfToText(file: string): string {
  try {
    return execFileSync('textutil', ['-convert', 'txt', '-stdout', file], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  } catch {
    return stripRtf(readFileSync(file, 'latin1'));
  }
}

/** Fallback when macOS textutil isn't available: good enough for plain-text RTF from page layout apps. */
function stripRtf(rtf: string): string {
  return rtf
    .replace(/\{\\\*[^{}]*(\{[^{}]*\}[^{}]*)*\}/g, '')
    .replace(/\{\\(fonttbl|colortbl|stylesheet|info)[\s\S]*?\}\s*\}/g, '')
    .replace(/\\u(-?\d+)\??/g, (_, n) => String.fromCharCode(n < 0 ? +n + 65536 : +n))
    .replace(/\\'([0-9a-f]{2})/gi, (_, h) => Buffer.from([parseInt(h, 16)]).toString('latin1'))
    .replace(/\\(par|line)\b ?/g, '\n')
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '');
}

const BOILERPLATE = [
  /^IN:FORUM (SPRING|SUMMER|AUTUMN|WINTER) \d{4}$/i,
  /^If you would like to feature/i,
  /^Find out more about .* via the Forum app/i,
];

/**
 * Title / kicker / byline / body heuristics for the magazine RTFs:
 *   line 1 = title (the folder name is used instead), line 2 = kicker (standfirst), a short
 *   name-like line = byline; trailing "NAME" + "CITY | Role" lines = author signature;
 *   pull quotes repeated at the end are dropped; lines broken mid-sentence are re-joined.
 */
export function parseMagazineArticle(text: string, title: string) {
  let lines = text.replace(/\r/g, '').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  lines = lines.filter((l) => !BOILERPLATE.some((re) => re.test(l)));
  // Line 1 is always the title as printed (or a header such as "IN:FORUM PROFILE", followed by the subject's name).
  const header = lines.shift() ?? '';
  if (/^IN:FORUM PROFILE$/i.test(header)) lines.shift();

  // A byline: short, no sentence punctuation, and every word capitalised ("Jake Heyka", "SIMON JACOT de BOINOD",
  // "ALAN HILBURG, SAID SAILLANT") — so a lower-case subtitle like "Asset manager liquidity options" isn't one.
  const PARTICLES = new Set(['de', 'da', 'di', 'du', 'van', 'von', 'der', 'den', 'la', 'le', 'and', 'by', '&', 'ph.d.', 'phd']);
  const looksLikeName = (l: string) =>
    l.length <= 80 && !/[.?!:;]$/.test(l.replace(/ph\.?d\.?$/i, '')) && !/[|(]/.test(l) &&
    l.split(/[\s,]+/).filter((w) => w && !PARTICLES.has(w.toLowerCase())).length <= 6 &&
    l.split(/[\s,]+/).filter(Boolean).every((w) => /^[\p{Lu}(‘'“"]/u.test(w) || PARTICLES.has(w.toLowerCase()));
  let standfirst: string | null = null;
  let authorName: string | null = null;
  if (lines[0] && !looksLikeName(lines[0]) && lines[0].length <= 260) standfirst = lines.shift()!;
  else if (lines[0] && lines[1] && looksLikeName(lines[1]) && lines[0].length <= 260 && lines[0] === lines[0].toUpperCase()) standfirst = lines.shift()!;
  if (lines[0] && looksLikeName(lines[0])) authorName = lines.shift()!.replace(/^BY\s+/i, '');
  // "SIMON JACOT de BOINOD" → "Simon Jacot de Boinod" (particles stay lower-case).
  if (authorName && authorName.split(/\s+/).every((w) => PARTICLES.has(w) || w === w.toUpperCase())) {
    authorName = titleCase(authorName.toUpperCase()).replace(/\b(De|Da|Di|Du|Van|Von|Der|Den|La|Le)\b(?=\s)/g, (p) => p.toLowerCase()).replace(/Ph\.d\./i, 'Ph.D.');
  }

  // Signature at the end: "Jake Heyka" / "NEW YORK | Investment Lawyer".
  let authorRole: string | null = null;
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
    if (/^[A-ZÀ-Ü ]{3,}\s*\|/.test(lines[i]) || /^[A-Za-z .'-]+\s{2,}[A-ZÀ-Ü ]{3,}\s*\|/.test(lines[i])) {
      authorRole = lines[i].replace(/^.*?\s{2,}(?=[A-ZÀ-Ü ]{3,}\s*\|)/, '').trim();
      lines.splice(i, 1);
      if (lines[i - 1] && looksLikeName(lines[i - 1]) && (!authorName || nameKey(lines[i - 1]).includes(nameKey(authorName).split(' ').pop() ?? ''))) {
        authorName ??= lines[i - 1];
        lines.splice(i - 1, 1);
      }
      break;
    }
  }

  // Re-join lines broken mid-sentence, then drop pull quotes that repeat the body.
  const body: string[] = [];
  for (const l of lines) {
    if (body.length && /^[a-z(]/.test(l)) body[body.length - 1] += ` ${l}`;
    else body.push(l);
  }
  const seen = body.map((b) => nameKey(b));
  const kept = body.filter((b, i) => {
    const k = nameKey(b).replace(/^(.{0,8})/, '');
    if (b.length < 400 && /^[‘'“"…]/.test(b) && seen.some((s, j) => j !== i && s.includes(k.slice(0, 60)))) return false;
    return true;
  });
  return { standfirst: standfirst ? truncate(standfirst, 300) : null, authorName, authorRole, body: textParagraphs(kept.join('\n\n')) };
}
