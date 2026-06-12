# Excel Automation Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser demo that uploads a standard order `.xlsx`, cleans and analyzes the data, previews the report, and exports a multi-sheet Excel result.

**Architecture:** Use a Vite + React + TypeScript single-page app. Keep report calculation in pure TypeScript modules under `src/domain` so it is covered by Vitest and reusable for future customer-specific templates. Use the `xlsx` package only at the import/export boundary.

**Tech Stack:** Vite, React, TypeScript, Vitest, SheetJS `xlsx`, lucide-react.

---

## File Structure

- `package.json`: npm scripts and runtime/dev dependencies.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`: TypeScript and Vite configuration.
- `index.html`: Vite HTML entrypoint.
- `src/main.tsx`: React app entrypoint.
- `src/App.tsx`: Demo UI, file upload, report preview, sample download, export action.
- `src/styles.css`: Product UI styling.
- `src/domain/report.ts`: Pure data normalization, anomaly detection, aggregation, report text generation.
- `src/domain/report.test.ts`: Vitest coverage for report behavior.
- `src/lib/excel.ts`: Parse uploaded workbooks and export generated report workbooks.
- `src/lib/sampleData.ts`: Deterministic sample order rows for demo download and default preview.
- `src/types.ts`: Shared row, anomaly, summary, ranking and report types.

## Task 1: Scaffold App

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create npm project files**

Create `package.json` with scripts:

```json
{
  "name": "excel-automation-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.5.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create TypeScript and Vite config**

Create strict TypeScript configs and React Vite config.

- [ ] **Step 3: Create placeholder React entry**

Create a minimal `src/App.tsx` that renders the product name, plus `main.tsx` and `styles.css`.

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: dependency install completes and creates `package-lock.json`.

- [ ] **Step 5: Verify scaffold**

Run: `npm run build`

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/main.tsx src/App.tsx src/styles.css
git commit -m "chore: scaffold demo app"
```

## Task 2: Report Domain Logic

**Files:**
- Create: `src/types.ts`
- Create: `src/domain/report.test.ts`
- Create: `src/domain/report.ts`

- [ ] **Step 1: Write failing tests**

Test these behaviors in `src/domain/report.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildReport } from './report';
import type { RawOrderRow } from '../types';

const rows: RawOrderRow[] = [
  { orderId: 'SO-1', orderDate: '2026-06-01', customerName: '张三', productName: '防晒喷雾', channel: '抖音', salesAmount: 199, refundAmount: 0, cost: 80, owner: '李四' },
  { orderId: 'SO-2', orderDate: '2026/06/02', customerName: '李雷', productName: '修护面膜', channel: '小红书', salesAmount: '299', refundAmount: '20', cost: '120', owner: '王五' },
  { orderId: 'SO-2', orderDate: 'bad-date', customerName: '', productName: '', channel: '抖音', salesAmount: 0, refundAmount: 10, cost: 20, owner: '李四' }
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
    expect(report.productRanking[0]).toMatchObject({ name: '修护面膜', netSales: 279, orderCount: 1 });
    expect(report.channelRanking[0]).toMatchObject({ name: '小红书', netSales: 279, orderCount: 1 });
  });

  it('detects common spreadsheet anomalies', () => {
    const report = buildReport(rows);
    expect(report.anomalies.map((item) => item.type)).toEqual(
      expect.arrayContaining(['重复订单号', '日期格式异常', '缺少商品名称', '销售金额为空或为0', '退款金额大于销售金额'])
    );
  });

  it('generates a boss-readable weekly narrative', () => {
    const report = buildReport(rows);
    expect(report.weeklyNarrative).toContain('本周共统计 3 笔订单');
    expect(report.weeklyNarrative).toContain('防晒喷雾');
    expect(report.weeklyNarrative).toContain('异常订单');
  });
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/domain/report.test.ts`

Expected: FAIL because `src/domain/report.ts` and `src/types.ts` do not exist yet.

- [ ] **Step 3: Implement minimal report logic**

Create shared types and `buildReport(rows: RawOrderRow[]): ReportResult` with normalization, anomaly detection, product/channel aggregation, summary metrics and narrative.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/domain/report.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit domain logic**

Run:

```bash
git add src/types.ts src/domain/report.ts src/domain/report.test.ts
git commit -m "feat: add Excel report engine"
```

## Task 3: Excel Import Export

**Files:**
- Create: `src/lib/excel.ts`
- Create: `src/lib/sampleData.ts`

- [ ] **Step 1: Write sample data and Excel boundary helpers**

Create deterministic sample rows with at least 60 rows and several anomalies. Create helpers:

```ts
parseWorkbook(file: File): Promise<RawOrderRow[]>
downloadSampleWorkbook(): void
downloadReportWorkbook(report: ReportResult): void
```

- [ ] **Step 2: Build to verify type safety**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 3: Commit Excel helpers**

Run:

```bash
git add src/lib/excel.ts src/lib/sampleData.ts
git commit -m "feat: add Excel import and export helpers"
```

## Task 4: Demo UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Implement product UI**

Build a tool-first interface with upload, sample download, report generation, KPI cards, product/channel tables, anomaly panel, weekly narrative and export button.

- [ ] **Step 2: Build to verify type safety**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 3: Commit UI**

Run:

```bash
git add src/App.tsx src/styles.css
git commit -m "feat: build Excel automation demo UI"
```

## Task 5: Final Verification and Local Server

**Files:**
- No source edits expected.

- [ ] **Step 1: Run tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: exit 0.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --port 5173`

Expected: app is available at `http://127.0.0.1:5173/`.

