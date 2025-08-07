import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { selectors } from './selectors.js';
import { checkLoginStatus, login } from './auth.js';

// 新增一個組織獎金頁面的 URL 到 config 中
config.atomy.urls.allowanceSet = 'https://tw.atomy.com/myoffice/myAllow/AllowSet';

/**
 * 查詢最新的組織獎金達標日期
 * @param {import('playwright').Page} page - Playwright 的 page 物件
 * @returns {Promise<string | null>} - 返回 YYYY-MM-DD 格式的日期字串，如果找不到則返回 null
 */
export async function queryLatestAchievementDate(page) {
  logger.info('開始查詢最新達標日期...');

  // 確保登入狀態
  const isLoggedIn = await checkLoginStatus(page);
  if (!isLoggedIn) {
    logger.warn('達標查詢前觸發自動重新登入...');
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      throw new Error('自動重新登入失敗，無法查詢達標日期。');
    }
  }

  try {
    // 前往目標頁面
    await page.goto(config.atomy.urls.allowanceSet);
    
    // 等待表格出現
    await page.waitForSelector(selectors.achievementPage.resultTableBody, { timeout: 15000 });
    logger.info('已進入組織獎金頁面。');

    // 取得表格中的所有列 (rows)
    const rows = await page.locator(`${selectors.achievementPage.resultTableBody} ${selectors.achievementPage.tableRow}`);
    const rowCount = await rows.count();
    logger.info(`找到 ${rowCount} 筆獎金紀錄，開始遍歷...`);

    // 從第一行開始，往下尋找
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      
      // 取得該行的狀態文字和日期文字
      const statusText = await row.locator(selectors.achievementPage.statusCell).textContent();
      const dateText = await row.locator(selectors.achievementPage.dateCell).textContent();

      // 檢查狀態是否不是「未達」
      if (statusText && statusText.trim() !== '未達') {
        logger.info(`找到最新達標紀錄！日期: ${dateText}, 狀態: ${statusText.trim()}`);
        return dateText.trim(); // 返回找到的第一個符合條件的日期
      }
    }

    // 如果遍歷完所有行都沒有找到，表示近期無達標
    logger.warn('在此頁面未找到任何達標紀錄。');
    return null;

  } catch (error) {
    logger.error(`查詢達標日期過程中發生錯誤: ${error}`);
    // 拋出錯誤，讓上層的排程器知道本次任務失敗
    throw error;
  }
}