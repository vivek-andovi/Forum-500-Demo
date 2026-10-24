// @ts-nocheck
/* Generated from the Lovable prototype. */
const A = (f: string) => `${process.env.PUBLIC_API_URL ?? "http://localhost:4000"}/static/assets/${f}`;
const inforumHero = A("inforum-hero.jpg");
const geopoliticsImg = A("inforum-geopolitics.jpg");
const financeImg = A("inforum-finance.jpg");
const philanthropyImg = A("inforum-philanthropy.jpg");
const realEstateImg = A("inforum-realestate.jpg");
const travelImg = A("inforum-travel.jpg");
const lifestyleImg = A("inforum-lifestyle.jpg");
const impactImg = A("inforum-impact.jpg");
const sportImg = A("inforum-sport.jpg");
const worldImg = A("inforum-world.jpg");
const editorsImg = A("inforum-editors.jpg");
const memberSofia = A("member-sofia.jpg");
const memberPriya = A("member-priya.jpg");
const memberDaniel = A("member-daniel.jpg");
const memberJames = A("member-james.jpg");
const memberAmara = A("member-amara.jpg");
const memberTomas = A("member-tomas.jpg");
const memberHelena = A("member-helena.jpg");
const memberShreyas = A("member-shreyas.jpg");
export type InforumSection =
  | "geopolitics"
  | "finance"
  | "philanthropy"
  | "real-estate"
  | "travel"
  | "lifestyle"
  | "impact"
  | "sport";

export interface InforumArticle {
  id: string;
  title: string;
  standfirst: string;
  body: string[];
  section: InforumSection;
  sectionLabel: string;
  author: string;
  authorPhoto?: string;
  authorRole: string;
  isMember: boolean;
  editorsChoice?: boolean;
  fromAroundTheWorld?: boolean;
  dateline: string;
  date: string;
  readTime: string;
  image: string;
  caption: string;
}

export const inforumSections: { id: InforumSection; label: string }[] = [
  { id: "geopolitics", label: "Geopolitics" },
  { id: "finance", label: "Finance" },
  { id: "philanthropy", label: "Philanthropy" },
  { id: "real-estate", label: "Real Estate" },
  { id: "travel", label: "Travel" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "impact", label: "Impact" },
  { id: "sport", label: "Sport" },
];

const lorem = (subject: string) => [
  `${subject} The story begins where most Forum conversations do: in a room small enough that nobody can hide behind a slide deck.`,
  "What follows is reported from three chapters over six weeks, drawing on members who agreed to speak on the record and several who did not.",
  "The pattern is consistent. Decisions that used to take a quarter are now made across a dinner, and the people making them increasingly know each other before the deal starts.",
  "For members, the practical question is not whether this shift is real, but which introductions to make in the next ninety days.",
];

