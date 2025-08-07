import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { selectors } from './selectors.js';

/**
 * 登入 Atomy 網站，包含重試機制。
 * @param {import('playwright').Page} page - Playwright 的 page 物件
 * @param {number} attempts - 剩餘重試次數
 * @returns {Promise<boolean>} 是否登入成功
 */
export async function login(page, attempts = config.retry.loginAttempts) {
  logger.info(`正在嘗試登入 Atomy... 剩餘 ${attempts} 次機會`);

  try {
    await page.goto(config.atomy.urls.login);

    // 等待帳號輸入框出現
    await page.waitForSelector(selectors.loginPage.usernameInput, { timeout: 15000 });

    // 填寫帳號與密碼
    await page.fill(selectors.loginPage.usernameInput, config.atomy.id);
    await page.fill(selectors.loginPage.passwordInput, config.atomy.password);

    // 等待登入按鈕並點擊，同時等待 URL 改變
    // Promise.all 讓點擊和等待頁面跳轉同時發生，更可靠
    await Promise.all([
      page.waitForURL(selectors.postLogin.successUrl, { timeout: 10000 }),
      page.click(selectors.loginPage.loginButton),
    ]);
    
    logger.info('Atomy 登入成功，已跳轉到主頁面！');
    return true;

  } catch (error) {
    logger.error(`登入失敗: ${error.message}`);
    if (attempts > 1) {
      // 如果不是最後一次嘗試，等待一段時間後重試
      await new Promise(resolve => setTimeout(resolve, config.retry.delay));
      return login(page, attempts - 1); // 遞迴呼叫，次數減一
    } else {
      logger.error('已達最大重試次數，登入徹底失敗。');
      return false; // 所有嘗試均失敗
    }
  }
}

/**
 * 檢查目前是否為登入狀態。
 * @param {import('playwright').Page} page
 * @returns {Promise<boolean>}
 */
export async function checkLoginStatus(page) {
    try {
        // 快速檢查當前 URL 是否已經是登入後狀態
        if (page.url().includes('/main') || page.url().includes('/myoffice')) {
            logger.info('偵測到已登入狀態。');
            return true;
        }
        
        // 如果不在預期頁面，嘗試訪問一個需要登入的頁面
        // 如果沒有被重導向到登入頁，就代表 session 仍然有效
        await page.goto(config.atomy.urls.lowerSales, { waitUntil: 'domcontentloaded', timeout: 7000 });

        // 如果頁面 URL 包含 'login'，代表 session 已失效，被導向登入頁
        if (page.url().includes('/login')) {
            logger.warn('Session 已失效，被重導向至登入頁。');
            return false;
        }

        logger.info('Session 驗證成功，仍為登入狀態。');
        return true;

    } catch (error) {
        logger.warn(`檢查登入狀態時發生錯誤，可能需要重新登入: ${error.message}`);
        return false;
    }
}