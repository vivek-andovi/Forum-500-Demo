// @ts-nocheck
/* Generated from the Lovable prototype. */
const A = (f: string) => `${process.env.PUBLIC_API_URL ?? "http://localhost:4000"}/static/assets/${f}`;
// Mock content for the Forum500 first version. Replace with backend queries later.

const eventLondon = A("event-london.jpg");
const eventNassau = A("event-nassau.jpg");
const eventSingapore = A("event-singapore.jpg");
const eventStockholm = A("event-stockholm.jpg");
const memberHelena = A("member-helena.jpg");
const memberShreyas = A("member-shreyas.jpg");
const memberAmara = A("member-amara.jpg");
const memberJames = A("member-james.jpg");
const memberPriya = A("member-priya.jpg");
const memberTomas = A("member-tomas.jpg");
const memberSofia = A("member-sofia.jpg");
const memberDaniel = A("member-daniel.jpg");
const partnerHotel = A("partner-hotel.jpg");
const partnerFlights = A("partner-flights.jpg");
const partnerClubs = A("partner-clubs.jpg");
const partnerRestaurants = A("partner-restaurants.jpg");
const partnerBrands = A("partner-brands.jpg");
const partnerEducation = A("partner-education.jpg");
const companyPlotify = A("company-plotify.jpg");
const companyMeridian = A("company-meridian.jpg");
const companyOsei = A("company-osei.jpg");
const companyWhitfield = A("company-whitfield.jpg");
const companyLindqvist = A("company-lindqvist.jpg");
const companyOkafor = A("company-okafor.jpg");
const bookRooms = A("book-rooms.jpg");
const bookSailing = A("book-sailing.jpg");
const bookNineties = A("book-nineties.jpg");
const bookBuildings = A("book-buildings.jpg");
const articleLongLunch = A("article-long-lunch.jpg");
const articlePatientCapital = A("article-patient-capital.jpg");
const articleHotelHome = A("article-hotel-home.jpg");
const mediaPodcast = A("media-podcast.jpg");
export interface Member {
  id: string;
  name: string;
  headline: string;
  company: string;
  city: string;
  sector: string;
  interests: string[];
  bio: string;
  joined: number;
  tier: string;
  photo: string;
}

export const members: Member[] = [
  {
    id: "amara-osei",
    name: "Amara Osei",
    headline: "Founder & Creative Director",
    company: "Osei Studio",
    city: "London",
    sector: "Media & Arts",
    interests: ["Contemporary art", "Independent film", "Design", "Travel"],
    bio: "Amara founded Osei Studio after a decade in broadcast journalism. She advises cultural institutions on storytelling and sits on the board of two arts charities. A Forum member since 2018, she hosts the London film salon.",
    joined: 2018,
    tier: "Full Member",
    photo: memberAmara,
  },
  {
    id: "james-whitfield",
    name: "James Whitfield",
    headline: "Managing Partner",
    company: "Whitfield Capital",
    city: "New York",
    sector: "Finance",
    interests: ["Hospitality investment", "Sailing", "Wine", "Architecture"],
    bio: "James leads a boutique investment firm focused on hospitality and leisure. He previously ran asset management for a global hotel group and co-chairs the Forum's New York chapter.",
    joined: 2015,
    tier: "Full Member",
    photo: memberJames,
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    headline: "Chief Executive",
    company: "Meridian Hotels",
    city: "Singapore",
    sector: "Hospitality",
    interests: ["Luxury travel", "Wellness", "Food & wine", "Mentoring"],
    bio: "Priya runs a portfolio of design-led hotels across Southeast Asia. She is a regular speaker on the future of hospitality and hosts the Singapore chapter's quarterly dinner.",
    joined: 2019,
    tier: "Full Member",
    photo: memberPriya,
  },
  {
    id: "tomás-herrera",
    name: "Tomás Herrera",
    headline: "Editor-in-Chief",
    company: "The Meridian Review",
    city: "Madrid",
    sector: "Media & Arts",
    interests: ["Journalism", "Politics", "Literature", "Padel"],
    bio: "Tomás edits an international affairs quarterly and writes on European politics. He curates the Forum's IN:FORUM journal and moderates the Madrid roundtable series.",
    joined: 2020,
    tier: "Full Member",
    photo: memberTomas,
  },
  {
    id: "sofia-lindqvist",
    name: "Sofia Lindqvist",
    headline: "Founder",
    company: "Lindqvist Ventures",
    city: "Stockholm",
    sector: "Technology",
    interests: ["Startups", "Nordic design", "Cross-country skiing", "Philanthropy"],
    bio: "Sofia backs early-stage founders across the Nordics after selling her own software company in 2021. She leads the Forum's technology sector group and the Stockholm chapter.",
    joined: 2021,
    tier: "Full Member",
    photo: memberSofia,
  },
  {
    id: "daniel-okafor",
    name: "Daniel Okafor",
    headline: "Director",
    company: "Okafor Advisory",
    city: "Dubai",
    sector: "Professional Services",
    interests: ["Family enterprise", "Golf", "Art collecting", "Mentoring"],
    bio: "Daniel advises family businesses on governance and succession across the Gulf and East Africa. He co-hosts the Dubai chapter's majlis evenings.",
    joined: 2022,
    tier: "Full Member",
    photo: memberDaniel,
  },
];

