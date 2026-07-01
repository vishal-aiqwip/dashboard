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

export type CategoryKey = string; // dynamic — real categories come from BigQuery

export type CategoryRow = {
  key: string;
  label: string;
  emails: number;
  avgEditDistance: number;
  median: number;
  acceptance: number;
};

// Dynamic columnar format: {date, [category]: avg_edit_distance, ...}
// Produced by pivoting the flat BQ rows in the transform
export type CategoryDailyPoint = {
  date: string;
  [key: string]: number | string; // date is string; all category columns are numbers
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