export const inforumArticles: InforumArticle[] = [
  {
    id: "corridors-of-consent",
    title: "The corridors of consent: how middle powers became the deal-makers",
    standfirst:
      "Gulf, Nordic and Southeast Asian capitals are brokering agreements the old blocs no longer can. A report from three summits.",
    body: lorem("Diplomacy has quietly moved from the podium to the corridor."),
    section: "geopolitics",
    sectionLabel: "Geopolitics",
    author: "Daniel Okafor",
    authorPhoto: memberDaniel,
    authorRole: "Contributing editor",
    isMember: true,
    editorsChoice: true,
    fromAroundTheWorld: true,
    dateline: "Abu Dhabi",
    date: "4 September 2026",
    readTime: "8 min read",
    image: geopoliticsImg,
    caption: "Delegates between sessions at a ministerial summit.",
  },
  {
    id: "patient-capital",
    title: "What founders keep getting wrong about patient capital",
    standfirst:
      "Long-horizon money is abundant again — but it is asking for something founders rarely offer: a plan for year seven.",
    body: lorem("Capital is patient; term sheets are not."),
    section: "finance",
    sectionLabel: "Finance",
    author: "Sofia Lindqvist",
    authorPhoto: memberSofia,
    authorRole: "Member contributor",
    isMember: true,
    editorsChoice: true,
    dateline: "Stockholm",
    date: "3 September 2026",
    readTime: "6 min read",
    image: financeImg,
    caption: "First light in the financial district.",
  },
  {
    id: "giving-in-public",
    title: "Giving in public: the quiet end of the anonymous donor",
    standfirst:
      "A generation of members is putting its name on the work — and finding that visibility changes what the money can do.",
    body: lorem("Anonymity was once the highest form of giving."),
    section: "philanthropy",
    sectionLabel: "Philanthropy",
    author: "Amara Osei",
    authorPhoto: memberAmara,
    authorRole: "Member contributor",
    isMember: true,
    fromAroundTheWorld: true,
    dateline: "Accra",
    date: "2 September 2026",
    readTime: "5 min read",
    image: philanthropyImg,
    caption: "A foundation's community advisory group meets.",
  },
  {
    id: "warehouse-decade",
    title: "The warehouse decade: where cities are putting their next residents",
    standfirst:
      "Industrial conversions are outperforming new towers in six of the ten Forum chapters that track housing.",
    body: lorem("The most interesting buildings in the world are the ones already standing."),
    section: "real-estate",
    sectionLabel: "Real Estate",
    author: "James Whitfield",
    authorPhoto: memberJames,
    authorRole: "Member contributor",
    isMember: true,
    editorsChoice: true,
    dateline: "Toronto",
    date: "1 September 2026",
    readTime: "7 min read",
    image: realEstateImg,
    caption: "Converted industrial terraces at golden hour.",
  },
  {
    id: "slow-crossing",
    title: "The slow crossing: why members are travelling by water again",
    standfirst:
      "Ferries, freighters and small boats are back in the itinerary — and chapter hosts are building weekends around them.",
    body: lorem("The fastest route is no longer the most valuable one."),
    section: "travel",
    sectionLabel: "Travel",
    author: "Priya Nair",
    authorPhoto: memberPriya,
    authorRole: "Member contributor",
    isMember: true,
    fromAroundTheWorld: true,
    dateline: "Hydra",
    date: "31 August 2026",
    readTime: "4 min read",
    image: travelImg,
    caption: "The evening boat at a Mediterranean quay.",
  },
  {
    id: "table-of-twelve",
    title: "The table of twelve: the format that replaced the conference",
    standfirst:
      "Across chapters, attendance at intimate dinners has doubled while panel events flatten. What the room size is really doing.",
    body: lorem("Scale made us efficient and forgettable."),
    section: "lifestyle",
    sectionLabel: "Lifestyle",
    author: "Tomás Herrera",
    authorPhoto: memberTomas,
    authorRole: "Editor at large",
    isMember: true,
    editorsChoice: true,
    dateline: "Madrid",
    date: "30 August 2026",
    readTime: "6 min read",
    image: lifestyleImg,
    caption: "A members' dinner in a private dining room.",
  },
  {
    id: "measured-impact",
    title: "Impact, measured honestly: five projects members can actually audit",
    standfirst:
      "Forum for Impact asked its members for verifiable numbers. Five projects sent them; here is what they show.",
    body: lorem("Everyone reports impact. Very few report method."),
    section: "impact",
    sectionLabel: "Impact",
    author: "Helena Brandt",
    authorPhoto: memberHelena,
    authorRole: "Member contributor",
    isMember: true,
    fromAroundTheWorld: true,
    dateline: "Cape Town",
    date: "29 August 2026",
    readTime: "9 min read",
    image: impactImg,
    caption: "A community energy and planting scheme at sunrise.",
  },
  {
    id: "world-desk",
    title: "The world desk: nine cities, one week, and the story each is telling itself",
    standfirst:
      "Our correspondents in nine chapter cities on the local argument that will matter globally within a year.",
    body: lorem("Every city is arguing about something the rest of us will inherit."),
    section: "geopolitics",
    sectionLabel: "From around the world",
    author: "In:Forum world desk",
    authorRole: "Editorial",
    isMember: false,
    fromAroundTheWorld: true,
    dateline: "Global",
    date: "28 August 2026",
    readTime: "11 min read",
    image: worldImg,
    caption: "Harbour city at dusk.",
  },
  {
    id: "editors-letter",
    title: "Editor's letter: what we are commissioning this autumn",
    standfirst:
      "Jessica and Simon on the four subjects In:Forum will pursue this season — and how members can contribute to each.",
    body: lorem("This edition marks a shift in how we commission."),
    section: "lifestyle",
    sectionLabel: "Editor's letter",
    author: "Jessica & Simon",
    authorRole: "Editors",
    isMember: false,
    editorsChoice: true,
    dateline: "London",
    date: "27 August 2026",
    readTime: "3 min read",
    image: editorsImg,
    caption: "The editorial team reviewing the autumn commissions.",
  },
  {
    id: "family-office-desk",
    title: "Inside the family office that runs like a newsroom",
    standfirst:
      "A member's investment team replaced its committee with a daily editorial meeting. Returns are not the only thing that changed.",
    body: lorem("Every allocation starts as a story someone has to defend."),
    section: "finance",
    sectionLabel: "Finance",
    author: "Shreyas Iyer",
    authorPhoto: memberShreyas,
    authorRole: "Member contributor",
    isMember: true,
    dateline: "Mumbai",
    date: "26 August 2026",
    readTime: "6 min read",
    image: inforumHero,
    caption: "A morning allocation meeting.",
  },
  {
    id: "summer-court",
    title: "The summer court: why members are playing tennis again",
    standfirst:
      "From grass courts in the Cotswolds to clay in the Hudson Valley, the club sport is becoming the season's most useful introduction.",
    body: lorem("Tennis is the only sport where conversation is part of the point."),
    section: "sport",
    sectionLabel: "Sport",
    author: "James Holloway",
    authorPhoto: memberJames,
    authorRole: "Member contributor",
    isMember: true,
    editorsChoice: true,
    dateline: "London",
    date: "5 September 2026",
    readTime: "5 min read",
    image: sportImg,
    caption: "An afternoon doubles match at a member's club.",
  },
];