export const sectors = ["Media & Arts", "Finance", "Hospitality", "Technology", "Professional Services"];
export const cities = ["London", "New York", "Singapore", "Madrid", "Stockholm", "Dubai"];

export interface ForumEvent {
  id: string;
  title: string;
  city: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  kind: "Salon" | "Dinner" | "Reception" | "Roundtable";
  image?: string;
}

export const events: ForumEvent[] = [
  {
    id: "london-evening-salon",
    title: "London Evening Salon & Dinner",
    city: "London",
    date: "Thursday 24 September 2026",
    time: "7:00 pm – 11:00 pm",
    venue: "A private members' club, Mayfair",
    description:
      "An evening of conversation over dinner in one of Mayfair's oldest dining rooms. After a drinks reception, members gather around a single table for a three-course dinner with a short address from a guest speaker on the future of independent media.",
    kind: "Salon",
    image: eventLondon,
  },
  {
    id: "singapore-rooftop-reception",
    title: "Singapore Rooftop Reception",
    city: "Singapore",
    date: "Tuesday 6 October 2026",
    time: "6:30 pm – 9:30 pm",
    venue: "Rooftop terrace, Marina Bay",
    description:
      "The Singapore chapter's autumn reception overlooking the bay. An informal evening of introductions and conversation, hosted by the chapter committee. Guests of members welcome by arrangement.",
    kind: "Reception",
    image: eventSingapore,
  },
  {
    id: "nassau-weekend-gathering",
    title: "Nassau Weekend Gathering",
    city: "Nassau",
    date: "Friday 20 – Sunday 22 November 2026",
    time: "All weekend",
    venue: "A private island residence",
    description:
      "A long weekend of sailing, conversation and long-table dinners hosted by a Forum member. Numbers are strictly limited; expressions of interest open to full members.",
    kind: "Dinner",
    image: eventNassau,
  },
  {
    id: "stockholm-ideas-roundtable",
    title: "Stockholm Ideas Roundtable",
    city: "Stockholm",
    date: "Wednesday 2 December 2026",
    time: "5:00 pm – 8:00 pm",
    venue: "Private dining room, Östermalm",
    description:
      "Twelve members, one question: where will the next decade of independent media come from? A chaired roundtable followed by supper.",
    kind: "Roundtable",
    image: eventStockholm,
  },
];

export interface NewMemberInterview {
  id: string;
  name: string;
  city: string;
  question: string;
  answer: string;
  photo: string;
  interview: { question: string; answer: string }[];
}

