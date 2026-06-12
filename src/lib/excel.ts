import * as XLSX from 'xlsx';
import type { CleanOrderRow, RankingItem, RawOrderRow, ReportAnomaly, ReportResult } from '../types';
import { sampleOrderRows } from './sampleData';

type HeaderKey = keyof RawOrderRow;

const headerAliases: Record<string, HeaderKey> = {
  订单号: 'orderId',
  orderId: 'orderId',
  OrderID: 'orderId',
  下单日期: 'orderDate',
  订单日期: 'orderDate',
  日期: 'orderDate',
  orderDate: 'orderDate',
  客户名称: 'customerName',
  客户: 'customerName',
  customerName: 'customerName',
  商品名称: 'productName',
  商品: 'productName',
  productName: 'productName',
  销售渠道: 'channel',
  渠道: 'channel',
  channel: 'channel',
  销售金额: 'salesAmount',
  金额: 'salesAmount',
  salesAmount: 'salesAmount',
  退款金额: 'refundAmount',
  退款: 'refundAmount',
  refundAmount: 'refundAmount',
  成本: 'cost',
  cost: 'cost',
  负责人: 'owner',
  销售员: 'owner',
  owner: 'owner'
};

export async function parseWorkbook(file: File): Promise<RawOrderRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  return workbookToRows(workbook);
}

export function workbookToRows(workbook: XLSX.WorkBook): RawOrderRow[] {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return rows.map(mapWorksheetRow);
}

export function createSampleWorkbook(): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(sampleOrderRows.map(toChineseOrderRow));
  XLSX.utils.book_append_sheet(workbook, sheet, '订单明细');
  return workbook;
}

export function downloadSampleWorkbook(): void {
  XLSX.writeFile(createSampleWorkbook(), 'Excel自动报表助手-样例订单.xlsx');
}

export function createReportWorkbook(report: ReportResult): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.cleanedRows.map(toCleanedSheetRow)),
    '清洗后明细'
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(toSummaryRows(report)), '销售汇总');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.productRanking.map(toRankingSheetRow)),
    '商品排行'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.channelRanking.map(toRankingSheetRow)),
    '渠道分析'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.customerRanking.map(toRankingSheetRow)),
    '客户排行'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.ownerRanking.map(toRankingSheetRow)),
    '负责人排行'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(report.anomalies.map(toAnomalySheetRow)),
    '异常订单'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['老板周报'], [report.weeklyNarrative]]),
    '老板周报'
  );

  return workbook;
}

export function downloadReportWorkbook(report: ReportResult): void {
  XLSX.writeFile(createReportWorkbook(report), `Excel自动报表助手-分析结果-${Date.now()}.xlsx`);
}

function mapWorksheetRow(row: Record<string, unknown>): RawOrderRow {
  return Object.entries(row).reduce<RawOrderRow>((result, [header, value]) => {
    const key = headerAliases[header.trim()];
    if (key) {
      result[key] = value as RawOrderRow[typeof key];
    }
    return result;
  }, {});
}

function toChineseOrderRow(row: RawOrderRow) {
  return {
    订单号: row.orderId,
    下单日期: row.orderDate,
    客户名称: row.customerName,
    商品名称: row.productName,
    销售渠道: row.channel,
    销售金额: row.salesAmount,
    退款金额: row.refundAmount,
    成本: row.cost,
    负责人: row.owner
  };
}

function toCleanedSheetRow(row: CleanOrderRow) {
  return {
    行号: row.rowNumber,
    订单号: row.orderId,
    下单日期: row.orderDate,
    客户名称: row.customerName,
    商品名称: row.productName,
    销售渠道: row.channel,
    销售金额: row.salesAmount,
    退款金额: row.refundAmount,
    成本: row.cost,
    净销售额: row.netSales,
    估算毛利: row.grossProfit,
    负责人: row.owner
  };
}

function toSummaryRows(report: ReportResult) {
  return [
    { 指标: '总订单数', 数值: report.summary.totalOrders },
    { 指标: '有效订单数', 数值: report.summary.validOrders },
    { 指标: '总销售额', 数值: report.summary.totalSales },
    { 指标: '总退款金额', 数值: report.summary.totalRefunds },
    { 指标: '净销售额', 数值: report.summary.netSales },
    { 指标: '总成本', 数值: report.summary.totalCost },
    { 指标: '估算毛利', 数值: report.summary.grossProfit },
    { 指标: '客单价', 数值: report.summary.averageOrderValue },
    { 指标: '退款率', 数值: report.summary.refundRate }
  ];
}

function toRankingSheetRow(row: RankingItem) {
  return {
    名称: row.name,
    销售额: row.salesAmount,
    订单数: row.orderCount,
    退款金额: row.refundAmount,
    净销售额: row.netSales,
    成本: row.cost,
    估算毛利: row.grossProfit,
    客单价: row.averageOrderValue,
    占比: row.share
  };
}

function toAnomalySheetRow(row: ReportAnomaly) {
  return {
    行号: row.rowNumber,
    订单号: row.orderId,
    异常类型: row.type,
    异常说明: row.description,
    建议处理方式: row.suggestion
  };
}
