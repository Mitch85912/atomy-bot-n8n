import { chromium } from 'playwright';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { login } from './auth.js';
import { handleError } from '../utils/errorHandler.js';

// 全域變數，用來儲存唯一的瀏覽器和頁面實例
let browser = null;
let page = null;

/**
 * 初始化並啟動 Playwright 瀏覽器，並執行首次登入。
 * 這是整個應用程式的起點。
 * @returns {Promise<void>}
 */
async function initializeBrowser() {
  if (browser) {
    logger.warn('瀏覽器已經初始化，無需重複執行。');
    return;
  }
  
  try {
    logger.info('正在啟動 Playwright 瀏覽器...');
    browser = await chromium.launch(config.playwright.launchOptions);
    
    // 監聽瀏覽器斷線事件，方便 Debug
    browser.on('disconnected', () => {
      logger.error('!!! 瀏覽器連線已中斷 !!!');
      browser = null; // 清除實例，以便可以重啟
      page = null;
      // 在真實場景中，這裡可以觸發重啟機制的通知
    });

    // 建立一個新的頁面
    page = await browser.newPage();
    logger.info('瀏覽器頁面已建立。');

    // 執行首次登入
    const loginSuccess = await login(page);

    if (!loginSuccess) {
      // 根據你的需求，如果首次啟動登入就失敗，要發送 LINE 通知
      logger.error('程式啟動時登入失敗，將發送緊急通知。');
      // 這裡我們呼叫一個錯誤處理函式，它會負責發送 LINE 通知
      await handleError(new Error('InitialLoginFailed'), null); // null 代表沒有 line event
      // 雖然登入失敗，但我們先不關閉程式，讓它有機會在下次查詢時重試
    }

  } catch (error) {
    logger.error(`初始化瀏覽器或首次登入時發生嚴重錯誤: ${error}`);
    // 同樣發送通知
    await handleError(error, null);
    // 如果連瀏覽器都起不來，那就直接結束程式
    process.exit(1);
  }
}

/**
 * 提供全域唯一的 Page 物件
 * @returns {import('playwright').Page}
 */
function getPage() {
  if (!page) {
    // 這個錯誤理論上不應該發生，除非初始化失敗
    throw new Error('頁面尚未初始化！請先呼叫 initializeBrowser。');
  }
  return page;
}

/**
 * 關閉瀏覽器，用於程式正常退出時
 */
async function closeBrowser() {
  if (browser) {
    logger.info('正在關閉瀏覽器...');
    await browser.close();
    browser = null;
    page = null;
  }
}

// 導出我們需要的方法
export const browserManager = {
  initialize: initializeBrowser,
  getPage,
  close: closeBrowser,
};