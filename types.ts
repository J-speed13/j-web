export interface HistoryItem {
  url: string;
  timestamp: number;
}

export interface WebPageContent {
  title: string;
  html: string;
  sourceUrls?: { title: string; uri: string }[];
}

export interface Tab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  history: string[]; 
  historyIndex: number;
  content: WebPageContent | null;
  mode: 'ai' | 'live';
}

export interface BrowserState {
  tabs: Tab[];
  activeTabId: string;
}