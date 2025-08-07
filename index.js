import express from 'express';
import { logger } from './utils/logger.js';
import { config } from './config.js';
import { browserManager } from './atomy/browserManager.js';
import { initializeErrorHandler } from './utils/errorHandler.js';
import { apiRouter } from './api/router.js'; // 我們即將建立這個檔案

/**
 * 應用程式主函數
 */
async function main() {
  logger.info('====================================');
  logger.info('      Atomy API 服務 啟動中...      ');
  logger.info(`      環境: ${config.nodeEnv}`);
  logger.info('====================================');

  try {
    // 錯誤處理器仍然有用，用於處理爬蟲的內部錯誤
    initializeErrorHandler(); 

    // 初始化瀏覽器並執行首次登入
    await browserManager.initialize();
    
    // 建立 Express 應用程式
    const app = express();
    app.use(express.json()); // 讓我們的 API 可以解析 JSON request body

    // ★★★ 核心修改：掛載 API 路由 ★★★
    app.use('/api', apiRouter);

    // 啟動 API 伺服器
    const port = config.port || 3001; // 建議為 API 服務使用一個新 port，例如 3001
    app.listen(port, () => {
      logger.info(`Atomy API 服務正在監聽 port ${port}...`);
    });

  } catch (error) {
    logger.error(`API 服務啟動失敗: ${error}`);
    process.exit(1);
  }
}

main();

// 優雅關閉的邏輯保持不變
process.on('SIGINT', async () => {
  logger.info('接收到關閉信號 (SIGINT)，正在優雅地關閉程式...');
  await browserManager.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('偵測到未處理的 Promise Rejection:', reason);
});