export const newMemberQandAs: NewMemberInterview[] = [
  {
    id: "shreyas-chityala",
    name: "Shreyas Chityala",
    city: "New York",
    question: "If you could take three things to a desert island, what would they be?",
    answer:
      "A satellite phone, a solar charger, and a Kindle with an enormous library. I enjoy adventure, but I'd still like the option of getting home.",
    photo: memberShreyas,
    interview: [
      {
        question: "If you could take three things to a desert island, what would they be?",
        answer:
          "A satellite phone, a solar charger, and a Kindle with an enormous library. I enjoy adventure, but I'd still like the option of getting home.",
      },
      {
        question: "What is your favourite book?",
        answer:
          "Endurance by Alfred Lansing — the story of Ernest Shackleton's Antarctic expedition. It is one of the greatest accounts of survival in seemingly impossible circumstances.",
      },
      {
        question: "If you could travel anywhere on Earth, where would you go?",
        answer:
          "I'd travel overland along the old Silk Road through Central Asia, following the historic routes between East and West, and ultimately end the journey in Egypt. Would be great to witness where civilizations, trade, religion, and ideas have intersected over thousands of years.",
      },
      {
        question: "Tonight, you have a chef cooking supper. Which five people (from any period in time) would you invite?",
        answer:
          "Alexander the Great, Adi Shankara, George Washington, Leonardo da Vinci, and Ayrton Senna. Five different forms of greatness — conquest and ambition, philosophy and spirituality, leadership and institution-building, creativity and invention, and competitive excellence to uplift a nation.",
      },
    ],
  },
  {
    id: "helena-borg",
    name: "Helena Borg",
    city: "Stockholm",
    question: "If you could take three things to a desert island, what would they be?",
    answer:
      "A notebook, a pen, and a good pair of boots. I'd want to keep thinking and moving.",
    photo: memberHelena,
    interview: [
      {
        question: "If you could take three things to a desert island, what would they be?",
        answer:
          "A notebook, a pen, and a good pair of boots. I'd want to keep thinking and moving.",
      },
      {
        question: "What is your favourite book?",
        answer:
          "The Years by Annie Ernaux — for how memory and history live inside ordinary life.",
      },
      {
        question: "If you could travel anywhere on Earth, where would you go?",
        answer:
          "The Faroe Islands. I've seen photographs of the light and want to understand the silence.",
      },
      {
        question: "Tonight, you have a chef cooking supper. Which five people (from any period in time) would you invite?",
        answer:
          "Rachel Carson, Ursula K. Le Guin, my grandfather, a younger version of myself, and a stranger from the future.",
      },
    ],
  },
];

export const podcastEpisodes = [
  {
    id: "ep-42",
    number: 42,
    title: "The art of the introduction",
    guest: "Simon Jacot de Boinod",
    description:
      "The Forum's co-founder on fifteen years of curated introductions, and why trust compounds faster than capital.",
    duration: "38 min", cover: mediaPodcast,
  },
  {
    id: "ep-41",
    number: 41,
    title: "Running hotels that feel like houses",
    guest: "Priya Nair",
    description: "Meridian Hotels' chief executive on intimacy at scale, and the hospitality lessons of the great clubs.",
    duration: "44 min", cover: mediaPodcast,
  },
  {
    id: "ep-40",
    number: 40,
    title: "Editing for a membership, not a market",
    guest: "Tomás Herrera",
    description: "What changes when your readers already know each other. On IN:FORUM, taste, and editorial restraint.",
    duration: "36 min", cover: mediaPodcast,
  },
  {
    id: "ep-39",
    number: 39,
    title: "Climate capital, patient capital",
    guest: "Dr. Elena Marsh",
    description: "A climate scientist turned investor on funding the long now, and what members can do beyond the cheque.",
    duration: "41 min", cover: mediaPodcast,
  },
  {
    id: "ep-38",
    number: 38,
    title: "Building across borders",
    guest: "Anish Malhotra",
    description: "The Plotify founder on twenty years across real estate, technology and capital markets — and converting new concepts into billion-dollar businesses.",
    duration: "47 min", cover: mediaPodcast,
  },
  {
    id: "ep-37",
    number: 37,
    title: "The new Grand Tour",
    guest: "Jessica Randall",
    description: "On the Forum's travel network: how members host members, and why a dinner in a chapter city beats a guidebook.",
    duration: "33 min", cover: mediaPodcast,
  },
  {
    id: "ep-36",
    number: 36,
    title: "Opera, cricket and other icebreakers",
    guest: "Marcus Webb",
    description: "A media founder on the unlikely shared interests that turn introductions into friendships.",
    duration: "39 min", cover: mediaPodcast,
  },
  {
    id: "ep-35",
    number: 35,
    title: "Philanthropy that listens",
    guest: "Dr. Amara Osei",
    description: "What $150m deployed across 80 countries teaches you about civic power, climate justice and humility.",
    duration: "45 min", cover: mediaPodcast,
  },
  {
    id: "ep-34",
    number: 34,
    title: "Salons, suppers and small rooms",
    guest: "Sofia Marchetti",
    description: "The art historian on hosting evenings people remember — and why twelve is the magic number.",
    duration: "31 min", cover: mediaPodcast,
  },
  {
    id: "ep-33",
    number: 33,
    title: "From Jaipur to the world",
    guest: "Rohan Kapoor",
    description: "A chapter chair on growing the Forum in India, and the makers and founders redefining its cities.",
    duration: "37 min", cover: mediaPodcast,
  },
];

