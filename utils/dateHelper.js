/**
 * 日期處理工具，負責解析使用者傳來的各種日期指令。
 */
export const dateHelper = {
  /**
   * 解析使用者輸入的文字，轉換成日期區間。
   * @param {string} text - 來自 LINE 的使用者訊息，例如 "0815" 或 "上半個月"
   * @returns {{startDate: string, endDate: string} | null} - 返回 YYYY-MM-DD 格式的物件，若無法解析則返回 null
   */
  parse(text) {
    const trimmedText = text.trim();
    const now = new Date();
    const year = now.getFullYear();

    // 格式 1: "上半個月"
    if (trimmedText === '上半個月') {
      const firstDay = new Date(year, now.getMonth(), 1);
      const fifteenthDay = new Date(year, now.getMonth(), 15);
      return {
        startDate: this.formatDate(firstDay),
        endDate: this.formatDate(fifteenthDay),
      };
    }

    // 格式 2: "下半個月"
    if (trimmedText === '下半個月') {
      const sixteenthDay = new Date(year, now.getMonth(), 16);
      const lastDay = new Date(year, now.getMonth() + 1, 0); // 取下個月的第 0 天，即為本月最後一天
      return {
        startDate: this.formatDate(sixteenthDay),
        endDate: this.formatDate(lastDay),
      };
    }

    // 格式 3: "MMDD MMDD" (例如 "0801 0815")
    const rangeMatch = trimmedText.match(/^(\d{4})\s+(\d{4})$/);
    if (rangeMatch) {
      const startStr = rangeMatch[1];
      const endStr = rangeMatch[2];
      const startDate = this.parseMMDD(startStr, year);
      const endDate = this.parseMMDD(endStr, year);
      if (startDate && endDate && startDate <= endDate) {
        return {
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
        };
      }
    }

    // 格式 4: "MMDD" (例如 "0815")
    const singleMatch = trimmedText.match(/^(\d{4})$/);
    if (singleMatch) {
      const dateStr = singleMatch[1];
      const date = this.parseMMDD(dateStr, year);
      if (date) {
        const formattedDate = this.formatDate(date);
        return {
          startDate: formattedDate,
          endDate: formattedDate,
        };
      }
    }

    // 如果所有格式都不匹配，返回 null
    return null;
  },

  /**
   * 將 MMDD 格式的字串轉換成 Date 物件
   * @private
   * @param {string} mmdd - "0815"
   * @param {number} year - 當前年份
   * @returns {Date | null}
   */
  parseMMDD(mmdd, year) {
    const month = parseInt(mmdd.substring(0, 2), 10);
    const day = parseInt(mmdd.substring(2, 4), 10);
    
    // 簡單的有效性驗證
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    // JavaScript 的月份是從 0 開始的，所以要 -1
    return new Date(year, month - 1, day);
  },

  /**
   * 將 Date 物件格式化為 "YYYY-MM-DD" 字串
   * Atomy 查詢頁面需要的是 "YYYYMMDD"，但我們先產生標準格式，在查詢時再做轉換。
   * @private
   * @param {Date} date - Date 物件
   * @returns {string} - "YYYY-MM-DD"
   */
  formatDate(date) {
    const year = date.getFullYear();
    // getMonth() 回傳 0-11，所以要 +1。padStart 確保月份和日期是兩位數。
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
};