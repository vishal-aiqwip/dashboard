export type MetricHint = 'higher-is-better' | 'lower-is-better' | 'neutral' | 'ratio';

export type MetricValue = {
  value: number;
  deltaPct?: number;
  hint: MetricHint;
  note?: string;
};

export type SecondaryMetric = {
  value: number;
  previous: number;
};

export type EditClass = 'accepted' | 'light' | 'medium' | 'heavy' | 'rewritten';

export type CategoryKey = 'faq_general_info' | 'room_bookings' | 'transportation';

export type CategoryRow = {
  key: CategoryKey;
  label: string;
  emails: number;
  avgEditDistance: number;
  median: number;
  acceptance: number;
};

export type CategoryDailyPoint = {
  date: string;
  faq_general_info: number;
  room_bookings: number;
  transportation: number;
};

export type HeatmapCell = { week: string; value: number };
export type HeatmapRow = { label: string; cells: HeatmapCell[] };

export type HotelStatus = 'active' | 'inactive' | 'never-used';

export type HotelPerfRow = {
  id: string;
  hotel: string;
  mailbox: string;
  draftsCreated: number;
  draftsSent: number;
  sendRate: number | null;
  sent7d: number;
  lastSent: string | null;
  acceptanceRate: number;
  autoDrafts: boolean;
  status: HotelStatus;
  needsAttention?: boolean;
};

export type HotelStats = {
  total: number;
  active7d: number;
  inactive7d: number;
  needsAttention: number;
  autoDraftsOn: number;
};

export type EmailRow = {
  id: string;
  sentAt: string;
  mailbox: string;
  category: string;
  trip: 'Leisure' | 'Business' | 'Group';
  editClass: EditClass;
  editDist: number;
  jaccard: number;
  semantic: number;
  verdict: string | null;
  failure: string | null;
  subject: string;
  guestFrom: string;
  guestEmail: string;
  aiDraft: string;
  finalSent: string;
  toolCalls?: {
    tool: string;
    status: 'success' | 'error';
    provider?: string;
    args: Record<string, unknown>;
    output: string;
  }[];
};

