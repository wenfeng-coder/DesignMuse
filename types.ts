
export interface DesignTerm {
  en: string;
  zh: string;
}

export interface DailyAnalysis {
  themeEn: string;
  themeZh: string;
  vibeDescription: string;
  gridStyle: 'masonry' | 'grid';
  backgroundColor: string;
}

export interface InspirationEntry {
  id: string;
  imageUrl: string;
  tags: string[];
  caption: string;
  timestamp: number;
  rotation: number;
  decorType: 'tape' | 'pin' | 'clip' | 'washi';
  suggestedSize: 'large' | 'medium' | 'small';
  orientation?: 'landscape' | 'portrait' | 'square';
}

export interface DayData {
  entries: InspirationEntry[];
  analysis?: DailyAnalysis;
}

export interface WeeklyData {
  [dayKey: string]: DayData;
}

export interface NotebookState {
  weekOffset: number;
  entries: { [weekId: string]: WeeklyData };
  notes: { [weekId: string]: string };
}
