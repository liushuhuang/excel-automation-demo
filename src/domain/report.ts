import type {
  CleanOrderRow,
  RankingItem,
  RawOrderRow,
  ReportAnomaly,
  ReportResult,
  ReportSummary,
  SpreadsheetValue
} from '../types';

const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 2
});

export function buildReport(rows: RawOrderRow[]): ReportResult {
  const cleanedRows = rows.filter(hasAnyValue).map(normalizeRow);
  const anomalies = detectAnomalies(cleanedRows);
  const summary = buildSummary(cleanedRows);
  const validRows = cleanedRows.filter(isValidBusinessRow);
  const productRanking = buildRanking(validRows, (row) => row.productName);
  const channelRanking = buildRanking(validRows, (row) => row.channel);
  const customerRanking = buildRanking(
    validRows.filter((row) => row.customerName),
    (row) => row.customerName
  );
  const ownerRanking = buildRanking(
    validRows.filter((row) => row.owner),
    (row) => row.owner
  );
  const weeklyNarrative = buildWeeklyNarrative(summary, productRanking, channelRanking, anomalies);

  return {
    cleanedRows,
    summary,
    productRanking,
    channelRanking,
    customerRanking,
    ownerRanking,
    anomalies,
    weeklyNarrative
  };
}

function hasAnyValue(row: RawOrderRow): boolean {
  return Object.values(row).some((value) => toText(value) !== '');
}

function normalizeRow(row: RawOrderRow, index: number): CleanOrderRow {
  const salesAmount = toNumber(row.salesAmount);
  const refundAmount = toNumber(row.refundAmount);
  const cost = toNumber(row.cost);
  const parsedDate = toDateText(row.orderDate);

  return {
    rowNumber: index + 2,
    orderId: toText(row.orderId),
    orderDate: parsedDate.value,
    customerName: toText(row.customerName),
    productName: toText(row.productName),
    channel: toText(row.channel),
    salesAmount,
    refundAmount,
    cost,
    owner: toText(row.owner),
    netSales: roundMoney(salesAmount - refundAmount),
    grossProfit: roundMoney(salesAmount - refundAmount - cost),
    isValidDate: parsedDate.isValid
  };
}

function buildSummary(rows: CleanOrderRow[]): ReportSummary {
  const totalSales = sum(rows, (row) => row.salesAmount);
  const totalRefunds = sum(rows, (row) => row.refundAmount);
  const totalCost = sum(rows, (row) => row.cost);
  const validOrders = rows.filter(isValidBusinessRow).length;

  return {
    totalOrders: rows.length,
    validOrders,
    totalSales,
    totalRefunds,
    netSales: roundMoney(totalSales - totalRefunds),
    totalCost,
    grossProfit: roundMoney(totalSales - totalRefunds - totalCost),
    averageOrderValue: validOrders === 0 ? 0 : roundMoney(totalSales / validOrders),
    refundRate: totalSales === 0 ? 0 : roundRate(totalRefunds / totalSales)
  };
}

function detectAnomalies(rows: CleanOrderRow[]): ReportAnomaly[] {
  const anomalies: ReportAnomaly[] = [];
  const seenOrderIds = new Set<string>();

  rows.forEach((row) => {
    if (!row.orderId) {
      anomalies.push(createAnomaly(row, '缺少订单号', '该行没有订单号，无法用于对账。', '回到原始表补充订单号后重新生成报表。'));
    } else if (seenOrderIds.has(row.orderId)) {
      anomalies.push(createAnomaly(row, '重复订单号', `订单号 ${row.orderId} 已出现过。`, '核对是否重复导出或重复录入。'));
    } else {
      seenOrderIds.add(row.orderId);
    }

    if (!row.isValidDate) {
      anomalies.push(createAnomaly(row, '日期格式异常', '下单日期无法识别为有效日期。', '统一为 2026-06-12 这样的日期格式。'));
    }

    if (!row.productName) {
      anomalies.push(createAnomaly(row, '缺少商品名称', '商品名称为空，无法进入商品排行。', '补充商品名称或从订单系统重新导出。'));
    }

    if (!row.channel) {
      anomalies.push(createAnomaly(row, '缺少销售渠道', '销售渠道为空，无法进入渠道分析。', '补充渠道，例如抖音、淘宝、小红书。'));
    }

    if (row.salesAmount <= 0) {
      anomalies.push(createAnomaly(row, '销售金额为空或为0', '销售金额为空、不是数字或小于等于 0。', '核对订单金额，确认是否为赠品、测试单或录入错误。'));
    }

    if (row.refundAmount > row.salesAmount) {
      anomalies.push(createAnomaly(row, '退款金额大于销售金额', '退款金额超过销售金额，会影响净销售额。', '核对退款记录和订单金额是否匹配。'));
    }
  });

  return anomalies;
}

