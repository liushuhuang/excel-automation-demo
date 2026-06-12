import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the demo workspace controls and report sections', () => {
    const html = renderToString(<App />);

    expect(html).toContain('上传 Excel');
    expect(html).toContain('下载样例');
    expect(html).toContain('导出分析结果');
    expect(html).toContain('老板周报');
  });
});