export const libraryItems = [
  {
    id: "forecast-2026",
    title: "Forum 500 Forecast 2026",
    kind: "Annual Report",
    pages: 80,
    description: "The annual survey of member sentiment across sectors and regions, with essays on the year ahead.",
  },
  {
    id: "inforum-vol-9",
    title: "IN:FORUM — Volume IX",
    kind: "Journal",
    pages: 40,
    description: "The tri-annual member journal: essays, interviews and photography from across the chapters.",
  },
  {
    id: "inforum-vol-8",
    title: "IN:FORUM — Volume VIII",
    kind: "Journal",
    pages: 40,
    description: "The spring edition, featuring the hospitality portfolio and a profile of the Nassau chapter.",
  },
];

export const whatsappGroups = [
  "Abu Dhabi",
  "Amsterdam",
  "Barcelona",
  "Berlin",
  "Bermuda",
  "Boulder",
  "Bucharest",
  "Budapest",
  "Chicago",
  "Dubai",
  "Geneva",
  "Gibraltar",
  "Grand Bahama",
  "Gstaad",
  "Houston",
  "Istanbul",
  "Jaipur",
  "Limassol",
  "Lisbon",
  "London",
  "Los Angeles",
  "Manila",
  "Milan",
  "Monaco",
  "Montevideo",
  "Montreal",
  "Mumbai",
  "Nassau",
  "New York",
  "Nicosia",
  "Oxford",
  "Palm Beach",
  "Paris",
  "Park City",
  "Philadelphia",
  "Prague",
  "San Francisco",
  "Seattle",
  "Seoul",
  "Singapore",
  "Tamil Nadu",
  "Tel Aviv",
  "Toronto",
  "UAE",
  "Vancouver",
  "Vienna",
  "Warsaw",
  "Washington DC",
  "Zurich",
];

export const benefits = [
  {
    title: "Member Events",
    description: "Invitation-only salons with thought-leaders, annual events, and member-organized social gatherings.",
  },
  {
    title: "Travel Network",
    description: "Connect with Members whenever you travel to a chapter city.",
  },
  {
    title: "Personalized Introductions",
    description: "Curated introductions by Simon and Jessica to the people you should know.",
  },
  {
    title: "In:Forum",
    description: "Contribute as a Member and receive full access to content.",
  },
  {
    title: "Preferred Pricing",
    description: "Preferential pricing on goods and services offered by Members and partners.",
  },
];

// --- Dashboard mock data -----------------------------------------------

export const attendingEventIds = ["singapore-rooftop-reception", "stockholm-ideas-roundtable"];
export const hostingEventIds = ["london-evening-salon"];

export const memberArticles = [
  { id: "a1", title: "The quiet return of the long lunch", author: "Tomás Herrera", readTime: "6 min", image: articleLongLunch },
  { id: "a2", title: "What founders get wrong about patient capital", author: "Sofia Lindqvist", readTime: "8 min", image: articlePatientCapital },
  { id: "a3", title: "Designing hotels for people who live in them", author: "Priya Nair", readTime: "5 min", image: articleHotelHome },
];

