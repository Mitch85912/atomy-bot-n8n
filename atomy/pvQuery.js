import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { selectors } from './selectors.js';
import { login, checkLoginStatus } from './auth.js';

/**
 * 查詢指定日期區間的 PV。
 * 這是經過所有修正後最穩健的版本。
 * @param {import('playwright').Page} page - Playwright 的 page 物件
 * @param { {startDate: string, endDate: string} } dateRange - 日期區間物件
 * @param {'date' | 'firstHalf' | 'secondHalf'} queryType - 查詢類型，用於判斷是輸入日期還是點擊按鈕
 * @returns {Promise<{leftPV: number, rightPV: number}>} - 包含左/右 PV 的物件
 */
export async function queryPV(page, dateRange, queryType) {
  logger.info(`開始查詢 PV，類型: ${queryType}, 日期: ${dateRange.startDate} 到 ${dateRange.endDate}`);

  // 步驟 1: 檢查登入狀態，如果 session 失效，則自動重新登入
  const isLoggedIn = await checkLoginStatus(page);
  if (!isLoggedIn) {
    logger.warn('Session 已失效，觸發自動重新登入...');
    const loginSuccess = await login(page); // 使用我們寫好的登入函式
    if (!loginSuccess) {
      // 如果重登也失敗，就拋出錯誤，終止本次查詢
      throw new Error('自動重新登入失敗，無法執行查詢。');
    }
  }

  try {
    // 步驟 2: 確保瀏覽器在正確的查詢頁面
    if (!page.url().includes(config.atomy.urls.lowerSales)) {
      await page.goto(config.atomy.urls.lowerSales);
    }
    
    // 等待頁面上的關鍵元素（日期輸入框）載入完成
    await page.waitForSelector(selectors.salesPage.dateStartInput, { timeout: 10000 });
    logger.info('已進入下線購買明細頁面。');

    // 步驟 3: 根據不同指令，用不同方式【設定日期】
    if (queryType === 'firstHalf') {
      logger.info('點擊 "1日~15日" 按鈕來設定日期...');
      await page.click(selectors.salesPage.firstHalfButton);
      // 點擊後，短暫等待以確保日期框的 value 已被 JS 更新
      await page.waitForTimeout(200); 
    } else if (queryType === 'secondHalf') {
      logger.info('點擊 "16日~最後一日" 按鈕來設定日期...');
      await page.click(selectors.salesPage.secondHalfButton);
      // 點擊後，短暫等待
      await page.waitForTimeout(200);
    } else {
      // 手動輸入日期的邏輯
      logger.info(`手動輸入日期: ${dateRange.startDate} -> ${dateRange.endDate}`);
      const atomyStartDate = dateRange.startDate.replace(/-/g, '');
      const atomyEndDate = dateRange.endDate.replace(/-/g, '');
      await page.fill(selectors.salesPage.dateStartInput, atomyStartDate);
      await page.fill(selectors.salesPage.dateEndInput, atomyEndDate);
    }

    // 步驟 4: 【統一的查詢觸發點】
    // 無論是何種方式設定日期，最後都由我們親自點擊「搜尋」按鈕來觸發查詢
    logger.info('統一執行點擊「搜尋」按鈕的操作...');
    
    // 定義一個等待後端 API 回應的函式，使用我們偵查到的真實端點
    const waitForSearchResponse = () => 
      page.waitForResponse(resp => resp.url().includes('lowerSalesSum') && resp.status() === 200, { timeout: 15000 });

    // 使用 Promise.all 同時執行點擊和等待
    await Promise.all([
      waitForSearchResponse(),
      page.click(selectors.salesPage.searchButton)
    ]);

    // 步驟 5: 等待前端渲染並抓取結果
    // 在網路請求完成後，為保險起見，再等待一小段固定時間讓頁面更新
    await page.waitForTimeout(500);
    logger.info('已取得查詢結果。');
    
    const leftPVText = await page.textContent(selectors.salesPage.leftPVCell);
    const rightPVText = await page.textContent(selectors.salesPage.rightPVCell);

    // 將文字 (例如 "90,100") 轉換為數字 (90100)
    const leftPV = parseInt(leftPVText.replace(/,/g, ''), 10) || 0;
    const rightPV = parseInt(rightPVText.replace(/,/g, ''), 10) || 0;

    logger.info(`查詢成功 - 左PV: ${leftPV}, 右PV: ${rightPV}`);
    return { leftPV, rightPV };

  } catch (error) {
    logger.error(`PV 查詢過程中發生錯誤: ${error}`);
    // 拋出更友善的錯誤訊息
    if (error.name === 'TimeoutError') {
        throw new Error('查詢頁面載入或搜尋結果超時，可能是 Atomy 網站或網路不穩定。');
    }
    throw new Error('查詢失敗，可能是頁面結構已變更或輸入的日期無效。');
  }
}