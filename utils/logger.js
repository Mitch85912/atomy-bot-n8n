/**
 * 簡單的日誌記錄器，附帶時間戳和日誌級別
 * 讓我們清楚地知道程式在做什麼
 */
const getTimestamp = () => new Date().toLocaleString('sv-SE'); // 'sv-SE' 格式為 YYYY-MM-DD HH:mm:ss

export const logger = {
  /**
   * 記錄一般資訊
   * @param {string} message 
   */
  info(message) {
    console.log(`[${getTimestamp()}] [INFO] ${message}`);
  },

  /**
   * 記錄警告資訊
   * @param {string} message 
   */
  warn(message) {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`);
  },

  /**
   * 記錄錯誤資訊
   * @param {string} message 
   */
  error(message) {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`);
  },
};