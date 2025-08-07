import lineSdk from '@line/bot-sdk';
const { Client } = lineSdk;
import { config } from '../config.js';
import { logger } from './logger.js';

// 初始化一個全域的 LINE Client 實例，但先不賦值
let lineClient = null;

/**
 * 初始化錯誤處理器，主要是設定好 LINE Bot Client。
 * 這個函式必須在主程式啟動時呼叫。
 */
export function initializeErrorHandler() {
  // 檢查設定是否齊全
  if (config.line.channelAccessToken && config.line.channelSecret) {
    lineClient = new Client({
      channelAccessToken: config.line.channelAccessToken,
      channelSecret: config.line.channelSecret,
    });
    logger.info('錯誤處理器已成功初始化 LINE Client。');
  } else {
    logger.warn('未提供 LINE Channel 的金鑰，錯誤通知將只會顯示在主控台。');
  }
}

/**
 * 統一的錯誤處理函式。
 * @param {Error} error - 捕獲到的 Error 物件
 * @param {import('@line/bot-sdk').MessageEvent | null} event - LINE 的訊息事件，如果有的話
 */
export async function handleError(error, event) {
  logger.error(`--- 錯誤捕獲 ---`);
  logger.error(`錯誤訊息: ${error.message}`);
  // 為了方便 debug，印出錯誤堆疊
  console.error(error.stack);
  logger.error(`--- 錯誤結束 ---`);

  // 特定錯誤處理: 首次登入失敗
  if (error.message === 'InitialLoginFailed') {
    await notifyAdmin(config.messages.loginFailedNotification);
  }

  // 其他需要通知管理員的嚴重錯誤也可以加在這裡
  // if (error instanceof CriticalError) { ... }

  // 如果這個錯誤是在處理使用者訊息時發生的，可以考慮回覆一個通用錯誤訊息
  if (event && event.replyToken) {
    try {
      if (lineClient) {
        // 使用我們在 config.js 中定義的統一失敗訊息
        await lineClient.replyMessage(event.replyToken, {
          type: 'text',
          text: config.messages.queryFailed,
        });
      }
    } catch (replyError) {
      logger.error(`回覆錯誤訊息給使用者時也失敗了: ${replyError}`);
    }
  }
}

/**
 * 推送訊息給管理者。
 * @param {string} messageText - 要發送的訊息
 */
async function notifyAdmin(messageText) {
  // 確認 LINE Client 和管理者 ID 都已設定
  if (!lineClient || !config.line.adminUserId) {
    logger.warn('無法發送管理者通知：未設定 LINE Client 或 Admin User ID。');
    logger.warn(`通知內容: ${messageText}`);
    return;
  }

  try {
    logger.info(`正在發送通知給管理者 (ID: ${config.line.adminUserId})...`);
    await lineClient.pushMessage(config.line.adminUserId, {
      type: 'text',
      text: messageText,
    });
    logger.info('管理者通知發送成功。');
  } catch (pushError) {
    logger.error(`發送管理者通知失敗: ${pushError}`);
  }
}