export type EmailPerformanceData = {
  kpis: {
    draftsCreated: MetricValue;
    draftsSent: MetricValue;
    sendRate: MetricValue;
    acceptanceRate: MetricValue;
    avgEditDistance: MetricValue;
    avgSemanticSimilarity: MetricValue;
    uniqueGuestSenders: MetricValue;
    avgDraftTokens: SecondaryMetric;
    avgFinalTokens: SecondaryMetric;
    draftFinalRatio: SecondaryMetric;
  };
  editDistanceOverTime: { date: string; avg: number; median: number }[];
  acceptanceRateOverTime: { date: string; rate: number; sent: number }[];
  editClassOverTime: {
    date: string;
    accepted: number;
    light: number;
    medium: number;
    heavy: number;
    rewritten: number;
  }[];
  overallSplit: { class: EditClass; count: number }[];
  editDistanceHistogram: { bucket: string; count: number }[];
  categorySummary: CategoryRow[];
  editDistanceByCategory: CategoryDailyPoint[];
  editDistanceHeatmap: { weeks: string[]; rows: HeatmapRow[] };
  emails: EmailRow[];
  hotels: HotelPerfRow[];
  hotelStats: HotelStats;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function buildDaily<T extends Record<string, number>>(
  days: number,
  fn: (i: number) => T
): ({ date: string } & T)[] {
  return Array.from({ length: days }, (_, i) => ({
    date: daysAgo(days - 1 - i),
    ...fn(i),
  }));
}

export const emailPerformanceMock: EmailPerformanceData = {
  kpis: {
    draftsCreated: {
      value: 14,
      deltaPct: 0,
      hint: 'neutral',
      note: 'all AI drafts generated',
    },
    draftsSent: { value: 65, deltaPct: -99.0, hint: 'higher-is-better', note: 'vs. last period' },
    sendRate: { value: 464.3, deltaPct: 0, hint: 'ratio', note: 'sent ÷ created' },
    acceptanceRate: { value: 52.3, deltaPct: 968.4, hint: 'higher-is-better', note: 'vs. last period' },
    avgEditDistance: { value: 0.147, deltaPct: -82.5, hint: 'lower-is-better', note: 'lower is better' },
    avgSemanticSimilarity: {
      value: 0.99,
      deltaPct: 9.5,
      hint: 'higher-is-better',
      note: 'higher is better',
    },
    uniqueGuestSenders: {
      value: 3,
      deltaPct: 50.0,
      hint: 'higher-is-better',
      note: 'vs. last period',
    },
    avgDraftTokens: { value: 85, previous: 84 },
    avgFinalTokens: { value: 77, previous: 45 },
    draftFinalRatio: { value: 0.9, previous: 0.54 },
  },
  editDistanceOverTime: buildDaily(30, (i) => {
    const wave = Math.sin(i / 2.3) * 0.18 + Math.sin(i / 1.4) * 0.08;
    const trend = 0.32 + i * 0.004;
    const noise = ((i * 37) % 11) / 100 - 0.05;
    const avg = Math.max(0.05, Math.min(0.85, trend + wave + noise));
    const median = Math.max(0.03, Math.min(0.8, avg - 0.04 - Math.cos(i / 2) * 0.05));
    return { avg: Number(avg.toFixed(3)), median: Number(median.toFixed(3)) };
  }),
  acceptanceRateOverTime: buildDaily(30, (i) => {
    const wave = Math.sin(i / 2.1) * 22 + Math.sin(i / 1.3) * 12;
    const trend = 48 + i * 0.6;
    const noise = ((i * 53) % 17) - 8;
    const rate = Math.max(8, Math.min(96, trend + wave + noise));
    const sentWave = Math.sin(i / 2.7) * 6 + Math.cos(i / 1.8) * 4;
    const sent = Math.max(2, Math.round(12 + sentWave + ((i * 19) % 7) - 3));
    return { rate: Number(rate.toFixed(1)), sent };
  }),
  editClassOverTime: buildDaily(30, (i) => {
    const total = 18 + Math.round(Math.sin(i / 2) * 6 + ((i * 17) % 5));
    const accepted = Math.max(0, Math.round(total * (0.45 + Math.sin(i / 3) * 0.1)));
    const light = Math.max(0, Math.round(total * (0.25 + Math.cos(i / 2.5) * 0.06)));
    const medium = Math.max(0, Math.round(total * 0.12));
    const heavy = Math.max(0, Math.round(total * 0.08));
    const rewritten = Math.max(0, total - accepted - light - medium - heavy);
    return { accepted, light, medium, heavy, rewritten };
  }),
  overallSplit: [
    { class: 'accepted', count: 32 },
    { class: 'light', count: 25 },
    { class: 'medium', count: 3 },
    { class: 'heavy', count: 2 },
    { class: 'rewritten', count: 3 },
  ],
  editDistanceHistogram: [
    { bucket: '0.0–0.1', count: 42 },
    { bucket: '0.1–0.2', count: 18 },
    { bucket: '0.2–0.3', count: 9 },
    { bucket: '0.3–0.4', count: 4 },
    { bucket: '0.4–0.5', count: 2 },
    { bucket: '0.5–0.6', count: 1 },
    { bucket: '0.6–0.7', count: 1 },
    { bucket: '0.7–0.8', count: 0 },
    { bucket: '0.8–0.9', count: 0 },
    { bucket: '0.9–1.0', count: 0 },
  ],
  categorySummary: [
    {
      key: 'faq_general_info',
      label: 'Faq_general_info',
      emails: 62,
      avgEditDistance: 0.155,
      median: 0,
      acceptance: 50.0,
    },
    {
      key: 'room_bookings',
      label: 'Room_bookings',
      emails: 2,
      avgEditDistance: 0,
      median: 0,
      acceptance: 100.0,
    },
    {
      key: 'transportation',
      label: 'Transportation',
      emails: 1,
      avgEditDistance: 0,
      median: 0,
      acceptance: 100.0,
    },
  ],
  editDistanceByCategory: buildDaily(30, (i) => {
    const wave = Math.sin(i / 2.5) * 0.12;
    const trend = Math.max(0, 0.28 - i * 0.008);
    return {
      faq_general_info: Number(Math.max(0, Math.min(1, trend + wave + 0.05)).toFixed(3)),
      room_bookings: Number(
        Math.max(0, Math.min(1, 0.08 + Math.sin(i / 1.5) * 0.05)).toFixed(3)
      ),
      transportation: Number(
        Math.max(0, Math.min(1, 0.03 + Math.cos(i / 2) * 0.03)).toFixed(3)
      ),
    };
  }),
  editDistanceHeatmap: {
    weeks: ['W13', 'W14', 'W15', 'W16', 'W17'],
    rows: [
      {
        label: 'Faq_general_info',
        cells: [
          { week: 'W13', value: 0.85 },
          { week: 'W14', value: 0.42 },
          { week: 'W15', value: 0.18 },
          { week: 'W16', value: 0.09 },
          { week: 'W17', value: 0.12 },
        ],
      },
      {
        label: 'Room_bookings',
        cells: [
          { week: 'W13', value: 0.05 },
          { week: 'W14', value: 0.02 },
          { week: 'W15', value: 0 },
          { week: 'W16', value: 0.08 },
          { week: 'W17', value: 0.04 },
        ],
      },
      {
        label: 'Transportation',
        cells: [
          { week: 'W13', value: 0 },
          { week: 'W14', value: 0.03 },
          { week: 'W15', value: 0.01 },
          { week: 'W16', value: 0 },
          { week: 'W17', value: 0.02 },
        ],
      },
    ],
  },
  emails: buildEmailRows(),
  hotels: buildHotelRows(),
  hotelStats: {
    total: 24,
    active7d: 1,
    inactive7d: 1,
    needsAttention: 2,
    autoDraftsOn: 3,
  },
};

function buildHotelRows(): HotelPerfRow[] {
  const baseMailbox = 'info@altekai.onmicrosoft.com';
  const rows: HotelPerfRow[] = [
    {
      id: 'jacyz',
      hotel: 'jacyz hotel',
      mailbox: 'admin@altektest.onmicrosoft.com',
      draftsCreated: 8,
      draftsSent: 65,
      sendRate: 812.5,
      sent7d: 3,
      lastSent: '2026-04-20T19:12:00Z',
      acceptanceRate: 52.3,
      autoDrafts: true,
      status: 'active',
    },
    {
      id: 'sunfield',
      hotel: 'Sunfield',
      mailbox: baseMailbox,
      draftsCreated: 6,
      draftsSent: 0,
      sendRate: 0,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'inactive',
      needsAttention: true,
    },
    {
      id: 'ahus',
      hotel: 'Åhus seaside',
      mailbox: baseMailbox,
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'elsefarm',
      hotel: 'Elsefarm (prod)',
      mailbox: 'info@altek.ai',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'tesla-long',
      hotel: 'testaaaaaaaaaaaaaaaaaa',
      mailbox: 'tester.greeter.no',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'abc',
      hotel: 'abc',
      mailbox: baseMailbox,
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'test-mix-1',
      hotel: 'testhotelproduct',
      mailbox: 'moremailboxes@mail.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'test-mix-2',
      hotel: 'testhotelproduct',
      mailbox: 'mailbox123@gmail.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'test-mix-3',
      hotel: 'testhotelproduct',
      mailbox: 'test123gddddd.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testolavshotel-1',
      hotel: 'testolavshotel',
      mailbox: 'test@gmail.com.md',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'joffeloff',
      hotel: 'joffeloffe',
      mailbox: 'joffen@altekai.onmicrosoft.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testolav-long',
      hotel: 'testolavshotelusemailbokseriteapens',
      mailbox: 'hotelemailip@ai.no',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: '1off',
      hotel: '1off',
      mailbox: 'joffen@altekai.onmicrosoft.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testolavshotel-2',
      hotel: 'testolavshotel',
      mailbox: 'agi2.z',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'test-mix-4',
      hotel: 'testhotelproduct',
      mailbox: 'sdfsdfjadsdfsd.ffd',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testxhotelmailboksetaster',
      hotel: 'testxhotelmailboksetaster',
      mailbox: 'mailboks2gdfad.df',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: true,
      status: 'never-used',
      needsAttention: true,
    },
    {
      id: 'mws-demo-1',
      hotel: 'mws demo',
      mailbox: 'demohotel@altekai.onmicrosoft.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testolavshotel-3',
      hotel: 'testolavshotel',
      mailbox: 'tpl.t',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'testolavshotel-4',
      hotel: 'testolavshotel',
      mailbox: 'sss@mail.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'mws-demo-2',
      hotel: 'mws demo',
      mailbox: 'info@altekai.onmicrosoft.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: true,
      status: 'never-used',
      needsAttention: true,
    },
    {
      id: 'testolavshotel-5',
      hotel: 'testolavshotel',
      mailbox: 'test@gmail.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'ahus-2',
      hotel: 'Åhus seaside',
      mailbox: 'joffen@altekai.onmicrosoft.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'test-mix-5',
      hotel: 'testhotelproduct',
      mailbox: 'udxfgdf.dsf',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
    {
      id: 'dev-test1',
      hotel: 'Dev-Test1',
      mailbox: 'alys.sigx@goutlook.com',
      draftsCreated: 0,
      draftsSent: 0,
      sendRate: null,
      sent7d: 0,
      lastSent: null,
      acceptanceRate: 0,
      autoDrafts: false,
      status: 'never-used',
    },
  ];
  return rows;
}

function buildEmailRows(): EmailRow[] {
  const mailbox = 'admin@altektest.onmicrosoft.com';
  const guestFrom = 'GUEST_2134e31e@altekai.onmicrosoft.com';
  const parkingDraft =
    'Yes, we have a parking garage directly connected to the hotel.\n\nAddress: [LOCATION]. Payment is via EasyPark or Parkster, area code 17931. Price is from 28 kr/[PERSON_NAME] or 350 kr/dygn.\n\nIf you are charging an EV, charging is paid via ChargeNode and Waybler (5 SEK per kWh).';
  const roomsBody =
    'Hi [PERSON_NAME], Yes, we do have rooms available for the requested dates. Would you like me to reserve one?';
  const availDraft =
    'Hi [PERSON_NAME], Yes, we have availability for your dates. Rooms come with breakfast included. Let me know if you want me to hold one for you.';
  const availFinal =
    'Hi [PERSON_NAME], Yes, we have availability for your dates. Rooms come with breakfast included and pets are welcome. Let me know if you want me to hold one for you.';
  const pineconeToolCall = {
    tool: 'search_knowledge_base',
    provider: 'pinecone',
    status: 'success' as const,
    args: {
      user_language: 'English',
      user_input: 'Do you allow parking?',
      translated_user_input: 'Tillåter ni parkering?',
    },
    output:
      '{\n  "result": [\n    {\n      "content": "### [Har ni parkering?](https://jacyzhotel.com/meetings/)\\n\\nVi har ett parkeringshus med direkt anslutning till Jacy\'z där du smidigt kan parkera din bil.\\n\\nBetalning sker genom Easypark.\\n\\n### [Kan vi abonnera en lokal en privat afterwork hos er?]"\n    }\n  ]\n}',
  };

  const base: Omit<EmailRow, 'id' | 'sentAt'>[] = [
    {
      mailbox,
      category: 'Transportation',
      trip: 'Leisure',
      editClass: 'accepted',
      editDist: 0,
      jaccard: 0,
      semantic: 1.0,
      verdict: null,
      failure: null,
      subject: 'Parking',
      guestFrom,
      guestEmail: 'Do you allow parking?\n\nBest regards,\n[PERSON_NAME]\nCo-founder, Altek AI',
      aiDraft: parkingDraft,
      finalSent: parkingDraft,
      toolCalls: [pineconeToolCall],
    },
    {
      mailbox,
      category: 'Room_bookings',
      trip: 'Leisure',
      editClass: 'accepted',
      editDist: 0,
      jaccard: 0,
      semantic: 1.0,
      verdict: null,
      failure: null,
      subject: 'Room Request May 15 - 17',
      guestFrom,
      guestEmail: 'Hi, Do you have any rooms available for 2 guests May 15 – 17?',
      aiDraft: roomsBody,
      finalSent: roomsBody,
    },
    {
      mailbox,
      category: 'Room_bookings',
      trip: 'Leisure',
      editClass: 'accepted',
      editDist: 0,
      jaccard: 0,
      semantic: 1.0,
      verdict: null,
      failure: null,
      subject: 'Room Request May 15 - 17',
      guestFrom,
      guestEmail: 'Hi, Do you have any rooms available for 2 guests May 15 – 17?',
      aiDraft: roomsBody,
      finalSent: roomsBody,
    },
    {
      mailbox,
      category: 'Faq_general_info',
      trip: 'Leisure',
      editClass: 'light',
      editDist: 0.309,
      jaccard: 0.179,
      semantic: 0.98,
      verdict: null,
      failure: null,
      subject: 'Room availability and Dogs',
      guestFrom,
      guestEmail: 'Hi, Do you have any rooms available for 2 guests, and do you allow dogs?',
      aiDraft: availDraft,
      finalSent: availFinal,
    },
    {
      mailbox,
      category: 'Faq_general_info',
      trip: 'Business',
      editClass: 'medium',
      editDist: 0.48,
      jaccard: 0.32,
      semantic: 0.91,
      verdict: 'needs_review',
      failure: null,
      subject: 'Invoice request',
      guestFrom,
      guestEmail: 'Could you send me a VAT invoice for my last stay?',
      aiDraft: 'Sure, I can send you a VAT invoice. What was your booking reference?',
      finalSent:
        'Hello — happy to help with the VAT invoice. Could you share your booking reference and billing address? We will email the invoice within 24 hours.',
    },
    {
      mailbox,
      category: 'Faq_general_info',
      trip: 'Leisure',
      editClass: 'heavy',
      editDist: 0.72,
      jaccard: 0.12,
      semantic: 0.74,
      verdict: 'needs_review',
      failure: 'hallucination',
      subject: 'Spa opening hours',
      guestFrom,
      guestEmail: 'Hi, what are your spa opening hours on weekends?',
      aiDraft: 'Our spa is open 06:00–23:00 every day, including weekends.',
      finalSent:
        'Thanks for writing in. The spa is open 09:00–21:00 on Saturdays and 10:00–20:00 on Sundays. Treatments must be booked at least 2 hours in advance.',
    },
    {
      mailbox,
      category: 'Room_bookings',
      trip: 'Group',
      editClass: 'rewritten',
      editDist: 0.91,
      jaccard: 0.04,
      semantic: 0.52,
      verdict: 'rejected',
      failure: 'policy',
      subject: 'Corporate rate 12 rooms',
      guestFrom,
      guestEmail: 'We need 12 rooms for a corporate event next month. Can you send a quote?',
      aiDraft: 'We do not offer corporate rates at the moment.',
      finalSent:
        'Thanks for reaching out. For group bookings of 10+ rooms we have a dedicated corporate desk — I have looped them in and they will send a tailored quote within one business day.',
    },
  ];

  const rows: EmailRow[] = [];
  for (let i = 0; i < 10; i++) {
    base.forEach((b, j) => {
      const d = new Date();
      d.setDate(d.getDate() - (i * 3 + j));
      d.setHours(10 + (j % 8), (i * 7) % 60, 0, 0);
      rows.push({ ...b, id: `email-${i}-${j}`, sentAt: d.toISOString() });
    });
  }
  return rows.slice(0, 65);
}
