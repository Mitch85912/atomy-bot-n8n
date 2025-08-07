/**
 * 【最終彈性版本】Flex Message 產生器
 */

const PV_TARGET = 300000;

/**
 * 產生 PV 儀表板風格的 Flex Message (通用版)
 * @param {object} data
 * @param {string} data.title - 卡片的主標題, e.g., "📊 PV 查詢結果"
 * @param {string} data.dateRangeText - 顯示的日期區間文字
 * @param {number} data.leftPV - 左區 PV
 * @param {number} data.rightPV - 右區 PV
 * @param {string | null} data.achievementDate - 最近達標日
 * @returns {import('@line/bot-sdk').FlexMessage}
 */
export function createPvDashboardMessage(data) {
  // 為所有輸入數據提供後備值，防止 null 或 undefined
  const title = data.title || '📊 PV 報告'; // 新增標題的後備值
  const dateRangeText = data.dateRangeText || 'N/A';
  const leftPV = data.leftPV || 0;
  const rightPV = data.rightPV || 0;
  const achievementDate = data.achievementDate || '無記錄';

  const leftRatio = Math.min(100, Math.floor((leftPV / PV_TARGET) * 100));
  const rightRatio = Math.min(100, Math.floor((rightPV / PV_TARGET) * 100));
  const rightColor = rightPV >= PV_TARGET ? '#27AE60' : '#5E87E1';

  return {
    type: "flex",
    altText: `PV報告: 左 ${leftPV.toLocaleString()} | 右 ${rightPV.toLocaleString()}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: title, // ★★★ 核心修改點 1：使用傳入的 title ★★★
            weight: "bold",
            size: "lg",
            color: "#1A5276",
          },
          {
            type: "text",
            text: dateRangeText,
            size: "sm",
            color: "#666666",
          },
          {
            type: "separator",
            margin: "md"
          },
          createPvBlock('🔵 左區', leftPV, leftRatio, '#5E87E1'), // 這邊的 rightRatio 應該是 leftRatio
          {
            type: "separator",
            margin: "md"
          },
          createPvBlock('🟢 右區', rightPV, rightRatio, rightColor),
          {
            type: "separator",
            margin: "md"
          },
          // 只有在 achievementDate 有值時才顯示這個區塊
          ...(achievementDate !== '無記錄' ? [{
              type: "box",
              layout: "horizontal",
              margin: "md",
              contents: [
                  {
                      type: "text",
                      text: "🏆 最近達標日:",
                      size: "sm",
                      color: "#555555",
                      flex: 0,
                  },
                  {
                      type: "text",
                      text: achievementDate,
                      size: "sm",
                      color: "#111111",
                      align: "end",
                  }
              ]
          }] : []) // ★★★ 核心修改點 2：動態顯示達標日 ★★★
        ]
      }
    }
  };
}


/**
 * 輔助函式：建立單個 PV 顯示區塊 (包含進度條)
 */
function createPvBlock(title, pv, ratio, color) {
    // ★★★ 核心修改點 3：修正複製貼上的錯誤 ★★★
  return {
    type: "box",
    layout: "vertical",
    margin: "lg",
    spacing: "sm",
    contents: [
      {
        type: "box",
        layout: "baseline",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: title,
            color: "#666666",
            size: "sm",
            flex: 2,
          },
          {
            type: "text",
            text: `${(pv || 0).toLocaleString()} / ${PV_TARGET.toLocaleString()}`,
            wrap: true,
            color: "#2C3E50",
            size: "md",
            weight: "bold",
            flex: 5,
            align: "end",
          }
        ]
      },
      {
        type: "box",
        layout: "vertical",
        margin: "sm",
        height: "8px",
        backgroundColor: "#E5E7E9",
        cornerRadius: "4px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            height: "100%",
            width: `${ratio}%`,
            backgroundColor: color,
            cornerRadius: "4px",
            contents: []
          }
        ]
      }
    ]
  };
}