import { logger } from './logger.js';

// 在純 API 服務中，我們不再需要 LINE Client
// 它的職責簡化為記錄錯誤

export function initializeErrorHandler() {
  logger.info('錯誤處理器已初始化 (API 模式)。');
}

export async function handleError(error) {
  logger.error(`--- 錯誤捕獲 ---`);
  logger.error(`錯誤訊息: ${error.message}`);
  console.error(error.stack);
  logger.error(`--- 錯誤結束 ---`);
  
  // 在 API 模式下，我們不主動推送通知
  // 錯誤會被返回給 API 的呼叫者 (也就是 n8n)
}