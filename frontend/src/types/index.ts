// --- Market / price types ---

export interface PriceData {
  timeStamp: string;
  price: number;
}

export interface HistoricalQueue {
  data: PriceData[];
  maxLength: number;
}

export interface BinanceWebSocket {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subscribe: (symbol: string, callback: (data: any) => void) => () => void;
}

export type Kline = [
  number, // Open time
  string, // Open price
  string, // High price
  string, // Low price
  string, // Close price
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  number, // Ignore
  number, // Close time in ms
  string, // Close price in ms
  string,  // Volume in ms
];

export type PortfolioCache = Map<string, PriceData[]>;

// --- Portfolio / crypto label types ---

export interface CryptoLabel {
  symbol: string;
  name: string;
  currency: string;
  value: number;
  change: number;
  icon: string;
}

export interface PieChartData {
  symbol: string;
  value: number;
}

export interface PortfolioHistory {
  date: string;
  totalValue: number;
  cryptoValues: { [key: string]: number };
}

// --- Time range types ---

export type TimeRange = '1H' | '1D' | '7D' | '14D' | '1M' | '1Y' | 'ALL';

export type TimeRangeConfig = {
  interval: string;
  limit: number;
  duration: number;
  xAxisFormat: string;
  tickInterval: number;
  tickFormatter: (date: string) => string;
};

export type TimeRangeContextType = {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  historicalData: PriceData[];
  realTimePrice: number | null;
  selectedCrypto: string;
  setSelectedCrypto: (crypto: string) => void;
  isLoading: boolean;
  error: string | null;
  currentConfig: TimeRangeConfig;
  quoteAsset: string;
  setQuoteAsset: (quoteAsset: string) => void;
  yAxisDomain: number[];
};

// --- Sidebar context types ---

export type SidebaCollapsedContextType = {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (newIsSidebarCollapsed: boolean) => void;
  panelWidth: number;
  setPanelWidth: (newPanelWidth: number) => void;
  key: number;
  setKey: (newKey: number) => void;
  handleToggleCollapse: () => void;
};

// --- Transaction types ---

export interface TransactionEntry {
  type: string;
  crypto: string;
  amount: string;
  recipient: string;
  status: string;
  transactionId?: string;
  date?: string;
  time?: string;
  fee?: string;
}

export interface TransactionGroup {
  date: string;
  entries: TransactionEntry[];
}

export interface TransactionDetailsProps {
  type: string;
  crypto: string;
  amount: string;
  recipient: string;
  transactionId: string;
  date: string;
  time: string;
  fee: string;
  status: string;
  onClose?: () => void;
}

export interface TransactionCardProps {
  type: string;
  crypto: string;
  amount: string;
  recipient: string;
  status: string;
  onClick?: () => void;
}

export type TransactionType = 'Send' | 'Request' | 'Swap' | 'Withdraw' | 'Deposit';