function createAnomaly(
  row: CleanOrderRow,
  type: string,
  description: string,
  suggestion: string
): ReportAnomaly {
  return {
    rowNumber: row.rowNumber,
    orderId: row.orderId || '未填写',
    type,
    description,
    suggestion
  };
}

function buildRanking(rows: CleanOrderRow[], getName: (row: CleanOrderRow) => string): RankingItem[] {
  const groups = new Map<string, RankingItem>();

  rows.forEach((row) => {
    const name = getName(row);
    if (!name) {
      return;
    }

    const current = groups.get(name) ?? {
      name,
      salesAmount: 0,
      refundAmount: 0,
      netSales: 0,
      cost: 0,
      grossProfit: 0,
      orderCount: 0,
      averageOrderValue: 0,
      share: 0
    };

    current.salesAmount = roundMoney(current.salesAmount + row.salesAmount);
    current.refundAmount = roundMoney(current.refundAmount + row.refundAmount);
    current.netSales = roundMoney(current.netSales + row.netSales);
    current.cost = roundMoney(current.cost + row.cost);
    current.grossProfit = roundMoney(current.grossProfit + row.grossProfit);
    current.orderCount += 1;
    groups.set(name, current);
  });

  const ranking = [...groups.values()].sort((a, b) => b.netSales - a.netSales);
  const totalNetSales = sum(ranking, (item) => item.netSales);

  return ranking.map((item) => ({
    ...item,
    averageOrderValue: item.orderCount === 0 ? 0 : roundMoney(item.salesAmount / item.orderCount),
    share: totalNetSales === 0 ? 0 : roundRate(item.netSales / totalNetSales)
  }));
}

function buildWeeklyNarrative(
  summary: ReportSummary,
  productRanking: RankingItem[],
  channelRanking: RankingItem[],
  anomalies: ReportAnomaly[]
): string {
  const topProducts = productRanking
    .slice(0, 3)
    .map((item) => item.name)
    .join('、');
  const topChannel = channelRanking[0]?.name ?? '暂无渠道';
  const anomalyText =
    anomalies.length > 0
      ? `本周发现 ${anomalies.length} 条异常订单，建议先核对${topAnomalyTypes(anomalies)}后再进行财务结算。`
      : '本周未发现明显异常订单，可以直接进入复盘和结算。';

  return `本周共统计 ${summary.totalOrders} 笔订单，有效订单 ${summary.validOrders} 笔，总销售额 ${formatMoney(
    summary.totalSales
  )} 元，退款金额 ${formatMoney(summary.totalRefunds)} 元，净销售额 ${formatMoney(
    summary.netSales
  )} 元，估算毛利 ${formatMoney(summary.grossProfit)} 元。销售表现靠前的商品是${topProducts || '暂无商品'}，${topChannel}渠道当前贡献最高。${anomalyText}`;
}

function topAnomalyTypes(anomalies: ReportAnomaly[]): string {
  const counts = new Map<string, number>();
  anomalies.forEach((item) => counts.set(item.type, (counts.get(item.type) ?? 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => type)
    .join('和');
}

function isValidBusinessRow(row: CleanOrderRow): boolean {
  return row.salesAmount > 0 && row.productName !== '' && row.channel !== '' && row.isValidDate;
}

function toText(value: SpreadsheetValue): string {
  if (value instanceof Date) {
    return toDateText(value).value;
  }

  return value === null || value === undefined ? '' : String(value).trim();
}

function toNumber(value: SpreadsheetValue): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? roundMoney(value) : 0;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/[,\s￥¥元]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
  }

  return 0;
}

function toDateText(value: SpreadsheetValue): { value: string; isValid: boolean } {
  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return formatDate(new Date(excelEpoch + value * 24 * 60 * 60 * 1000));
  }

  const text = toText(value);
  if (!text) {
    return { value: '', isValid: false };
  }

  const normalized = text.replace(/\//g, '-');
  const date = new Date(normalized);
  return formatDate(date);
}

function formatDate(date: Date): { value: string; isValid: boolean } {
  if (Number.isNaN(date.getTime())) {
    return { value: '', isValid: false };
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { value: `${year}-${month}-${day}`, isValid: true };
}

function sum<T>(items: T[], getValue: (item: T) => number): number {
  return roundMoney(items.reduce((total, item) => total + getValue(item), 0));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundRate(value: number): number {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}

function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}