export const readingPicks = [
  { id: "r1", title: "The Nineties", note: "Simon: a sharp reminder of how fast consensus moves." },
  { id: "r2", title: "Life Between Buildings", note: "Jess: the best book on why some rooms work." },
];

export const memberBooks = [
  { id: "b1", title: "Rooms Worth Being In", author: "Amara Osei", note: "Essays on culture and gathering.", cover: bookRooms },
  { id: "b2", title: "Sailing by Feel", author: "James Whitfield", note: "A memoir of risk, water and patience.", cover: bookSailing },
];

export const recommendedBooks = [
  {
    id: "rb1",
    title: "The Nineties",
    author: "Chuck Klosterman",
    note: "A sharp reminder of how fast consensus moves — and how little of it survives a decade.",
    cover: bookNineties,
    recommendedBy: "Simon Jones",
    chapter: "London",
  },
  {
    id: "rb2",
    title: "Life Between Buildings",
    author: "Jan Gehl",
    note: "The best book ever written on why some rooms and streets work and others die.",
    cover: bookBuildings,
    recommendedBy: "Jessica Cole",
    chapter: "New York",
  },
];

export const myWhatsappGroups = ["London", "New York", "Singapore"];

export const myGroups = [
  { id: "g1", name: "Hospitality & Travel", members: 84, note: "Openings, partnerships and places worth knowing." },
  { id: "g2", name: "Independent Media", members: 61, note: "Editors, writers and publishers across the chapters." },
  { id: "g3", name: "Impact & Philanthropy", members: 47, note: "Forum For Impact projects and co-funding." },
];

export type ForumGroup = { id: string; name: string; members: number; note: string };

export const allGroups: ForumGroup[] = [
  { id: "g1", name: "Hospitality & Travel", members: 84, note: "Openings, partnerships and places worth knowing." },
  { id: "g2", name: "Independent Media", members: 61, note: "Editors, writers and publishers across the chapters." },
  { id: "g3", name: "Impact & Philanthropy", members: 47, note: "Forum For Impact projects and co-funding." },
  { id: "g4", name: "Wine & Spirits", members: 58, note: "Tastings, cellars, vintages and vineyard visits." },
  { id: "g5", name: "Sport & Wellness", members: 72, note: "Sporting Chance fixtures, padel, golf and endurance challenges." },
  { id: "g6", name: "Education & Ideas", members: 39, note: "Learning circles, lectures and mentorship across disciplines." },
  { id: "g7", name: "Technology & AI", members: 96, note: "Founders and engineers exploring what comes next." },
  { id: "g8", name: "Real Estate & Cities", members: 53, note: "Urbanism, development and the future of places." },
  { id: "g9", name: "Food & Restaurants", members: 67, note: "Chefs, restaurateurs and tables worth travelling for." },
  { id: "g10", name: "Art & Collecting", members: 44, note: "Gallery previews, fairs and private collections." },
  { id: "g11", name: "Finance & Investment", members: 78, note: "Capital, markets and co-investment amongst Members." },
  { id: "g12", name: "Books & Writing", members: 36, note: "Authors, critics and the Forum reading circle." },
  { id: "g13", name: "Family & Parenting", members: 29, note: "Raising curious children across the chapters." },
  { id: "g14", name: "Adventure & Exploration", members: 41, note: "Expeditions, skiing, sailing and the great outdoors." },
  { id: "g15", name: "Wellness & Longevity", members: 34, note: "Healthspan, medicine and the science of living well." },
];

