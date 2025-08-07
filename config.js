import 'dotenv/config';

export const config = {
  // 環境設定
  nodeEnv: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,

  // Atomy 登入資訊
  atomy: {
    id: process.env.ATOMY_ID,
    password: process.env.ATOMY_PASSWORD,
    urls: {
      login: 'https://tw.atomy.com/login', // 這是推測的，真實登入頁可能是 https://tw.atomy.com/
      lowerSales: 'https://tw.atomy.com/myoffice/mySales/lowerSales',
    },
  },

  // LINE Bot 設定
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
    adminUserId: process.env.LINE_ADMIN_USER_ID,
  },

  // Playwright 設定
  playwright: {
    launchOptions: {
      headless: process.env.NODE_ENV === 'development' ? false : true,
      slowMo: 50,
    },
  },

  // 系統訊息文案
  messages: {
    querying: '好的，正在為您查詢中，請稍候...',
    invalidCommand: `無法辨識您的指令，請輸入以下格式：
- MMDD (例如 0801)
- MMDD MMDD (例如 0801 0815)
- 上半個月
- 下半個月`,
    queryFailed: '查詢失敗，請稍後再試或聯繫管理員。',
    loginFailedNotification: '【Atomy Bot 緊急通知】\n系統自動登入 Atomy 失敗，請檢查帳號密碼或網站狀態。',
  },

  // 重試機制設定
  retry: {
    loginAttempts: 3,
    delay: 5000, // 5秒
  },
};
