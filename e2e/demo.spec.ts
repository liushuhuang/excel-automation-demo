import { expect, test } from '@playwright/test';

test('loads the Excel automation workspace and exports a report workbook', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Excel 自动报表助手' })).toBeVisible();
  await expect(page.getByText('上传 Excel')).toBeVisible();
  await expect(page.getByText('下载样例')).toBeVisible();
  await expect(page.getByRole('heading', { name: '老板周报' })).toBeVisible();
  await expect(page.getByText(/本周共统计/)).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出分析结果' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/Excel自动报表助手-分析结果-\d+\.xlsx/);
});