export const memberIntroductions = [
  {
    id: "i1",
    member: "Priya Raghavan",
    city: "Singapore",
    introducedBy: "Simon",
    note: "Hospitality investor opening a members' house in Singapore — happy to host visiting members.",
    time: "This week",
  },
  {
    id: "i2",
    member: "Marcus Feld",
    city: "Berlin",
    introducedBy: "Jessica",
    note: "Publisher of an independent design quarterly; looking to collaborate with Forum Media.",
    time: "Last week",
  },
  {
    id: "i3",
    member: "Amara Osei",
    city: "London",
    introducedBy: "David Lindqvist",
    note: "Founder in climate-tech — introduced ahead of the Stockholm Impact Forum.",
    time: "2 weeks ago",
  },
];

export const forumQuestions = [
  "If you could take three things to a desert island, what would they be?",
  "What is your favourite book?",
  "If you could travel anywhere on Earth, where would you go?",
  "Tonight, you have a chef cooking supper. Which five people (from any period in time) would you invite?",
  "What idea would you most like to make happen with the Forum?",
];

// --- Member Benefits marketplace ---------------------------------------

export interface BenefitOffer {
  id: string;
  title: string;
  offer: string;
  category: string;
  provider: string;
  providerRole?: string;
  location?: string;
  about: string;
  detail: string;
  howToRedeem: string;
  image?: string;
  /** Company/business photo band for member offers; `image` stays the member portrait. */
  companyImage?: string;
  featured?: boolean;
}

// The original Lovable-hosted portrait is not available outside Lovable; use a bundled photo.
const anishPortrait = A("member-shreyas.jpg");

export const memberOffers: BenefitOffer[] = [
  {
    id: "plotify-membership",
    title: "Plotify",
    offer: "25% off Plotify Membership",
    category: "Investing",
    provider: "Anish Malhotra",
    providerRole: "Founder & CEO, Plotify Financial Inc",
    location: "New York",
    about:
      "Plotify is a full-stack technology asset manager that helps Members around the world build portfolios of residential investment properties with speed and precision — sourcing, financing, management and reporting in one place.",
    detail:
      "Forum500 Members receive 25% off Plotify Membership for the first twelve months, together with a one-to-one portfolio strategy session and priority access to new property releases.",
    howToRedeem: "Opt in and the Plotify team will email you an invitation link with the Forum500 rate applied.",
    image: anishPortrait,
    companyImage: companyPlotify,
    featured: true,
  },
  {
    id: "meridian-hotels-rate",
    image: memberPriya,
    companyImage: companyMeridian,
    title: "Meridian Hotels",
    offer: "Member rate & suite upgrades across Southeast Asia",
    category: "Hospitality",
    provider: "Priya Nair",
    providerRole: "Chief Executive, Meridian Hotels",
    location: "Singapore",
    about: "A portfolio of design-led hotels across Southeast Asia, from Singapore to Bali and Bangkok.",
    detail:
      "Preferred Member rate at every Meridian property, complimentary upgrade subject to availability, late checkout and a welcome dinner for stays of three nights or more.",
    howToRedeem: "Opt in to receive the Member booking code and the reservations contact.",
  },
  {
    id: "osei-studio-advisory",
    title: "Osei Studio",
    offer: "Complimentary brand & storytelling review",
    category: "Media & Creative",
    provider: "Amara Osei",
    providerRole: "Founder & Creative Director",
    location: "London",
    about: "A creative studio advising cultural institutions and founder-led brands on storytelling and identity.",
    detail: "A ninety-minute review of your brand narrative with written recommendations, offered to four Members each quarter.",
    howToRedeem: "Opt in and Amara's studio will be in touch to schedule.",
    image: memberAmara,
    companyImage: companyOsei,
  },
  {
    id: "whitfield-capital-office-hours",
    title: "Whitfield Capital",
    offer: "Hospitality investment office hours",
    category: "Investing",
    provider: "James Whitfield",
    providerRole: "Managing Partner",
    location: "New York",
    about: "A boutique investment firm focused on hospitality and leisure assets in Europe and North America.",
    detail: "Monthly one-to-one sessions for Members raising or deploying capital in hospitality, plus introductions where useful.",
    howToRedeem: "Opt in to join the next month's list.",
    image: memberJames,
    companyImage: companyWhitfield,
  },
  {
    id: "lindqvist-ventures-intro",
    title: "Lindqvist Ventures",
    offer: "Early-stage founder review & warm introductions",
    category: "Technology",
    provider: "Sofia Lindqvist",
    providerRole: "Founder",
    location: "Stockholm",
    about: "An early-stage fund backing founders across the Nordics.",
    detail: "A first-look review of your deck with candid feedback, and introductions to two relevant investors or operators.",
    howToRedeem: "Opt in and share a short summary of your company.",
    image: memberSofia,
    companyImage: companyLindqvist,
  },
  {
    id: "okafor-governance-clinic",
    title: "Okafor Advisory",
    offer: "Family enterprise governance clinic",
    category: "Professional Services",
    provider: "Daniel Okafor",
    providerRole: "Director",
    location: "Dubai",
    about: "Advisers to family businesses on governance and succession across the Gulf and East Africa.",
    detail: "A confidential two-hour clinic on governance structures and succession planning for Members and their families.",
    howToRedeem: "Opt in to request a session.",
    image: memberDaniel,
    companyImage: companyOkafor,
  },
];

