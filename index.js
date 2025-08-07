import { logger } from './utils/logger.js';
import { config } from './config.js';
import { browserManager } from './atomy/browserManager.js';
import { startLineBotServer } from './services/lineBotService.js';
import { initializeErrorHandler } from './utils/errorHandler.js';
import { startSchedulers } from './services/schedulerService.js';

/**
 * 應用程式主函數
 */
async function main() {
  logger.info('====================================');
  logger.info('      Atomy PV 查詢 Bot 啟動中...     ');
  logger.info(`      環境: ${config.nodeEnv}`);
  logger.info('====================================');

  try {
    // 步驟 1: 初始化錯誤處理器，讓它可以發送 LINE 通知
    initializeErrorHandler();
    
    // 步驟 2: 初始化瀏覽器並執行首次登入
    await browserManager.initialize();
    
    // 步驟 3: 啟動 LINE Bot 的 Webhook 伺服器
    startLineBotServer();
    // 步驟 4: 啟動所有背景排程任務
    startSchedulers(); // <-- 2. 呼叫啟動函式

  } catch (error) {
    logger.error(`應用程式啟動失敗: ${error}`);
    process.exit(1); // 嚴重錯誤，直接退出
  }
}

// 執行主函數
main();

// 處理程式中斷事件 (例如 Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('接收到關閉信號 (SIGINT)，正在優雅地關閉程式...');
  await browserManager.close(); // 確保瀏覽器被關閉
  process.exit(0);
});

// 處理未捕捉的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
  logger.error('偵測到未處理的 Promise Rejection:');
  logger.error(reason);
});