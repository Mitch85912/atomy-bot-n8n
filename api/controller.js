import { logger } from '../utils/logger.js';
import { browserManager } from '../atomy/browserManager.js';
import { dateHelper } from '../utils/dateHelper.js';
import { queryPV } from '../atomy/pvQuery.js';
import { queryLatestAchievementDate } from '../atomy/queryAchievement.js';

// GET /api/pv?query=...
export async function getPvReport(req, res) {
  const { query } = req.query;
  logger.info(`[API] 接收到 PV 查詢請求，指令: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  let dateRange;
  let queryType = 'date'; // 默认为日期查询

  // ★★★ 核心升级点 ★★★
  if (query === 'from_latest_achievement') {
    logger.info('[API] 检测到特殊指令 "from_latest_achievement"，开始处理...');
    try {
      const page = browserManager.getPage();
      const latestDate = await queryLatestAchievementDate(page);

      if (!latestDate) {
        return res.status(404).json({ message: 'No achievement record found to calculate date range.' });
      }

      // 计算日期范围
      const startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() + 1);
      const today = new Date();

      if (startDate > today) {
        return res.status(200).json({ 
          message: 'Achievement date is too recent, no data to query yet.',
          leftPV: 0,
          rightPV: 0,
          query: query,
          dateRange: null 
        });
      }
      
      dateRange = {
        startDate: dateHelper.formatDate(startDate),
        endDate: dateHelper.formatDate(today),
      };

    } catch(error) {
      logger.error(`[API] 在处理 "from_latest_achievement" 指令时失败: ${error.message}`);
      return res.status(500).json({ error: 'Failed to process special command.', details: error.message });
    }

  } else if (query === '上半个月' || query === '下半個月') {
    dateRange = dateHelper.parse(query);
    queryType = query === '上半个月' ? 'firstHalf' : 'secondHalf';
  } else {
    dateRange = dateHelper.parse(query);
  }

  if (!dateRange) {
    return res.status(400).json({ error: `Invalid query format: "${query}"` });
  }

  try {
    const page = browserManager.getPage();
    const pvData = await queryPV(page, dateRange, queryType);
    
    return res.status(200).json({
      ...pvData,
      query: query,
      dateRange,
    });
  } catch (error) {
    logger.error(`[API] PV 查詢失敗: ${error.message}`);
    return res.status(500).json({ error: 'Failed to query PV data.', details: error.message });
  }
}
// GET /api/achievement/latest
export async function getLatestAchievement(req, res) {
  logger.info('[API] 接收到最新達標日查詢請求...');
  try {
    const page = browserManager.getPage();
    const latestDate = await queryLatestAchievementDate(page);

    if (!latestDate) {
      return res.status(404).json({ message: 'No achievement record found.' });
    }
    
    return res.status(200).json({ latestAchievementDate: latestDate });
  } catch (error) {
    logger.error(`[API] 達標日查詢失敗: ${error.message}`);
    return res.status(500).json({ error: 'Failed to query achievement data.', details: error.message });
  }
}