export const partnerOffers: BenefitOffer[] = [
  {
    id: "harbour-house-nassau",
    image: partnerHotel,
    title: "Harbour House, Nassau",
    offer: "Preferred winter rate & VIP arrival",
    category: "Hotels",
    provider: "Harbour House",
    location: "Nassau",
    about: "A colonial harbourside house of eighteen rooms, run as a private retreat.",
    detail: "Preferred nightly rate across the winter season, upgrade on arrival, and a reserved table at the harbour restaurant.",
    howToRedeem: "Opt in to receive the booking portal and Member code.",
    featured: true,
  },
  {
    id: "private-aviation",
    image: partnerFlights,
    title: "Meridian Air",
    offer: "Empty-leg alerts & 10% off charter",
    category: "Flights",
    provider: "Meridian Air",
    about: "A charter broker operating across Europe, the Gulf and North America.",
    detail: "Ten per cent off charter bookings and a weekly empty-leg alert for routes between chapter cities.",
    howToRedeem: "Opt in to join the alert list.",
  },
  {
    id: "reciprocal-clubs",
    image: partnerClubs,
    title: "Reciprocal Clubs Programme",
    offer: "Access to twelve private clubs",
    category: "Members' Clubs",
    provider: "Forum500 Partnerships",
    about: "Reciprocal arrangements with independent private clubs in chapter cities.",
    detail: "Guest access for you and one guest at twelve partner clubs, including dining rooms and workspaces, on presentation of your Member card.",
    howToRedeem: "Opt in to receive your digital Member card and the current club list.",
  },
  {
    id: "restaurant-book",
    image: partnerRestaurants,
    title: "The Forum Table",
    offer: "Priority reservations at partner restaurants",
    category: "Restaurants",
    provider: "Forum500 Partnerships",
    about: "A curated book of restaurants in chapter cities that hold tables for Members.",
    detail: "Priority booking within 48 hours, a welcome glass, and chef's table access at selected houses.",
    howToRedeem: "Opt in to unlock the reservation line.",
  },
  {
    id: "atelier-brands",
    image: partnerBrands,
    title: "Atelier Collective",
    offer: "Private appointments & 15% at partner brands",
    category: "Brands",
    provider: "Atelier Collective",
    about: "A group of independent makers in tailoring, leather goods and jewellery.",
    detail: "Private fitting appointments and fifteen per cent off first orders across the collective.",
    howToRedeem: "Opt in for introductions to each maker.",
  },
  {
    id: "executive-education",
    image: partnerEducation,
    title: "Chapter Executive Education",
    offer: "Member places on executive programmes",
    category: "Education",
    provider: "Partner business schools",
    about: "Short executive programmes with partner schools in London, Singapore and New York.",
    detail: "Reserved Member places and a reduced fee on selected short programmes, plus a Forum dinner for participants.",
    howToRedeem: "Opt in to see the current programme calendar.",
  },
];

// --- My Gallery ---------------------------------------------------------

export interface GalleryPhoto {
  id: string;
  caption: string;
  event: string;
  date: string;
  src: string;
}