export type RecommendationCategory = "eat" | "stay" | "travel" | "read";

export interface MemberRecommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  place: string;
  note: string;
  member: string;
  memberPhoto: string;
  memberChapter: string;
  image: string;
}

export const memberRecommendations: MemberRecommendation[] = [
  {
    id: "rec-eat-1",
    category: "eat",
    title: "The counter at Kol",
    place: "Marylebone, London",
    note: "Ask for the chef's counter — the corn dishes alone justify the waitlist. Tell them Forum sent you.",
    member: "Sofia Lindqvist",
    memberPhoto: memberSofia,
    memberChapter: "London",
    image: lifestyleImg,
  },
  {
    id: "rec-eat-2",
    category: "eat",
    title: "Late-night izakaya on a side street in Ebisu",
    place: "Tokyo",
    note: "No sign in English, eight seats, and the best karaage of my life. Book through your hotel concierge.",
    member: "Daniel Okafor",
    memberPhoto: memberDaniel,
    memberChapter: "Singapore",
    image: worldImg,
  },
  {
    id: "rec-stay-1",
    category: "stay",
    title: "A riad behind an unmarked door in the medina",
    place: "Marrakech",
    note: "Six rooms, a rooftop for breakfast, and a manager who will reorganise your whole trip over mint tea.",
    member: "Amara Osei",
    memberPhoto: memberAmara,
    memberChapter: "Accra",
    image: travelImg,
  },
  {
    id: "rec-stay-2",
    category: "stay",
    title: "The lakeside boathouse, not the main hotel",
    place: "Como",
    note: "Everyone books the grand hotels. The two-room boathouse on the east shore is where you actually rest.",
    member: "Helena Vasquez",
    memberPhoto: memberHelena,
    memberChapter: "Madrid",
    image: travelImg,
  },
  {
    id: "rec-travel-1",
    category: "travel",
    title: "The train from Kandy to Ella, second class, left side",
    place: "Sri Lanka",
    note: "Seven hours through tea country. Second class has the open windows and the better conversations.",
    member: "Shreyas Kapoor",
    memberPhoto: memberShreyas,
    memberChapter: "Mumbai",
    image: travelImg,
  },
  {
    id: "rec-travel-2",
    category: "travel",
    title: "The fjord ferry locals actually use",
    place: "Norway",
    note: "Skip the cruise. The postal ferry from Bergen stops at villages no tour reaches, and the light in May is absurd.",
    member: "Tomas Weber",
    memberPhoto: memberTomas,
    memberChapter: "Berlin",
    image: worldImg,
  },
  {
    id: "rec-read-1",
    category: "read",
    title: "“The Price of Time” — Edward Chancellor",
    place: "Book",
    note: "The best explanation of what zero interest rates did to us. I re-read chapters before every allocation meeting.",
    member: "James Harrington",
    memberPhoto: memberJames,
    memberChapter: "New York",
    image: financeImg,
  },
  {
    id: "rec-read-2",
    category: "read",
    title: "“The Creative Act” — Rick Rubin",
    place: "Book",
    note: "Not about music. About paying attention. I bought ten copies for my team and one for myself every year since.",
    member: "Priya Raman",
    memberPhoto: memberPriya,
    memberChapter: "San Francisco",
    image: lifestyleImg,
  },
];

