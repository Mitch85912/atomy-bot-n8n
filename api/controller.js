// --- START OF MODIFIED FILE controller.js ---

import { logger } from '../utils/logger.js';
import { browserManager } from '../atomy/browserManager.js';
import { dateHelper } from '../utils/dateHelper.js';
import { queryPV } from '../atomy/pvQuery.js';
import { queryLatestAchievementDate } from '../atomy/queryAchievement.js';
import { stateManager } from '../stateManager.js';

export async function getPvReport(req, res) {
  const { query } = req.query;
  logger.info(`[API] 接收到 PV 查詢請求，指令: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  let dateRange;
  let queryType = 'date'; 

  if (query === 'from_latest_achievement') {
    logger.info('[API] 偵測到自動追蹤指令 "from_latest_achievement"，從狀態檔讀取日期...');
    try {
      const state = await stateManager.get();
      const latestDate = state.lastAchievementDate;

      if (!latestDate) {
        logger.warn('[API] 狀態檔中沒有找到 lastAchievementDate，無法執行自動查詢。');
        return res.status(404).json({ message: '尚未設定基準達標日。請先呼叫 POST /api/achievement/update 來設定。' });
      }
      
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() + 1);
      const today = new Date();

      if (startDate > today) {
        // ★ 即使沒有資料，也回傳達標日，讓前端顯示一致 ★
        const state = await stateManager.get();
        return res.status(200).json({ 
          message: '達標日期過於接近，尚無資料可供查詢。',
          leftPV: 0,
          rightPV: 0,
          query: query,
          dateRange: null,
          lastAchievementDate: state.lastAchievementDate || null
        });
      }
      
      dateRange = {
        startDate: dateHelper.formatDate(startDate),
        endDate: dateHelper.formatDate(today),
      };

    } catch(error) {
      logger.error(`[API] 在處理 "from_latest_achievement" 指令時失敗: ${error.message}`);
      return res.status(500).json({ error: '處理特殊指令失敗。', details: error.message });
    }
  } else if (query === '上半個月' || query === '下半個月') {
    dateRange = dateHelper.parse(query);
    queryType = query === '上半個月' ? 'firstHalf' : 'secondHalf';
  } else {
    dateRange = dateHelper.parse(query);
  }

  if (!dateRange) {
    return res.status(400).json({ error: `無效的查詢格式: "${query}"` });
  }

  try {
    const page = browserManager.getPage();
    const pvData = await queryPV(page, dateRange, queryType);
    
    // ★ 核心修改：無論何種查詢，都附上儲存的最新達標日 ★
    const state = await stateManager.get();
    
    return res.status(200).json({
      ...pvData,
      query: query,
      dateRange,
      lastAchievementDate: state.lastAchievementDate || null // 確保回傳的物件永遠有這個欄位
    });
  } catch (error) {
    logger.error(`[API] PV 查詢失敗: ${error.message}`);
    return res.status(500).json({ error: '查詢 PV 資料失敗。', details: error.message });
  }
}

// updateAndStoreAchievementDate 和 postOrder 函式維持不變...
// (此處省略以節省篇幅，請保留您檔案中原有的這兩個函式)
export async function updateAndStoreAchievementDate(req, res) {
    logger.info('[API] 接收到「更新並儲存達標日」請求...');
    try {
        const page = browserManager.getPage();
        const latestDate = await queryLatestAchievementDate(page);

        if (!latestDate) {
            logger.warn('[API] 查詢後未找到任何達標紀錄。');
            return res.status(404).json({ success: false, message: '在 Atomy 網站上未找到任何達標紀錄。' });
        }

        await stateManager.set({ lastAchievementDate: latestDate });
        
        logger.info(`[API] 成功查詢並儲存最新達標日: ${latestDate}`);
        return res.status(200).json({ 
            success: true,
            message: '成功更新並儲存最新達標日。',
            lastAchievementDate: latestDate 
        });

    } catch (error) {
        logger.error(`[API] 更新達標日時發生錯誤: ${error.message}`);
        return res.status(500).json({ success: false, error: '更新達標日失敗。', details: error.message });
    }
}


// --- END OF MODIFIED FILE controller.js ---