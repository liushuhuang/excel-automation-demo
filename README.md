# Excel 自动报表助手 Demo

一个用于展示 Excel 自动化变现能力的前端 demo。用户上传订单或销售明细 `.xlsx` 文件后，系统会自动完成数据清洗、销售汇总、商品排行、渠道分析、异常订单识别，并生成可直接发给老板的经营周报。

## 核心功能

- 上传标准订单 Excel 文件并解析数据
- 自动清洗空行、日期、金额、退款和成本字段
- 生成销售汇总、商品排行、渠道分析、客户排行和负责人排行
- 识别重复订单号、日期异常、缺少商品、缺少渠道、金额异常等问题
- 默认内置样例数据，方便直接演示
- 下载样例 Excel
- 导出包含多个工作表的分析结果 Excel
- Playwright 端到端测试覆盖页面打开和结果导出流程

## 技术栈

- Vite
- React
- TypeScript
- SheetJS `xlsx`
- Vitest
- Playwright
- lucide-react

## 快速开始

安装依赖：

```bash
npm install
```

首次运行 Playwright 前安装 Chromium：

```bash
npx playwright install chromium
```

启动本地开发服务：

```bash
npm run dev -- --port 5173
```

打开：

```text
http://127.0.0.1:5173/
```

## 常用命令

```bash
npm run dev
```

启动 Vite 开发服务。

```bash
npm test
```

运行 Vitest 单元测试。

```bash
npm run e2e
```

运行 Playwright 端到端测试。

```bash
npm run e2e:ui
```

打开 Playwright UI 模式。

```bash
npm run build
```

执行 TypeScript 检查并生成生产构建。

## Excel 输入字段

Demo 优先支持以下表头：

| 字段 | 是否建议提供 | 说明 |
| --- | --- | --- |
| 订单号 | 是 | 用于识别重复订单 |
| 下单日期 | 是 | 用于日期清洗和异常识别 |
| 客户名称 | 否 | 用于客户排行 |
| 商品名称 | 是 | 用于商品排行 |
| 销售渠道 | 是 | 用于渠道分析 |
| 销售金额 | 是 | 核心销售统计字段 |
| 退款金额 | 否 | 为空时按 0 处理 |
| 成本 | 否 | 用于估算毛利 |
| 负责人 | 否 | 用于负责人排行 |

可在页面点击“下载样例”获取标准 Excel 模板。

## 导出结果

导出的分析结果 Excel 包含：

- 清洗后明细
- 销售汇总
- 商品排行
- 渠道分析
- 客户排行
- 负责人排行
- 异常订单
- 老板周报

## 项目结构

```text
.
├── docs/
│   ├── excel-automation-demo-prd.md
│   └── superpowers/plans/
├── e2e/
│   └── demo.spec.ts
├── src/
│   ├── domain/
│   │   ├── report.ts
│   │   └── report.test.ts
│   ├── lib/
│   │   ├── excel.ts
│   │   ├── excel.test.ts
│   │   └── sampleData.ts
│   ├── App.tsx
│   ├── App.test.tsx
│   ├── main.tsx
│   ├── styles.css
│   └── types.ts
├── playwright.config.ts
├── vite.config.ts
└── vitest.config.ts
```

## 开发说明

- 核心报表逻辑在 `src/domain/report.ts`，尽量保持为纯函数，便于给不同客户定制模板。
- Excel 解析和导出边界在 `src/lib/excel.ts`，避免 UI 直接依赖 SheetJS 细节。
- 样例演示数据在 `src/lib/sampleData.ts`，包含多渠道、多商品和若干异常订单。
- Vitest 只匹配 `src/**/*.test.{ts,tsx}`，Playwright 测试独立放在 `e2e/`。

## 商业演示话术

这个 demo 可以这样介绍：

> 很多小团队每周都要人工整理订单 Excel、做销售汇总、查异常并写周报。这个工具把流程自动化：上传原始订单表，系统自动生成经营指标、排行、异常订单和老板周报，还能导出完整分析结果 Excel。

