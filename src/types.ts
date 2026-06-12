export type SpreadsheetValue = string | number | Date | null | undefined;

export interface RawOrderRow {
  orderId?: SpreadsheetValue;
  orderDate?: SpreadsheetValue;
  customerName?: SpreadsheetValue;
  productName?: SpreadsheetValue;
  channel?: SpreadsheetValue;
  salesAmount?: SpreadsheetValue;
  refundAmount?: SpreadsheetValue;
  cost?: SpreadsheetValue;
  owner?: SpreadsheetValue;
}

export interface CleanOrderRow {
  rowNumber: number;
  orderId: string;
  orderDate: string;
  customerName: string;
  productName: string;
  channel: string;
  salesAmount: number;
  refundAmount: number;
  cost: number;
  owner: string;
  netSales: number;
  grossProfit: number;
  isValidDate: boolean;
}

export interface ReportSummary {
  totalOrders: number;
  validOrders: number;
  totalSales: number;
  totalRefunds: number;
  netSales: number;
  totalCost: number;
  grossProfit: number;
  averageOrderValue: number;
  refundRate: number;
}

export interface RankingItem {
  name: string;
  salesAmount: number;
  refundAmount: number;
  netSales: number;
  cost: number;
  grossProfit: number;
  orderCount: number;
  averageOrderValue: number;
  share: number;
}

export interface ReportAnomaly {
  rowNumber: number;
  orderId: string;
  type: string;
  description: string;
  suggestion: string;
}

export interface ReportResult {
  cleanedRows: CleanOrderRow[];
  summary: ReportSummary;
  productRanking: RankingItem[];
  channelRanking: RankingItem[];
  customerRanking: RankingItem[];
  ownerRanking: RankingItem[];
  anomalies: ReportAnomaly[];
  weeklyNarrative: string;
}
