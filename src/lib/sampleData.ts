import type { RawOrderRow } from '../types';

const products = [
  { name: '防晒喷雾', basePrice: 199, cost: 80 },
  { name: '修护面膜', basePrice: 299, cost: 120 },
  { name: '轻盈隔离霜', basePrice: 169, cost: 62 },
  { name: '氨基酸洁面乳', basePrice: 129, cost: 45 },
  { name: '夜间精华液', basePrice: 399, cost: 180 },
  { name: '补水爽肤水', basePrice: 159, cost: 58 },
  { name: '舒缓乳液', basePrice: 189, cost: 73 },
  { name: '身体磨砂膏', basePrice: 149, cost: 51 },
  { name: '控油散粉', basePrice: 139, cost: 48 },
  { name: '唇部护理套装', basePrice: 99, cost: 32 },
  { name: '眼部修护霜', basePrice: 259, cost: 105 },
  { name: '旅行护肤套装', basePrice: 329, cost: 136 }
];

const channels = ['抖音', '小红书', '淘宝', '拼多多', '视频号'];
const owners = ['李四', '王五', '赵六', '孙七'];
const customers = ['张三', '李雷', '韩梅梅', '周敏', '陈晨', '刘洋', '吴迪', '钱宁', '郑好', '冯雪'];

export const sampleOrderRows: RawOrderRow[] = Array.from({ length: 72 }, (_, index) => {
  const product = products[index % products.length];
  const quantityBoost = index % 9 === 0 ? 2 : 1;
  const salesAmount = product.basePrice * quantityBoost + (index % 5) * 8;
  const refundAmount = index % 14 === 0 ? Math.round(salesAmount * 0.35) : 0;
  const dateDay = String((index % 28) + 1).padStart(2, '0');

  return {
    orderId: `SO202606${String(index + 1).padStart(4, '0')}`,
    orderDate: `2026-06-${dateDay}`,
    customerName: customers[index % customers.length],
    productName: product.name,
    channel: channels[index % channels.length],
    salesAmount,
    refundAmount,
    cost: product.cost * quantityBoost,
    owner: owners[index % owners.length]
  };
}).map((row, index) => {
  if (index === 8) {
    return { ...row, productName: '' };
  }

  if (index === 13) {
    return { ...row, refundAmount: Number(row.salesAmount) + 30 };
  }

  if (index === 19) {
    return { ...row, orderDate: '2026/错误日期' };
  }

  if (index === 24) {
    return { ...row, salesAmount: 0 };
  }

  if (index === 31) {
    return { ...row, orderId: 'SO2026060005' };
  }

  if (index === 38) {
    return { ...row, channel: '' };
  }

  if (index === 47) {
    return { ...row, orderId: '' };
  }

  if (index === 59) {
    return { ...row, refundAmount: Number(row.salesAmount) + 12 };
  }

  return row;
});