export interface CommentReply {
  id: string;
  text: string;
  member: string;
  memberPhoto: string;
  memberChapter: string;
  date: string;
  recommends: number;
}

export interface MemberComment {
  id: string;
  text: string;
  member: string;
  memberPhoto: string;
  memberChapter: string;
  date: string;
  recommends: number;
  replies: CommentReply[];
}

export const memberComments: MemberComment[] = [
  {
    id: "c1",
    text: "The Gulf is no longer waiting for the West to set the agenda. It is writing its own rules, and the rest of us are learning to read them.",
    member: "Sofia Lindqvist",
    memberPhoto: memberSofia,
    memberChapter: "London",
    date: "5 September 2026",
    recommends: 42,
    replies: [
      {
        id: "c1-r1",
        text: "Agreed — the interesting part is who is financing the new rules. Family offices in Riyadh are moving faster than sovereign funds now.",
        member: "Daniel Okafor",
        memberPhoto: memberDaniel,
        memberChapter: "Singapore",
        date: "5 September 2026",
        recommends: 11,
      },
      {
        id: "c1-r2",
        text: "Read them or get left behind. I have seen more Western founders in Doha this year than in Davos.",
        member: "Anish Malhotra",
        memberPhoto: "",
        memberChapter: "London",
        date: "5 September 2026",
        recommends: 7,
      },
    ],
  },
  {
    id: "c2",
    text: "Patient capital is not about longer hold periods. It is about governance that survives the founder's exit.",
    member: "Daniel Okafor",
    memberPhoto: memberDaniel,
    memberChapter: "Singapore",
    date: "4 September 2026",
    recommends: 31,
    replies: [
      {
        id: "c2-r1",
        text: "This is the line every new fund manager should be forced to recite. Governance is the product.",
        member: "Amara Osei",
        memberPhoto: memberAmara,
        memberChapter: "Accra",
        date: "4 September 2026",
        recommends: 9,
      },
    ],
  },
  {
    id: "c3",
    text: "Philanthropy without measurement is sentiment. Philanthropy with only measurement is bureaucracy. The gap between the two is where real change lives.",
    member: "Amara Osei",
    memberPhoto: memberAmara,
    memberChapter: "Accra",
    date: "4 September 2026",
    recommends: 27,
    replies: [],
  },
  {
    id: "c4",
    text: "Cities are not running out of space. They are running out of imagination about what old buildings can become.",
    member: "James Whitfield",
    memberPhoto: memberJames,
    memberChapter: "Toronto",
    date: "3 September 2026",
    recommends: 24,
    replies: [
      {
        id: "c4-r1",
        text: "Every dead department store in Europe should be rezoned for housing tomorrow. The bricks are already paid for.",
        member: "Tomás Herrera",
        memberPhoto: memberTomas,
        memberChapter: "Madrid",
        date: "3 September 2026",
        recommends: 6,
      },
    ],
  },
  {
    id: "c5",
    text: "The best travel advice I have received lately: take the slower boat. The people you meet have already decided to be present.",
    member: "Priya Nair",
    memberPhoto: memberPriya,
    memberChapter: "Hydra",
    date: "2 September 2026",
    recommends: 19,
    replies: [],
  },
  {
    id: "c6",
    text: "Hospitality is no longer about service. It is about editing out everything that distracts from the conversation.",
    member: "Tomás Herrera",
    memberPhoto: memberTomas,
    memberChapter: "Madrid",
    date: "1 September 2026",
    recommends: 16,
    replies: [],
  },
  {
    id: "c7",
    text: "Impact investing grew up when it stopped promising to save the world and started publishing its failures.",
    member: "Helena Brandt",
    memberPhoto: memberHelena,
    memberChapter: "Cape Town",
    date: "30 August 2026",
    recommends: 12,
    replies: [],
  },
  {
    id: "c8",
    text: "Sport is the last public space where strangers still cheer for the same thing. That shared emotion is worth protecting.",
    member: "Shreyas Iyer",
    memberPhoto: memberShreyas,
    memberChapter: "Mumbai",
    date: "28 August 2026",
    recommends: 9,
    replies: [],
  },
];

export interface InforumEdition {
  id: string;
  label: string;
  publishedOn: string;
  coverLine: string;
  cover: string;
  articles: InforumArticle[];
}

