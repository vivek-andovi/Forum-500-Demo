/* Website content that used to be hard-coded in the Next.js apps. Seeded into the CMS tables. */
const A = (f: string) => `${process.env.PUBLIC_API_URL ?? 'http://localhost:4000'}/static/assets/${f}`;

export const siteSettings = {
  name: 'Forum500',
  membershipHeading: 'Membership',
  fallbackEventImageUrl: A('hero-salon.jpg'),
  fallbackCoverImageUrl: A('inforum-hero.jpg'),
  tagline: 'Making Ideas Happen',
  footerBlurb: 'A private membership for people who make ideas happen. Founded in London, 2010.',
  membershipBlurb:
    'Membership is by invitation and member recommendation. To express an interest, ask a member to introduce you.',
  copyright: 'Forum500. All rights reserved.',
};

export const inforumTabs = [
  { id: 'editors-choice', label: "Editor's Choice" },
  { id: 'around-the-world', label: 'From Around the World' },
  { id: 'by-members', label: 'Articles by Members' },
  { id: 'recommendations', label: 'Member Recommendations' },
  { id: 'comments', label: 'Comments' },
];

export const publicPages = [
  {
    slug: 'home',
    title: 'Making Ideas Happen',
    eyebrow: 'Est. London, 2010',
    subtitle:
      'Forum500 is a diverse private community of 500 subject matter experts from around the world who together turn their intellectual curiosity into real action.',
    heroImageUrl: A('globe-hero.jpg'),
    heroImageAlt: 'A vintage-style globe with golden arcs connecting Forum500 cities',
    metaDescription:
      'Forum500 is a private membership club connecting leaders in hospitality, media and the arts across 26 cities. Making ideas happen since 2010.',
    blocks: [
      { key: 'engage', title: 'Engage with Forum', body: 'Join Friends of Forum to engage with our community and content.' },
      {
        key: 'inforum',
        eyebrow: "The Forum's journal",
        title: 'In:Forum',
        body: 'A weekly editorial digest written by and for members — news, ideas worth making happen, and the people behind them. Publicly readable here; the full edition lives behind the member sign in.',
        imageUrl: A('inforum-hero.jpg'),
        imageAlt: 'The In:Forum journal on a reading table',
        ctaLabel: 'Read In:Forum',
        ctaHref: '/inforum',
      },
    ],
  },
  {
    slug: 'about',
    title: 'A community built on trust',
    eyebrow: 'The Club',
    heroImageUrl: A('hero-salon.jpg'),
    heroImageAlt: 'A Forum500 salon dinner in a candlelit London dining room',
    metaDescription: 'Forum500 was founded in London in 2010. Membership is by invitation, on the recommendation of an existing Member.',
    body: [
      'Forum500 was founded in 2010 by Simon Jacot de Boinod and Jessica Fellowes, on a simple observation: the most valuable thing one person can give another is a good introduction.',
      'Today the Forum counts founders, writers, scientists, academics, innovators, investors, artists, politicians and philanthropists from diverse backgrounds across age, gender and geographies amongst its 500 Members across 49 chapter cities.',
      'Each Member joins by invitation, on the recommendation of an existing Member. That single rule is what keeps the room worth being in.',
    ].join('\n\n'),
    ctaLabel: 'Apply for membership',
    ctaHref: '/apply',
    blocks: [
      { key: 'chapters', title: 'Membership Chapters', imageUrl: A('chapter-map.jpg'), imageAlt: 'A vintage-style world map marking Forum500 chapter cities' },
      {
        key: 'benefits',
        title: 'Member Benefits',
        imageUrl: A('benefits-lounge.jpg'),
        imageAlt: 'A candlelit Forum500 club lounge with green leather armchairs and bookshelves',
      },
      {
        key: 'cta',
        body: 'Membership is by invitation or nomination. If you would like to be considered, tell us a little about yourself and the membership team will be in touch.',
        ctaLabel: 'Apply for membership',
        ctaHref: '/apply',
      },
    ],
  },
  {
    slug: 'inforum',
    title: 'In:Forum',
    eyebrow: "The Forum's journal",
    subtitle: 'A weekly editorial digest written by and for members — news, ideas worth making happen, and the people behind them.',
    heroImageUrl: A('inforum-hero.jpg'),
    heroImageAlt: 'The In:Forum journal on a reading table',
    metaDescription: 'In:Forum — the Forum500 journal. Read the editor’s choice from the current edition.',
    blocks: [
      {
        key: 'members-only',
        title: 'The full edition is for members',
        body: 'Members read every section, previous editions, comments, recommendations and the full weekly digest.',
        ctaLabel: 'Sign in to read',
        ctaHref: '/auth',
      },
    ],
  },
  {
    slug: 'apply',
    title: 'Apply for membership',
    eyebrow: 'Membership',
    subtitle:
      'Forum500 membership is by recommendation. Tell us about yourself and the member who is recommending you — the membership team responds within two weeks.',
    metaDescription: 'Apply for Forum500 membership.',
    blocks: [
      {
        key: 'success',
        title: 'Application received',
        body: 'The membership team reviews every application and will respond within two weeks.',
        ctaLabel: 'Back to home',
        ctaHref: '/',
      },
    ],
  },
];

