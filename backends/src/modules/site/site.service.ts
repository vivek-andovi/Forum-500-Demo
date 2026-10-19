import { Injectable, NotFoundException } from '@nestjs/common';
import { EventKind, NavMenu, PitchFormat, VenueCategory } from '@prisma/client';
import { env } from '../../core/config/env';
import { SiteRepository } from './site.repository';

/** Option lists that mirror database enums, plus admin-editable lists stored in settings. */
const DEFAULT_LISTS = {
  inviteAudiences: [
    'All Members', 'My chapter', 'Members travelling to the city', 'Selected Members',
    'WhatsApp chapter groups', 'Interest groups', 'External network (guests of Members)', 'Partners & sponsors',
  ],
  supportOptions: ['Venue sourcing', 'Invitations & guest list', 'Photography', 'Catering & drinks', 'Speaker introductions', 'Budget & sponsorship'],
  recommendationCategories: [
    { id: 'eat', label: 'Where to eat' },
    { id: 'stay', label: 'Where to stay' },
    { id: 'travel', label: 'Where to travel' },
    { id: 'read', label: 'What to read' },
  ],
};

const asset = (f: string) => `${env().PUBLIC_API_URL}/static/assets/${f}`;
const DEFAULT_SITE = {
  name: 'Forum500',
  membershipHeading: 'Membership',
  /** Shown when an event / library item has no image of its own. */
  fallbackEventImageUrl: asset('hero-salon.jpg'),
  fallbackCoverImageUrl: asset('inforum-hero.jpg'),
  tagline: 'Making Ideas Happen',
  footerBlurb: 'A private membership for people who make ideas happen. Founded in London, 2010.',
  membershipBlurb: 'Membership is by invitation and member recommendation. To express an interest, ask a member to introduce you.',
  copyright: 'Forum500. All rights reserved.',
};

@Injectable()
export class SiteService {
  constructor(private readonly repo: SiteRepository) {}

  private async setting<T>(key: string, fallback: T): Promise<T> {
    const row = await this.repo.findSetting(key);
    return (row?.value as T) ?? fallback;
  }

  private async menu(menu: NavMenu) {
    const items = await this.repo.listMenu(menu);
    return items.map(({ children, ...i }) => ({ ...i, children }));
  }

  /** Everything the public layout and About page need in one call. */
  async publicSite() {
    const [chapters, benefits, settings, header, footer] = await Promise.all([
      this.repo.listChaptersForSite(),
      this.repo.listClubBenefits(),
      this.setting('site', DEFAULT_SITE),
      this.menu('site_header'),
      this.menu('site_footer'),
    ]);
    return { chapters, benefits, settings: { ...DEFAULT_SITE, ...settings }, navigation: { header, footer } };
  }

  /** Member layout: sidebar navigation (admin-managed) and site settings. */
  async memberSite() {
    const [sidebar, settings, headers] = await Promise.all([
      this.menu('member_sidebar'),
      this.setting('site', DEFAULT_SITE),
      this.repo.listPublishedPageHeaders(['membership', 'events', 'media', 'comms', 'dashboard', 'ask-zola']),
    ]);
    return {
      navigation: { sidebar },
      settings: { ...DEFAULT_SITE, ...settings },
      pageHeaders: Object.fromEntries(headers.map(({ slug, ...copy }) => [slug, copy])),
    };
  }

  /** A CMS page plus its cards (placements starting with "<slug>_", e.g. "home_engage"). */
  async page(slug: string) {
    const page = await this.repo.findPublishedPage(slug);
    if (!page) throw new NotFoundException('Page not found');
    const cards = await this.repo.listCards(`${slug}_`);
    return { ...page, cards };
  }

  async lookups() {
    const [sectors, chapters, allChapters, profileQuestions, lists] = await Promise.all([
      this.repo.listSectors(),
      this.repo.listDirectoryChapters(),
      this.repo.listAllChapters(),
      this.repo.listActiveQuestions(),
      this.setting('lookup_lists', DEFAULT_LISTS),
    ]);
    return {
      sectors,
      chapters,
      allChapters,
      profileQuestions,
      eventKinds: Object.values(EventKind),
      venueCategories: Object.values(VenueCategory),
      pitchFormats: Object.values(PitchFormat),
      ...DEFAULT_LISTS,
      ...lists,
    };
  }
}
