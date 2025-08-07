import express from 'express';
import lineSdk from '@line/bot-sdk';
const { Client, middleware: lineMiddleware, WebhookEvent } = lineSdk;
import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { dispatchQuery } from './messageParserService.js';
import { handleError } from '../utils/errorHandler.js';

// 建立 Express 應用程式
const app = express();

// 從設定檔建立 LINE SDK Client
const lineClient = new Client({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

// LINE Middleware 會幫我們驗證請求是否來自 LINE 平台
app.use('/webhook', lineMiddleware({ channelSecret: config.line.channelSecret }));

/**
 * 處理 Webhook POST 請求
 * 這是所有 LINE 訊息的入口
 */
app.post('/webhook', async (req, res) => {
  // req.body.events 是一個包含所有事件的陣列
  const events = req.body.events;

  try {
    // 使用 Promise.all 來平行處理所有收到的事件
    await Promise.all(events.map(event => handleEvent(event)));
    // 回應 200 OK 給 LINE 平台，表示我們已成功接收
    res.status(200).end();
  } catch (err) {
    logger.error(`Webhook 處理過程中發生錯誤: ${err}`);
    // 如果處理失敗，回傳 500 錯誤
    res.status(500).end();
  }
});

/**
 * 事件處理器，根據不同事件類型做不同處理
 * @param {WebhookEvent} event 
 */
async function handleEvent(event) {
  // 過濾掉非文字訊息
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  // 從事件中取得 userMessage 和 userId
  const userMessage = event.message.text;
  const userId = event.source.userId; // ★★★ 核心修改點 1：取得 userId ★★★
  
  logger.info(`收到來自 ${userId} 的訊息: "${userMessage}"`);

  // 我們不再立即回覆，所以 replyToken 在這裡的角色減弱了。
  // 我們可以讓後續的 dispatchQuery 非同步執行，讓主線程快速結束以回應 LINE 平台。
  // 這樣可以避免 LINE 平台因等待過久而認為我們的 Webhook 超時。

  // 立即回應 200 OK 給 LINE 平台 (由 line-sdk middleware 處理)，然後在背景執行我們的任務。
  (async () => {
    try {
      // 呼叫 dispatchQuery，它會回傳一個 Flex Message 物件
      const messageObject = await dispatchQuery(userMessage);

      // ★★★ 核心修改點 2：使用 pushMessage 而不是 replyMessage ★★★
      logger.info(`--- [推送模式] 準備推送結果給 ${userId} ---`);
      await lineClient.pushMessage(userId, messageObject);
      logger.info(`--- [推送模式] 結果推送成功 ---`);

    } catch (error) {
      // 即使在推送模式下出錯，我們也記錄下來。
      // 注意：這裡我們無法用 replyToken 回覆錯誤訊息了，因為主流程已結束。
      // 錯誤只會被記錄在後台 log 中。
      logger.error(`[推送模式] 處理指令 "${userMessage}" 時發生錯誤:`);
      // 我們不再呼叫 handleError(error, event) 因為 event 的上下文可能已失效。
      logger.error(`錯誤訊息: ${error.message}`);
      console.error(error.stack); // 打印完整的錯誤堆疊
    }
  })();
}
/**
 * 啟動 Web 伺服器
 */
export function startLineBotServer() {
  // 檢查 LINE 設定是否完整
  if (!config.line.channelAccessToken || !config.line.channelSecret) {
    logger.warn('LINE_CHANNEL_ACCESS_TOKEN 或 LINE_CHANNEL_SECRET 未設定，LINE Bot 伺服器不會啟動。');
    return;
  }

  const port = config.port;
  app.listen(port, () => {
    logger.info(`LINE Bot Webhook 伺服器正在監聽 port ${port}...`);
    logger.info(`請將 Webhook URL 設為: https://<你的網域>/webhook`);
  });
}