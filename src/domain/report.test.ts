import { describe, expect, it } from 'vitest';
import { buildReport } from './report';
import type { RawOrderRow } from '../types';

const rows: RawOrderRow[] = [
  {
    orderId: 'SO-1',
    orderDate: '2026-06-01',
    customerName: '张三',
    productName: '防晒喷雾',
    channel: '抖音',
    salesAmount: 199,
    refundAmount: 0,
    cost: 80,
    owner: '李四'
  },
  {
    orderId: 'SO-2',
    orderDate: '2026/06/02',
    customerName: '李雷',
    productName: '修护面膜',
    channel: '小红书',
    salesAmount: '299',
    refundAmount: '20',
    cost: '120',
    owner: '王五'
  },
  {
    orderId: 'SO-2',
    orderDate: 'bad-date',
    customerName: '',
    productName: '',
    channel: '抖音',
    salesAmount: 0,
    refundAmount: 10,
    cost: 20,
    owner: '李四'
  }
];

describe('buildReport', () => {
  it('cleans rows and calculates sales summary', () => {
    const report = buildReport(rows);

    expect(report.summary.totalOrders).toBe(3);
    expect(report.summary.validOrders).toBe(2);
    expect(report.summary.totalSales).toBe(498);
    expect(report.summary.totalRefunds).toBe(30);
    expect(report.summary.netSales).toBe(468);
    expect(report.summary.totalCost).toBe(220);
    expect(report.summary.grossProfit).toBe(248);
    expect(report.summary.averageOrderValue).toBe(249);
  });

  it('ranks products and channels by net sales', () => {
    const report = buildReport(rows);

    expect(report.productRanking[0]).toMatchObject({
      name: '修护面膜',
      netSales: 279,
      orderCount: 1
    });
    expect(report.channelRanking[0]).toMatchObject({
      name: '小红书',
      netSales: 279,
      orderCount: 1
    });
  });

  it('detects common spreadsheet anomalies', () => {
    const report = buildReport(rows);

    expect(report.anomalies.map((item) => item.type)).toEqual(
      expect.arrayContaining([
        '重复订单号',
        '日期格式异常',
        '缺少商品名称',
        '销售金额为空或为0',
        '退款金额大于销售金额'
      ])
    );
  });

  it('generates a boss-readable weekly narrative', () => {
    const report = buildReport(rows);

    expect(report.weeklyNarrative).toContain('本周共统计 3 笔订单');
    expect(report.weeklyNarrative).toContain('防晒喷雾');
    expect(report.weeklyNarrative).toContain('异常订单');
  });
});
