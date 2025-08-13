/**
 * 集中管理所有 Playwright 會用到的 CSS Selectors
 */
export const selectors = {
  // 登入頁面 (https://tw.atomy.com)
  loginPage: {
    usernameInput: '#login_id',
    passwordInput: '#login_pw', 
    loginButton: 'button[login-role="login-button"]',
  },

  // 登入成功後用於驗證的目標
  postLogin: {
    successUrl: '**/main',
  },

  // 下線購買明細頁 (https://tw.atomy.com/myoffice/mySales/lowerSales)
  salesPage: {
    dateStartInput: '#__fromDate__',
    dateEndInput: '#__toDate__',
    searchButton: 'button[calendar-role="search"]',
    firstHalfButton: 'button[calendar-period="before"]', 
    secondHalfButton: 'button[calendar-period="current"]',
    leftPVCell: '#llnSumPv',
    rightPVCell: '#rlnSumPv',
  },

  // 【新增的區塊】
  // 組織獎金頁面 (AllowSet)
  achievementPage: {
    // 整個表格的 tbody
    resultTableBody: '#paging-list .tbl-lst tbody',
    // 表格中的每一行
    tableRow: 'tr',
    // 每一行中的第一個 td (日期)
    dateCell: 'td:first-child .date',
    // 每一行中的最後一個 td (位階狀態)
    statusCell: 'td:last-child .ctx',
  },
};