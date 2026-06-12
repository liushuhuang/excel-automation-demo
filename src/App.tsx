import { type ChangeEvent, type ReactNode, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Download,
  FileDown,
  FileSpreadsheet,
  RefreshCw,
  Upload
} from 'lucide-react';
import { buildReport } from './domain/report';
import { downloadReportWorkbook, downloadSampleWorkbook, parseWorkbook } from './lib/excel';
import { sampleOrderRows } from './lib/sampleData';
import type { RankingItem, ReportResult } from './types';

const initialReport = buildReport(sampleOrderRows);
const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  maximumFractionDigits: 0
});
const numberFormatter = new Intl.NumberFormat('zh-CN');
const percentFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

export default function App() {
  const [report, setReport] = useState<ReportResult>(initialReport);
  const [fileName, setFileName] = useState('样例订单数据');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const metricCards = useMemo(
    () => [
      { label: '净销售额', value: formatCurrency(report.summary.netSales), tone: 'green' },
      { label: '订单数', value: `${formatNumber(report.summary.totalOrders)} 笔`, tone: 'ink' },
      { label: '估算毛利', value: formatCurrency(report.summary.grossProfit), tone: 'gold' },
      { label: '异常订单', value: `${formatNumber(report.anomalies.length)} 条`, tone: 'red' }
    ],
    [report]
  );

  const previewRows = report.cleanedRows.slice(0, 8);
  const topAnomalies = report.anomalies.slice(0, 8);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('文件格式不支持，请上传 .xlsx 文件。');
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const rows = await parseWorkbook(file);
      if (rows.length === 0) {
        setError('文件为空或没有有效数据。');
        return;
      }

      setReport(buildReport(rows));
      setFileName(file.name);
    } catch {
      setError('文件解析失败，请确认表头和样例文件一致。');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  }

  function resetToSample() {
    setReport(initialReport);
    setFileName('样例订单数据');
    setError('');
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">经营报表自动化</p>
          <h1>Excel 自动报表助手</h1>
        </div>
        <div className="file-badge">
          <FileSpreadsheet size={18} />
          <span>{fileName}</span>
        </div>
      </header>

      <section className="action-bar" aria-label="报表操作">
        <label className="button button-primary">
          <Upload size={18} />
          <span>{isProcessing ? '处理中' : '上传 Excel'}</span>
          <input type="file" accept=".xlsx" onChange={handleFileChange} disabled={isProcessing} />
        </label>
        <button className="button" type="button" onClick={downloadSampleWorkbook}>
          <Download size={18} />
          <span>下载样例</span>
        </button>
        <button className="button" type="button" onClick={() => downloadReportWorkbook(report)}>
          <FileDown size={18} />
          <span>导出分析结果</span>
        </button>
        <button className="icon-button" type="button" onClick={resetToSample} aria-label="恢复样例数据" title="恢复样例数据">
          <RefreshCw size={18} />
        </button>
      </section>

      {error && (
        <div className="notice" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="kpi-grid" aria-label="关键指标">
        {metricCards.map((card) => (
          <article className={`kpi-card kpi-${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="summary-grid">
        <article className="panel narrative-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Weekly Memo</p>
              <h2>老板周报</h2>
            </div>
            <CheckCircle2 size={22} />
          </div>
          <p>{report.weeklyNarrative}</p>
        </article>

        <article className="panel anomaly-panel">
          <div className="panel-heading">
            <div>
              <p className="section-kicker">Risk Check</p>
              <h2>异常订单</h2>
            </div>
            <AlertTriangle size={22} />
          </div>
          <div className="anomaly-list">
            {topAnomalies.length === 0 ? (
              <p className="empty-text">未发现明显异常。</p>
            ) : (
              topAnomalies.map((item) => (
                <div className="anomaly-row" key={`${item.rowNumber}-${item.type}`}>
                  <strong>{item.type}</strong>
                  <span>
                    第 {item.rowNumber} 行 · {item.orderId}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="analysis-grid">
        <RankingTable title="商品排行" icon={<BarChart3 size={20} />} rows={report.productRanking.slice(0, 8)} />
        <RankingTable title="渠道分析" icon={<BarChart3 size={20} />} rows={report.channelRanking.slice(0, 8)} />
      </section>

      <section className="panel data-panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Cleaned Rows</p>
            <h2>清洗后明细预览</h2>
          </div>
          <span className="count-pill">{formatNumber(report.cleanedRows.length)} 行</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>订单号</th>
                <th>日期</th>
                <th>商品</th>
                <th>渠道</th>
                <th>销售额</th>
                <th>退款</th>
                <th>毛利</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row) => (
                <tr key={`${row.rowNumber}-${row.orderId}`}>
                  <td>{row.orderId || '未填写'}</td>
                  <td>{row.orderDate || '异常'}</td>
                  <td>{row.productName || '未填写'}</td>
                  <td>{row.channel || '未填写'}</td>
                  <td>{formatCurrency(row.salesAmount)}</td>
                  <td>{formatCurrency(row.refundAmount)}</td>
                  <td>{formatCurrency(row.grossProfit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

interface RankingTableProps {
  title: string;
  icon: ReactNode;
  rows: RankingItem[];
}

function RankingTable({ title, icon, rows }: RankingTableProps) {
  return (
    <article className="panel ranking-panel">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Top Performers</p>
          <h2>{title}</h2>
        </div>
        {icon}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>净销售额</th>
              <th>订单</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>{row.name}</td>
                <td>{formatCurrency(row.netSales)}</td>
                <td>{formatNumber(row.orderCount)}</td>
                <td>{formatPercent(row.share)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return percentFormatter.format(value);
}