export const engageCards = [
  { icon: 'Newspaper', title: 'In:Forum', href: '/inforum', description: 'The weekly editorial digest written by and for members — news, ideas worth making happen, and the people behind them.' },
  { icon: 'BookOpen', title: 'Publications', href: '/inforum', description: 'The annual Forum500 Forecast, every edition of IN:FORUM, and the growing library of member essays and reports.' },
  { icon: 'Users', title: 'Partnerships', href: null, description: 'Reciprocal relationships with private clubs, hotels and cultural institutions in Forum cities around the world.' },
  { icon: 'Heart', title: 'Forum For Impact', href: null, description: 'Member-led philanthropy, pro-bono introductions and the projects where Forum500 puts its collective weight behind a cause.' },
  { icon: 'Trophy', title: 'Sporting Chance', href: null, description: 'A programme for members who believe the best introductions happen on a pitch, fairway, court or starting line.' },
  { icon: 'Handshake', title: 'Sponsorships', href: null, description: 'Opportunities for aligned brands and organisations to support Forum500 events, content and member experiences.' },
];

type Nav = { label: string; href?: string; icon?: string; highlight?: boolean; children?: { label: string; href: string }[] };

export const memberSidebar: Nav[] = [
  { label: 'Ask Zola', href: '/ask-zola', icon: 'Sparkles', highlight: true },
  { label: 'Dashboard', href: '/dashboard', icon: 'Home' },
  {
    label: 'Membership', href: '/membership', icon: 'Users',
    children: [
      { label: 'My Member Profile', href: '/membership/profile' },
      { label: 'Member Directory', href: '/membership' },
      { label: 'Member Benefits', href: '/membership/benefits' },
      { label: 'Member Groups', href: '/membership/groups' },
      { label: 'Club Rules', href: '/membership/club-rules' },
    ],
  },
  {
    label: 'Events', href: '/events', icon: 'CalendarDays',
    children: [
      { label: 'Events Calendar', href: '/events' },
      { label: 'My Events', href: '/events/my-events' },
      { label: 'Venues', href: '/events/venues' },
      { label: 'Gallery', href: '/events/gallery' },
    ],
  },
  {
    label: 'Media', href: '/media', icon: 'Newspaper',
    children: [
      { label: 'In:Forum', href: '/media/inforum' },
      { label: 'Forum500 Forecast', href: '/media/forecast' },
      { label: 'Podcasts', href: '/media/podcasts' },
      { label: 'Forum Radio', href: '/media/forum-radio' },
      { label: 'What to read', href: '/media/reading' },
      { label: 'Member articles', href: '/media/articles' },
      { label: 'Member Books', href: '/media/books' },
      { label: 'Library', href: '/media/library' },
      { label: 'Newsfeed', href: '/media/newsfeed' },
    ],
  },
  {
    label: 'Communications', href: '/comms', icon: 'MessageSquare',
    children: [
      { label: 'Member Introductions', href: '/comms/introductions' },
      { label: 'WhatsApp groups', href: '/comms/whatsapp' },
      { label: 'Messages', href: '/comms/messages' },
      { label: 'Emails', href: '/comms/emails' },
      { label: 'Notifications', href: '/comms/notifications' },
      { label: 'Actions', href: '/comms/actions' },
      { label: 'Account', href: '/comms/account' },
    ],
  },
];

export const siteHeader: Nav[] = [
  { label: 'Home', href: '/' },
  { label: 'The Club', href: '/about' },
  { label: 'In:Forum', href: '/inforum' },
];

export const siteFooter: Nav[] = [
  {
    label: 'Explore',
    children: [
      { label: 'The Club', href: '/about' },
      { label: 'In:Forum', href: '/inforum' },
      { label: 'Member sign in', href: '/auth' },
    ],
  },
];

