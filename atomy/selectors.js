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
  // (合併了舊的 successUrl 和新的 loggedInUser)
  postLogin: {
    successUrl: '**/main',
    loggedInUser: 'span[common-role="login_mbr_no"]',
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

  // 組織獎金頁面 (AllowSet)
  achievementPage: {
    resultTableBody: '#paging-list .tbl-lst tbody', // 整個表格的 tbody
    tableRow: 'tr', // 表格中的每一行
    dateCell: 'td:first-child .date', // 每一行中的第一個 td (日期)
    statusCell: 'td:last-child .ctx', // 每一行中的最後一個 td (位階狀態)
  },

  // ======================================================
  // 以下為購物流程新增的選擇器
  // ======================================================

  // 商城主頁與搜尋結果
  shopPage: {
    searchInput: '#hd_search',
    searchButton: 'button[search-role="btn"]',
    searchResultsContainer: 'ul.gdsList-wrap',
    searchResultItem: 'ul.gdsList-wrap > li',
    itemTitle: '.title',
    addToCartButton: '.bt_cart', // 點擊後可能會彈出選項
  },

  // 商品選項彈出視窗
  optionLayer: {
    optionButton: 'button[option-role="button"]', // 例如 "顏色"
    optionList: 'a[option-role="option"]', // 選項列表
    quantityInput: 'input[item-role="ord-qty"]',
    confirmAddToCartButton: 'button[buy-button="10"]', // 彈窗中的 "購物車" 按鈕
  },

  // 購物車頁面 (https://tw.atomy.com/cart/view)
  cartPage: {
    // 注意：網站沒有全選 checkbox，但有刪除按鈕
    deleteButton: 'button[checked-delete-button="10"]',
    confirmDeleteButton: 'button[layer-role="confirm-button"]', // 彈窗中的確認
    checkoutButton: 'div[cart-role="fxd-total-area"] button.sp', // 結帳按鈕
  },

  // 訂單填寫頁 (https://tw.atomy.com/order/sheet)
  orderSheetPage: {
    // 銷售日期 (這是一個函式，可以動態生成選擇器)
    salesDateRadio: (date) => `input[name="slt-date_rdo"][value="${date}"]`,

    // 訂購人資訊
    ordererName: '#psn-txt_0_0',
    ordererPhone: '#psn-txt_1_0',
    ordererEmailId: '#psn-txt_3',
    ordererEmailDomain: '#psn-txt_3_2',

    // 手機條碼載具
    invoiceCarrierLabel: 'label[for="inv-cid_0"]',
    invoiceCarrierInput: 'input[invoice-value="cid"]',

    // 配送資訊 (使用巢狀物件來組織)
    deliveryInfo: {
      // --- 現有地址 ---
      addressListContainer: 'div#dlvp_list',
      addressEntry: 'dl.lyr-address',
      addressName: 'dt > b',
      addressDetail: 'dd.addr',
      selectAddressLabel: 'label.chk-dlvp-selected',

      // --- 新增地址 ---
      addNewAddressButton: 'button#btnOrderDlvpReg',
      newAddressNameInput: '#dlvpNm',
      newAddressPhoneInput: '#cellNo',
      openAddressModalButton: 'button[data-owns="lyr_pay_post_region"]',
      citySelect: '#selectSiname',
      districtSelect: '#selectGuname',
      streetAddressInput: '#dtlAddr',
      confirmNewAddressButton: 'button#btnSubmit',

      // --- 配送至中心 ---
      sendToCenterButton: 'button[deli-form-button="30"]',
      centerReceiverNameInput: '#center-txt_0',
      centerReceiverPhoneInput: '#center-phone',
    },

    // 付款方式
    paymentMethod: {
      virtualAccountTab: 'button#mth-tab_1',
    },
  },

  // 訂單完成頁
  orderCompletePage: {
    successHeader: 'h2:has-text("訂單已完成!")',
  },
};