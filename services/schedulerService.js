import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { browserManager } from '../atomy/browserManager.js';
import { queryLatestAchievementDate } from '../atomy/queryAchievement.js';
import { stateManager } from '../stateManager.js';
import { config } from '../config.js';
import { Client } from '@line/bot-sdk';
import { createPvDashboardMessage } from '../utils/flexMessageGenerator.js';
import { dateHelper } from '../utils/dateHelper.js'; // ★★★ 新增這一行 ★★★
import { queryPV } from '../atomy/pvQuery.js';       // ★★★ 順便把 queryPV 也加進來 

const lineClient = new Client({
  channelAccessToken: config.line.channelAccessToken,
  channelSecret: config.line.channelSecret,
});

/**
 * 啟動所有排程任務
 */
export function startSchedulers() {
  logger.info('排程服務已啟動。');

  // 1. 服務啟動時，立即執行一次主檢查任務
  logger.info('--- [啟動任務] 執行首次達標檢查與 PV 推送 ---');
  runMainCheckAndPush();

  // 2. ★★★ 新的排程邏輯 ★★★
  // 從早上 8 點到晚上 10 點，每兩個小時的整點執行一次
  const cronExpression = '0 8-22/2 * * *';
  logger.info(`已設定定時任務，排程表達式: "${cronExpression}"`);
  
  cron.schedule(cronExpression, runMainCheckAndPush, {
    scheduled: true,
    timezone: "Asia/Taipei"
  });
}

/**
 * 【唯一的、統一的主函式】
 *  - 爬取最新達標日。
 *  - 如果找到，就更新狀態並立即推送一次 PV 報告。
 */
async function runMainCheckAndPush() {
  logger.info('--- [主任務] 開始執行達標檢查與 PV 推送流程 ---');
  try {
    const page = browserManager.getPage();
    const latestDate = await queryLatestAchievementDate(page);

    // 只要找到了最新的達標日期，就執行後續動作
    if (latestDate) {
      logger.info(`檢查到最新的達標日為: ${latestDate}`);
      
      // 步驟 A: 更新狀態檔，確保我們的記錄永遠是最新
      await stateManager.set({ 
        lastAchievementDate: latestDate,
        // isPvTrackingActive 這個欄位現在可以移除了，因為我們不再有持續追蹤的任務
      });

      // 步驟 B: 無條件執行一次 PV 查詢與推送
      await executeAndPushPvQuery(latestDate);

    } else {
      logger.info('本次檢查未發現任何達標紀錄，不執行任何動作。');
    }
  } catch (error) {
    logger.error(`[主任務] 執行過程中發生錯誤: ${error.message}`);
  }
}


/**
 * 執行 PV 查詢並透過 LINE 推送結果 (此函式保持不變)
 * @param {string} achievementDate - YYYY-MM-DD 格式的達標日
 */
async function executeAndPushPvQuery(achievementDate) {
  try {
    const startDate = new Date(achievementDate);
    startDate.setDate(startDate.getDate() + 1);
    const today = new Date();

    if (startDate > today) {
        logger.info(`[PV推送] 達標日 (${achievementDate}) 的隔天尚未到來，無需推送。`);
        return;
    }

    const formatMMDD = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const queryCommand = `${formatMMDD(startDate)} ${formatMMDD(today)}`;
    
    logger.info(`[PV推送] 執行查詢，指令: "${queryCommand}"`);

    // 注意：dispatchQuery 現在回傳的是一個完整的訊息物件，而不是字串
    // 但我們只需要它的核心 PV 數據，所以最好還是直接呼叫 queryPV
    const page = browserManager.getPage();
    const dateRange = dateHelper.parse(queryCommand);
    const result = await queryPV(page, dateRange, 'date');

    // 格式化日期區間文字
    const dateLabel = dateRange.startDate === dateRange.endDate
      ? dateRange.startDate.substring(5).replace('-', '/')
      : `${dateRange.startDate.substring(5).replace('-', '/')} - ${dateRange.endDate.substring(5).replace('-', '/')}`;
    
    // ★★★ 核心修改點：呼叫 Flex Message 產生器 ★★★
    const flexMessage = createPvDashboardMessage({
        title: '📈 自動PV追蹤報告', // 為自動推送設定一個不同的標題
        dateRangeText: dateLabel,
        leftPV: result.leftPV,
        rightPV: result.rightPV,
        achievementDate: achievementDate, // 自動推送時，傳入當次檢查到的達標日
    });



    logger.info(`[PV推送] 準備推送 Flex Message...`);


    if (!config.line.adminUserId) {
        logger.error('錯誤：LINE_ADMIN_USER_ID 未設定，無法推送訊息！');
        return;
    }
    await lineClient.pushMessage(config.line.adminUserId, flexMessage); // <-- 直接推送產生的 Flex Message
    logger.info('[PV推送] 訊息推送成功！');

  } catch (error) {
    logger.error(`[PV推送] 執行查詢或推送時失敗: ${error.message}`);
  }
}