export const quickPrompts = [
  { key: 'travel', label: 'Travel connect', icon: 'Plane', template: "I'm traveling to [SOMEWHERE] for [PURPOSE]. Please connect me with relevant Forum members who might be there or have useful local contacts." },
  { key: 'needs-leads', label: 'Needs & Leads', icon: 'HeartHandshake', template: "I have a Need or Lead I'd like to share with Forum members. [DESCRIBE WHAT YOU NEED OR WHAT YOU CAN OFFER]. Please help surface the right connects." },
  { key: 'shared-interests', label: 'Shared interests', icon: 'Users', template: "Please connect me with Forum members who share an interest in [WORK TOPIC OR SOCIAL INTEREST] — I'd love to meet them for [COFFEE / CALL / DINNER / COLLABORATION]." },
  { key: 'advice', label: 'Expert advice', icon: 'Briefcase', template: "I'd like advice on [TOPIC / DECISION]. Can you introduce me to a Forum member with relevant experience, or suggest who I should speak to?" },
  { key: 'events', label: 'Event recommendation', icon: 'CalendarDays', template: "What Forum gatherings, salons, or member-organized events should I attend in the next few weeks? I'm particularly interested in [TOPIC / CITY / FORMAT]." },
  { key: 'host', label: 'Find a host', icon: 'MapPin', template: "I'm visiting [CITY] and would love to meet Forum members there. Can you suggest a host, venue, or upcoming gathering I can join?" },
  { key: 'idea', label: 'Make an idea happen', icon: 'Lightbulb', template: 'I have an idea for Forum500 / In:Forum / an event / a partnership. [DESCRIBE THE IDEA]. Who should I speak to about making it happen?' },
  { key: 'general', label: 'Ask anything', icon: 'MessageCircleQuestion', template: '' },
];

/** Group chat history (author names matched to members where possible). */
export const groupChats: Record<string, { author: string; body: string; hoursAgo: number }[]> = {
  London: [
    { author: 'Jessica Bell', body: "Two seats have opened for Thursday's salon at the Mayfair dining room — first to reply.", hoursAgo: 5 },
    { author: 'James Whitfield', body: "I'll take one. Bringing a guest from the Oxford chapter if there's room.", hoursAgo: 4.8 },
    { author: 'Anish Malhotra', body: 'Put me down for the second seat — landing that morning.', hoursAgo: 4.6 },
    { author: 'Jessica Bell', body: 'Both confirmed. Jacket, no tie. 7pm for 7:30.', hoursAgo: 4.4 },
  ],
  'New York': [
    { author: 'Amara Osei', body: 'Anyone free for a working breakfast on Tuesday? Thinking Locanda Verde.', hoursAgo: 28 },
    { author: 'Anish Malhotra', body: 'In. 8am works for me.', hoursAgo: 27.5 },
    { author: 'Daniel Okafor', body: "Same — I'll bring the founder I mentioned at the last dinner.", hoursAgo: 27 },
  ],
  Singapore: [
    { author: 'Priya Nair', body: 'Anyone in town the week of the rooftop reception?', hoursAgo: 60 },
    { author: 'Priya Nair', body: 'Happy to host a small dinner the night before for members travelling in.', hoursAgo: 59.5 },
  ],
};

/** Direct-message threads for the demo member (other member's name → messages; `me` = Anish). */
export const directMessages: Record<string, { me: boolean; body: string; hoursAgo: number }[]> = {
  'Amara Osei': [
    { me: false, body: 'Would be wonderful to continue our conversation from the salon…', hoursAgo: 2 },
  ],
  'James Whitfield': [
    { me: true, body: 'James — thank you for introducing me to the Meridian team.', hoursAgo: 30 },
    { me: false, body: 'Thank you for the introduction — we met yesterday.', hoursAgo: 26 },
  ],
  'Priya Nair': [
    { me: false, body: 'Are you in Singapore the week of the reception?', hoursAgo: 80 },
    { me: true, body: 'Yes — arriving the Tuesday. Coffee?', hoursAgo: 79 },
  ],
  'Sofia Lindqvist': [
    { me: false, body: 'The chapter committee loved your idea for the autumn dinner.', hoursAgo: 170 },
  ],
};

/** Extra content for member pages (merged into their page-header records). */
export const memberPageExtras: Record<string, { heroImageUrl?: string; heroImageAlt?: string; body?: string; blocks?: unknown[] }> = {
  'media/podcasts': {
    heroImageUrl: A('media-podcast.jpg'),
    heroImageAlt: 'Forum podcast recording in progress',
    body: 'Also on Spotify and Apple Podcasts — search “Forum Radio”.',
  },
  'media/forum-radio': {
    heroImageUrl: A('media-podcast.jpg'),
    heroImageAlt: 'A Forum Radio recording session',
    body: 'Also on Spotify and Apple Podcasts — search “Forum Radio”.',
  },
  'media/inforum': {
    blocks: [
      {
        key: 'pitch',
        title: 'Make an idea happen',
        body: 'Members can pitch a story, offer a dispatch from their city, or suggest a subject for the editors. Every submission is reviewed by Jessica and Simon before publication.',
        ctaLabel: 'Pitch a story',
      },
    ],
  },
};
