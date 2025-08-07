import { dateHelper } from '../utils/dateHelper.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { browserManager } from '../atomy/browserManager.js';
import { queryPV } from '../atomy/pvQuery.js';
import { createPvDashboardMessage } from '../utils/flexMessageGenerator.js'; // <-- 1. 引入產生器
import { stateManager } from '../stateManager.js'; // <-- 2. 引入狀態管理器，以獲取最近達標日

/**
 * 解析收到的訊息，並分派查詢任務。
 * @param {string} messageText - 使用者傳送的訊息內容
 * @returns {Promise<import('@line/bot-sdk').Message>} - 回傳給使用者的最終訊息物件 (純文字或 Flex Message)
 */
export async function dispatchQuery(messageText) {
  logger.info(`接收到原始指令: "${messageText}"`);

  const trimmedText = messageText.trim();
  const dateRange = dateHelper.parse(trimmedText);

  if (!dateRange) {
    logger.warn(`無法解析指令 "${trimmedText}"，回傳錯誤提示。`);
    // 對於無效指令，仍然回傳純文字
    return { type: 'text', text: config.messages.invalidCommand };
  }

  let queryType;
  if (trimmedText === '上半個月') queryType = 'firstHalf';
  else if (trimmedText === '下半個月') queryType = 'secondHalf';
  else queryType = 'date';

  try {
    const page = browserManager.getPage();
    const result = await queryPV(page, dateRange, queryType);
    
    // 從狀態檔讀取最近的達標日
    const state = await stateManager.get();

    // 格式化日期區間文字
    const dateLabel = dateRange.startDate === dateRange.endDate
      ? dateRange.startDate.substring(5).replace('-', '/')
      : `${dateRange.startDate.substring(5).replace('-', '/')} - ${dateRange.endDate.substring(5).replace('-', '/')}`;

    // ★★★ 核心修改點：呼叫 Flex Message 產生器 ★★★
    return createPvDashboardMessage({
      title: '📊 PV 查詢結果', // 為手動查詢設定一個標題
      dateRangeText: dateLabel,
      leftPV: result.leftPV,
      rightPV: result.rightPV,
      achievementDate: state.lastAchievementDate, // 手動查詢時也顯示最近達標日
    });

  } catch (error) {
    logger.error(`在 dispatchQuery 中捕捉到查詢錯誤: ${error.message}`);
    // 對於查詢失敗，也回傳純文字
    const errorMessage = `${config.messages.queryFailed}\n錯誤原因: ${error.message}`;
    return { type: 'text', text: errorMessage };
  }
}