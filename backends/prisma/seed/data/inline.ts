// @ts-nocheck
/* Inline data extracted from prototype route files. */
const A = (f: string) => `${process.env.PUBLIC_API_URL ?? "http://localhost:4000"}/static/assets/${f}`;

const partnerRestaurants = A("partner-restaurants.jpg");
const partnerClubs = A("partner-clubs.jpg");
const partnerHotel = A("partner-hotel.jpg");
const mediaPodcast = A("media-podcast.jpg");
const heroSalon = A("hero-salon.jpg");
const benefitsLounge = A("benefits-lounge.jpg");
const eventSingapore = A("event-singapore.jpg");
const eventLondon = A("event-london.jpg");
export const venues_venues = [
  {
    id: "mayfair-dining-room",
    name: "The Mayfair Dining Room",
    city: "London",
    category: "Restaurants",
    access: "Preferred partnership — private room held for Forum",
    description: "A panelled room for eighteen at a single table, used for the London evening salons.",
    image: partnerRestaurants,
  },
  {
    id: "st-james-club",
    name: "A private club, St James's",
    city: "London",
    category: "Clubs",
    access: "Reciprocal access for Members",
    description: "Drawing rooms and a library for receptions of up to sixty, with reciprocal access for travelling Members.",
    image: partnerClubs,
  },
  {
    id: "forum-radio-studio",
    name: "Forum Radio Studio",
    city: "London",
    category: "Studios",
    access: "Forum owned — book through the events team",
    description: "Two-seat recording booth for podcast interviews and Forum TV segments.",
    image: mediaPodcast,
  },
  {
    id: "chelsea-salon",
    name: "The Chelsea Salon",
    city: "London",
    category: "Salons",
    access: "Member's home — by invitation of the host",
    description: "An intimate drawing room for salons of twenty, with art from the host's collection.",
    image: heroSalon,
  },
  {
    id: "tribeca-loft",
    name: "Tribeca Loft",
    city: "New York",
    category: "Studios",
    access: "Preferred rate for Member events",
    description: "A daylight loft for launches, exhibitions and photography, seating up to eighty standing.",
    image: benefitsLounge,
  },
  {
    id: "marina-bay-terrace",
    name: "Marina Bay Rooftop Terrace",
    city: "Singapore",
    category: "Clubs",
    access: "Preferred partnership",
    description: "Open-air terrace over the bay, home of the Singapore chapter's autumn reception.",
    image: eventSingapore,
  },
  {
    id: "harbour-house",
    name: "Harbour House",
    city: "Nassau",
    category: "Hotels",
    access: "Preferred rates and private dining for Members",
    description: "Colonial harbour hotel used for the Forum weekend gathering, with terraces for dinners.",
    image: partnerHotel,
  },
  {
    id: "gamla-stan-house",
    name: "Gamla Stan House",
    city: "Stockholm",
    category: "Private homes",
    access: "Member's home — by arrangement",
    description: "An eighteenth-century house in the old town, used for roundtables of a dozen.",
    image: eventLondon,
  },
];
const eventNassau = A("event-nassau.jpg");
const eventStockholm = A("event-stockholm.jpg");
const candidLondonDinner = A("candid-london-dinner.jpg");
const candidLondonSpeaker = A("candid-london-speaker.jpg");
const candidSingaporeRooftop = A("candid-singapore-rooftop.jpg");
const candidNassauBoat = A("candid-nassau-boat.jpg");
const candidStockholmRoundtable = A("candid-stockholm-roundtable.jpg");
const candidParisDinner = A("candid-paris-dinner.jpg");
export const gallery_albums = [
  {
    id: "london-salon",
    event: "London Evening Salon",
    city: "London",
    date: "February 2026",
    cover: heroSalon,
    photos: [
      { id: "ls-1", caption: "The single table at dinner", src: heroSalon, kind: "Curated" },
      { id: "ls-2", caption: "Drinks before the address", src: eventLondon, kind: "Curated" },
      { id: "ls-3", caption: "Mid-story at the table", src: candidLondonDinner, kind: "Candid" },
      { id: "ls-4", caption: "The address, off script", src: candidLondonSpeaker, kind: "Candid" },
    ],
  },
  {
    id: "singapore-rooftop",
    event: "Singapore Rooftop Reception",
    city: "Singapore",
    date: "October 2025",
    cover: eventSingapore,
    photos: [
      { id: "sg-1", caption: "Rooftop over the bay", src: eventSingapore, kind: "Curated" },
      { id: "sg-2", caption: "Sundowners with the chapter", src: candidSingaporeRooftop, kind: "Candid" },
    ],
  },
  {
    id: "nassau-weekend",
    event: "Nassau Weekend Gathering",
    city: "Nassau",
    date: "November 2025",
    cover: eventNassau,
    photos: [
      { id: "na-1", caption: "Weekend on the water", src: eventNassau, kind: "Curated" },
      { id: "na-2", caption: "Deck crew, golden hour", src: candidNassauBoat, kind: "Candid" },
    ],
  },
  {
    id: "stockholm-roundtable",
    event: "Stockholm Ideas Roundtable",
    city: "Stockholm",
    date: "September 2025",
    cover: eventStockholm,
    photos: [
      { id: "st-1", caption: "Roundtable in the old town", src: eventStockholm, kind: "Curated" },
      { id: "st-2", caption: "Coffee and a disagreement", src: candidStockholmRoundtable, kind: "Candid" },
    ],
  },
  {
    id: "paris-dinner",
    event: "Members' Dinner",
    city: "Paris",
    date: "May 2025",
    cover: partnerRestaurants,
    photos: [
      { id: "pa-1", caption: "Chef's table", src: partnerRestaurants, kind: "Curated" },
      { id: "pa-2", caption: "A toast at the counter", src: candidParisDinner, kind: "Candid" },
    ],
  },
  {
    id: "london-reception",
    event: "Chapter Reception",
    city: "London",
    date: "March 2025",
    cover: partnerClubs,
    photos: [
      { id: "lr-1", caption: "The drawing room", src: partnerClubs, kind: "Curated" },
      { id: "lr-2", caption: "Recording Forum Radio", src: mediaPodcast, kind: "Candid" },
      { id: "lr-3", caption: "Members' lounge", src: benefitsLounge, kind: "Candid" },
    ],
  },
];
const candidSingapore = A("candid-singapore-rooftop.jpg");
const candidStockholm = A("candid-stockholm-roundtable.jpg");
const candidNassau = A("candid-nassau-boat.jpg");
const companyPlotify = A("company-plotify.jpg");
const memberShreyas = A("member-shreyas.jpg");
const memberAmara = A("member-amara.jpg");
const memberJames = A("member-james.jpg");
const memberPriya = A("member-priya.jpg");
const memberSofia = A("member-sofia.jpg");
const memberDaniel = A("member-daniel.jpg");
export const newsfeed_posts = [
  {
    id: "p1",
    name: "Amara Osei",
    meta: "Founder · London",
    photo: memberAmara,
    time: "2h ago",
    text: "Thank you to everyone who joined Thursday's salon on climate capital. The room did what Forum rooms do — a scientist, a hotelier and a fund manager walked out with a plan. Notes and the reading list are in the Climate & Sustainability group.",
    image: eventLondon,
    imageAlt: "Members in discussion at a London salon",
    likes: 42,
    comments: 12,
  },
  {
    id: "p2",
    name: "Anish Malhotra",
    meta: "Founder, Plotify · New York",
    photo: memberShreyas,
    time: "6h ago",
    text: "Excited to share that Plotify has opened its doors to Forum members with preferred membership access — details in Member Benefits. If you're curious about building a residential portfolio, my door (and inbox) is open.",
    image: companyPlotify,
    imageAlt: "Plotify residential property portfolio",
    likes: 58,
    comments: 19,
  },
  {
    id: "p3",
    name: "Priya Nair",
    meta: "CEO, Meridian Hotels · Singapore",
    photo: memberPriya,
    time: "Yesterday",
    text: "Rooftop drinks with the Singapore chapter last night — twenty members, three visiting from London and New York, and one impromptu book swap. This is the travel network working exactly as intended.",
    image: candidSingapore,
    imageAlt: "Singapore chapter rooftop gathering at dusk",
    likes: 76,
    comments: 24,
  },
  {
    id: "p4",
    name: "Sofia Lindqvist",
    meta: "Partner, Lindqvist & Co · Stockholm",
    photo: memberSofia,
    time: "Yesterday",
    text: "Our Nordic family offices roundtable sold out in a day, so we're adding a second table in October. If you'd like a seat — or want to host one in your chapter — message me.",
    image: candidStockholm,
    imageAlt: "Roundtable conversation in Stockholm",
    likes: 34,
    comments: 8,
  },
  {
    id: "p5",
    name: "James Whitfield",
    meta: "Publisher · New York",
    photo: memberJames,
    time: "2 days ago",
    text: "My essay on the future of the printed journal is in this month's In:Forum. Would genuinely love the counter-argument — comments open, strongest rebuttal gets a bottle from my cellar.",
    likes: 51,
    comments: 31,
  },
  {
    id: "p6",
    name: "Daniel Okafor",
    meta: "Investor · Dubai",
    photo: memberDaniel,
    time: "3 days ago",
    text: "Back from the Nassau weekend — sailing, a sunrise swim, and a founders' breakfast that ran four hours. Photos are in the Gallery; tag the ones you want in your My Gallery.",
    image: candidNassau,
    imageAlt: "Members sailing off Nassau",
    likes: 89,
    comments: 27,
  },
];
const coverAutumn = A("forecast-cover-autumn.jpg");
const coverSummer = A("forecast-cover-summer.jpg");
const globeHero = A("globe-hero.jpg");
export const autumnArticles = [
  {
    id: "forecast-1",
    section: "Macro",
    title: "The capital cycle ahead: where patient money is moving now",
    standfirst:
      "From private credit in India to family-office allocations in the Gulf, members share what they are watching as rates reset and liquidity reshapes.",
    author: "Simon Foreman",
    dateline: "London",
    readTime: "6 min read",
    image: globeHero,
    caption: "Global capital flows — illustration by Forum500",
    body: [
      "After two years of rapid rate rises, the conversation among Forum500 investors has shifted from when the cycle will turn to which pockets of capital will move first.",
      "Family offices in London and Singapore report a renewed appetite for private credit, particularly in emerging-market infrastructure where local currency risk can be hedged.",
      "Real estate remains selective. The best opportunities, several members argue, are in distressed office-to-residential conversions in gateway cities and in logistics-adjacent land in the US Sun Belt.",
      "The consensus view: the next twelve months favour operators with strong balance sheets and local networks over those relying on cheap leverage.",
    ],
  },
  {
    id: "forecast-2",
    section: "Geopolitics",
    title: "Supply chains, chokepoints and the new diplomacy of ports",
    standfirst:
      "A member-led discussion on why maritime infrastructure has become the quiet front line of great-power competition.",
    author: "Jessica Foreman",
    dateline: "New York",
    readTime: "5 min read",
    image: globeHero,
    caption: "Container port at dusk",
    body: [
      "Ports are no longer just logistics assets; they are leverage. From the Red Sea to the South China Sea, control of chokepoints is shaping trade, insurance costs and alliance structures.",
      "Members with shipping and commodity backgrounds note that rerouting around the Cape has become a semi-permanent feature of global trade, not a temporary disruption.",
      "The implication for investors: higher freight costs are here to stay, and the winners will be those with vertically integrated exposure to terminals, energy transition fuels and regional warehousing.",
    ],
  },
  {
    id: "forecast-3",
    section: "Technology",
    title: "AI infrastructure: the build-out beyond the hype",
    standfirst:
      "Data centres, power contracts and chip supply: what operators are actually spending money on in 2026.",
    author: "Anish Malhotra",
    dateline: "New York",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    caption: "Server corridor in a hyperscale data centre",
    body: [
      "The AI narrative has moved from models to molecules — specifically, the electrons and concrete required to run them at scale.",
      "Members building data centres describe a scramble for power interconnection agreements and long-lead transformers. The bottleneck is not GPUs alone; it is the physical layer beneath them.",
      "For allocators, the opportunity set now includes power generation, cooling, modular construction and the real estate that houses it all.",
    ],
  },
  {
    id: "forecast-4",
    section: "Lifestyle",
    title: "The next chapter cities: where members are travelling, living and opening doors",
    standfirst:
      "From Lisbon to Jaipur, a member survey on the cities that combine quality of life with access to capital and culture.",
    author: "Zola",
    dateline: "Forum500",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    caption: "Lisbon at sunrise",
    body: [
      "When Forum500 members were asked where they would base themselves for the next chapter, the answers clustered around cities that offer density, walkability and a genuine creative scene.",
      "Lisbon, Mexico City, Dubai, Singapore and Jaipur led the list. Each offers something different: tax clarity, time-zone advantage, hospitality culture or access to founders.",
      "The common thread: members want to live where they can also do business, and they are increasingly willing to relocate for a better balance of the two.",
    ],
  },
  {
    id: "forecast-5",
    section: "Impact",
    title: "Impact at scale: five bets our members are making",
    standfirst:
      "Regenerative agriculture, clean hydrogen, education access and mental health: the themes members are backing with capital and counsel.",
    author: "Jessica Foreman",
    dateline: "London",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    caption: "Regenerative landscape",
    body: [
      "Impact investing has matured from a silo into a lens. Members are now asking not whether an investment does good, but whether it can do good at venture scale.",
      "The five most cited themes this quarter: regenerative agriculture in Southern Europe and Latin America, clean hydrogen offtake contracts, vocational education in Africa, maternal health in South Asia, and workplace mental health platforms.",
      "Several members are co-investing across these themes, combining capital with operational expertise and introductions to local partners.",
    ],
  },
];
export const summerArticles = [
  {
    id: "summer-1",
    section: "Cities",
    title: "The terrace index: which cities are winning the summer of business",
    standfirst:
      "A light-hearted but telling survey of where deals were actually struck this summer — and which hotel terraces hosted them.",
    author: "Simon Foreman",
    dateline: "London",
    readTime: "5 min read",
    image: coverSummer,
    caption: "Riviera terrace at dusk",
    body: [
      "Every summer has a geography. This year's was written on terraces from Monte Carlo to Mykonos, where members reported more first meetings per week than in any January.",
      "The pattern is instructive: capital follows conviviality. Cities that make it easy to gather outdoors — and to stay for one more hour — quietly win the introductions that matter.",
      "Our advice for the season ahead: choose your August base as deliberately as your January board calendar.",
    ],
  },
  {
    id: "summer-2",
    section: "Travel",
    title: "The chapter-city playbook: how members host when the Forum comes to town",
    standfirst:
      "Members share the dinners, walks and one perfect table they rely on when fellow members pass through their city.",
    author: "Jessica Foreman",
    dateline: "Paris",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    caption: "Paris at golden hour",
    body: [
      "Ask a Forum500 member how they host and you will rarely hear about restaurants first. The best hosts start with a walk, a view, or a room with no agenda.",
      "This summer's dispatches from Lisbon, New York and Singapore reveal a shared instinct: one unforgettable experience beats three competent ones.",
    ],
  },
];
export const forecast_editions = [
  {
    id: "autumn-2026",
    issue: "Issue 12",
    title: "The Capital Issue",
    date: "September 2026",
    cover: coverAutumn,
    letter: {
      title: "From the editors",
      body: [
        "Welcome to the Autumn edition of the Forum500 Forecast — our capital issue. Across dinners in London, New York and Dubai this summer, one question kept surfacing: where is patient money actually going next?",
        "This edition gathers the answers we heard. From the reset of the capital cycle to the physical build-out beneath the AI story, from port diplomacy to the cities members are quietly choosing as their next base, each piece begins with a member's experience rather than an abstraction.",
        "As always, the Forecast is a starting point for conversation, not the end of one. If a piece provokes a disagreement or an idea, bring it to your chapter dinner — or pitch us a response for the next edition.",
      ],
      signoff: "Simon & Jessica Foreman, Editors",
    },
    articles: autumnArticles,
  },
  {
    id: "summer-2026",
    issue: "Issue 11",
    title: "The Cities Issue",
    date: "June 2026",
    cover: coverSummer,
    letter: {
      title: "From the editors",
      body: [
        "Summer is when the Forum's map comes alive. This edition is a celebration of the cities our members call home — and the terraces, tables and walks where the best conversations of the season happened.",
        "Inside: the terrace index, and a hosting playbook from members in three chapter cities.",
      ],
      signoff: "Simon & Jessica Foreman, Editors",
    },
    articles: summerArticles,
  },
];
export const notifications_notifications = [
  {
    
    title: "New member in your chapter",
    body: "Helena Borg has joined the Stockholm chapter.",
    time: "1h ago",
  },
  {
    
    title: "RSVP reminder",
    body: "The London Evening Salon & Dinner is on Thursday 24 September.",
    time: "5h ago",
  },
  {
    
    title: "In:Forum is out",
    body: "This week's edition leads with “The return of the salon”.",
    time: "Yesterday",
  },
  {
    
    title: "Your profile was viewed",
    body: "Two members viewed your profile this week.",
    time: "Tuesday",
  },
];
export const emails_emails = [
  { id: "e1", subject: "Autumn Salon — London", sender: "Forum Team", preview: "Save the date for our annual autumn salon at the ICA.", time: "Yesterday", unread: true },
  { id: "e2", subject: "New York chapter dinner", sender: "New York Committee", preview: "We are hosting an intimate dinner on the 14th.", time: "Tuesday", unread: false },
  { id: "e3", subject: "In:Forum contributor invitation", sender: "Jessica", preview: "Would love your thoughts on the next Forecast piece.", time: "Last week", unread: false },
  { id: "e4", subject: "Member benefit: Plotify update", sender: "Anish Malhotra", preview: "Preferred access is now open to all members.", time: "Last week", unread: false },
];