const archiveArticle = (
  base: InforumArticle,
  overrides: Partial<InforumArticle> & { id: string; date: string },
): InforumArticle => ({ ...base, ...overrides });

const augustEdition: InforumArticle[] = [
  archiveArticle(inforumArticles[0]!, {
    id: "aug-quiet-alliances",
    title: "Quiet alliances: the summer of unofficial diplomacy",
    standfirst:
      "While capitals paused for August, three back-channel groups did the work that autumn will take credit for.",
    date: "7 August 2026",
    dateline: "Geneva",
    editorsChoice: true,
  }),
  archiveArticle(inforumArticles[1]!, {
    id: "aug-rate-hangover",
    title: "The rate hangover: what members are doing with idle capital",
    standfirst: "Cash yields are falling. Nine member allocators explain where the money goes next.",
    date: "6 August 2026",
    dateline: "Zurich",
  }),
  archiveArticle(inforumArticles[4]!, {
    id: "aug-island-season",
    title: "Island season: the chapters that host best in August",
    standfirst: "Hydra, Nassau and Gstaad on how a summer weekend becomes a working relationship.",
    date: "4 August 2026",
    dateline: "Nassau",
    fromAroundTheWorld: true,
  }),
  archiveArticle(inforumArticles[6]!, {
    id: "aug-water-projects",
    title: "Water, measured: four member projects that survived the drought year",
    standfirst: "Forum for Impact revisits the schemes it funded three summers ago.",
    date: "2 August 2026",
    dateline: "Cape Town",
  }),
];

const julyEdition: InforumArticle[] = [
  archiveArticle(inforumArticles[3]!, {
    id: "jul-second-cities",
    title: "Second cities, first choice: where members are buying now",
    standfirst: "Lisbon, Montreal and Bucharest are absorbing the demand the capitals priced out.",
    date: "10 July 2026",
    dateline: "Lisbon",
    editorsChoice: true,
  }),
  archiveArticle(inforumArticles[5]!, {
    id: "jul-long-lunch",
    title: "In defence of the long lunch",
    standfirst: "The three-hour table is back on the calendar, and members say it out-performs the offsite.",
    date: "8 July 2026",
    dateline: "Milan",
  }),
  archiveArticle(inforumArticles[2]!, {
    id: "jul-first-cheque",
    title: "The first cheque: how members choose their founding gift",
    standfirst: "Eleven philanthropists on the decision that set the shape of everything after it.",
    date: "5 July 2026",
    dateline: "New York",
    fromAroundTheWorld: true,
  }),
];

const juneEdition: InforumArticle[] = [
  archiveArticle(inforumArticles[7]!, {
    id: "jun-election-year",
    title: "The election year nobody is calling: nine chapters report",
    standfirst: "Our correspondents on the ballots that will move capital before the year is out.",
    date: "12 June 2026",
    dateline: "Global",
    editorsChoice: true,
  }),
  archiveArticle(inforumArticles[9]!, {
    id: "jun-family-desk",
    title: "The succession conversation family offices keep postponing",
    standfirst: "A member's principal opens the room on the handover he spent a decade avoiding.",
    date: "9 June 2026",
    dateline: "Mumbai",
  }),
  archiveArticle(inforumArticles[8]!, {
    id: "jun-editors-letter",
    title: "Editor's letter: the summer commissions",
    standfirst: "Jessica and Simon on what In:Forum pursued through the summer, and who wrote it.",
    date: "6 June 2026",
    dateline: "London",
  }),
];

export const inforumEditions: InforumEdition[] = [
  {
    id: "2026-09",
    label: "September 2026",
    publishedOn: "4 September 2026",
    coverLine: "The corridors of consent",
    cover: geopoliticsImg,
    articles: inforumArticles,
  },
  {
    id: "2026-08",
    label: "August 2026",
    publishedOn: "7 August 2026",
    coverLine: "The summer of unofficial diplomacy",
    cover: travelImg,
    articles: augustEdition,
  },
  {
    id: "2026-07",
    label: "July 2026",
    publishedOn: "10 July 2026",
    coverLine: "Second cities, first choice",
    cover: realEstateImg,
    articles: julyEdition,
  },
  {
    id: "2026-06",
    label: "June 2026",
    publishedOn: "12 June 2026",
    coverLine: "The election year nobody is calling",
    cover: worldImg,
    articles: juneEdition,
  },
];
