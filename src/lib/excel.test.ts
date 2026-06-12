import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { buildReport } from '../domain/report';
import { sampleOrderRows } from './sampleData';
import { createReportWorkbook, workbookToRows } from './excel';

describe('Excel helpers', () => {
  it('maps a workbook with Chinese headers to raw order rows', () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ['订单号', '下单日期', '客户名称', '商品名称', '销售渠道', '销售金额', '退款金额', '成本', '负责人'],
      ['SO-1001', '2026-06-01', '张三', '防晒喷雾', '抖音', 199, 0, 80, '李四']
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, '订单明细');

    expect(workbookToRows(workbook)).toEqual([
      {
        orderId: 'SO-1001',
        orderDate: '2026-06-01',
        customerName: '张三',
        productName: '防晒喷雾',
        channel: '抖音',
        salesAmount: 199,
        refundAmount: 0,
        cost: 80,
        owner: '李四'
      }
    ]);
  });

  it('creates a report workbook with demo-ready sheets', () => {
    const report = buildReport([
      {
        orderId: 'SO-1001',
        orderDate: '2026-06-01',
        customerName: '张三',
        productName: '防晒喷雾',
        channel: '抖音',
        salesAmount: 199,
        refundAmount: 0,
        cost: 80,
        owner: '李四'
      }
    ]);

    const workbook = createReportWorkbook(report);
    expect(workbook.SheetNames).toEqual(
      expect.arrayContaining(['清洗后明细', '销售汇总', '商品排行', '渠道分析', '异常订单', '老板周报'])
    );

    const summaryRows = XLSX.utils.sheet_to_json<Record<string, string | number>>(workbook.Sheets['销售汇总']);
    expect(summaryRows[0]).toMatchObject({ 指标: '总订单数', 数值: 1 });

    const narrativeRows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets['老板周报'], { header: 1 });
    expect(JSON.stringify(narrativeRows)).toContain(report.weeklyNarrative);
  });

  it('places a business analysis overview before cleaned raw rows', () => {
    const report = buildReport(sampleOrderRows);

    const workbook = createReportWorkbook(report);
    expect(workbook.SheetNames[0]).toBe('分析总览');
    expect(workbook.SheetNames.indexOf('清洗后明细')).toBeGreaterThan(workbook.SheetNames.indexOf('异常订单'));

    const overviewRows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets['分析总览'], { header: 1, blankrows: false });
    const overviewText = JSON.stringify(overviewRows);

    expect(overviewText).toContain('老板周报');
    expect(overviewText).toContain('关键指标');
    expect(overviewText).toContain('Top 商品');
    expect(overviewText).toContain(report.productRanking[0].name);
    expect(overviewText).toContain('异常订单摘要');
  });

  it('provides sample rows with enough volume and anomalies for a sales demo', () => {
    const report = buildReport(sampleOrderRows);

    expect(sampleOrderRows.length).toBeGreaterThanOrEqual(60);
    expect(report.productRanking.length).toBeGreaterThanOrEqual(8);
    expect(report.channelRanking.length).toBeGreaterThanOrEqual(4);
    expect(report.anomalies.length).toBeGreaterThanOrEqual(8);
  });
});
