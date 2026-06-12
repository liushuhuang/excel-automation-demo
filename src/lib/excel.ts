import * as XLSX from 'xlsx';
import type { CleanOrderRow, RankingItem, RawOrderRow, ReportAnomaly, ReportResult } from '../types';
import { sampleOrderRows } from './sampleData';

type HeaderKey = keyof RawOrderRow;

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
});

const percentFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

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

  XLSX.utils.book_append_sheet(workbook, createAnalysisOverviewSheet(report), '分析总览');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([['老板周报'], [report.weeklyNarrative]]),
    '老板周报'
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
    XLSX.utils.json_to_sheet(report.anomalies.map(toAnomalySheetRow)),
    '异常订单'
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
    XLSX.utils.json_to_sheet(report.cleanedRows.map(toCleanedSheetRow)),
    '清洗后明细'
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

function createAnalysisOverviewSheet(report: ReportResult): XLSX.WorkSheet {
  const topProducts = report.productRanking.slice(0, 5);
  const topChannels = report.channelRanking.slice(0, 5);
  const anomalySummary = toAnomalySummaryRows(report.anomalies);
  const rows: Array<Array<string | number>> = [
    ['Excel 自动报表分析总览'],
    ['生成时间', new Date().toLocaleString('zh-CN')],
    [],
    ['老板周报'],
    [report.weeklyNarrative],
    [],
    ['关键指标', '数值', '说明'],
    ['总订单数', report.summary.totalOrders, '导入后参与统计的订单行数'],
    ['有效订单数', report.summary.validOrders, '排除明显业务异常后的订单数'],
    ['净销售额', formatCurrency(report.summary.netSales), '销售金额 - 退款金额'],
    ['估算毛利', formatCurrency(report.summary.grossProfit), '销售金额 - 退款金额 - 成本'],
    ['客单价', formatCurrency(report.summary.averageOrderValue), '总销售额 / 有效订单数'],
    ['退款率', formatPercent(report.summary.refundRate), '退款金额 / 销售金额'],
    [],
    ['Top 商品', '净销售额', '订单数', '销售占比'],
    ...topProducts.map((item) => [item.name, formatCurrency(item.netSales), item.orderCount, formatPercent(item.share)]),
    [],
    ['Top 渠道', '净销售额', '订单数', '销售占比'],
    ...topChannels.map((item) => [item.name, formatCurrency(item.netSales), item.orderCount, formatPercent(item.share)]),
    [],
    ['异常订单摘要', '数量', '建议'],
    ...anomalySummary
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 16 }];
  return sheet;
}

function toAnomalySummaryRows(anomalies: ReportAnomaly[]): Array<[string, number, string]> {
  if (anomalies.length === 0) {
    return [['暂无异常', 0, '可以直接进入复盘和结算']];
  }

  const counts = new Map<string, number>();
  anomalies.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => [type, count, toAnomalySuggestion(type)]);
}

function toAnomalySuggestion(type: string): string {
  const suggestions: Record<string, string> = {
    重复订单号: '核对是否重复导出或重复录入',
    日期格式异常: '统一日期格式后重新生成报表',
    缺少商品名称: '补齐商品名称，否则商品排行会失真',
    缺少销售渠道: '补齐渠道，否则渠道分析会失真',
    销售金额为空或为0: '核对是否为测试单、赠品或录入错误',
    退款金额大于销售金额: '核对退款记录和订单金额是否匹配',
    缺少订单号: '补齐订单号，便于对账和去重'
  };

  return suggestions[type] ?? '核对原始订单数据';
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

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatPercent(value: number): string {
  return percentFormatter.format(value);
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
