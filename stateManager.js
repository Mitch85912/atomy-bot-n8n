import fs from 'fs/promises';
import path from 'path';
import { logger } from './utils/logger.js';

const stateFilePath = path.join(process.cwd(), 'state.json');

const defaultState = {
  lastAchievementDate: null, // YYYY-MM-DD 格式
  isPvTrackingActive: false,
};

/**
 * 讀取目前的狀態
 * @returns {Promise<{lastAchievementDate: string | null, isPvTrackingActive: boolean}>}
 */
async function getState() {
  try {
    await fs.access(stateFilePath);
    const data = await fs.readFile(stateFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    logger.warn(`狀態檔 state.json 不存在或讀取失敗，將使用預設狀態。`);
    // 如果檔案不存在，用預設值初始化
    await fs.writeFile(stateFilePath, JSON.stringify(defaultState, null, 2));
    return defaultState;
  }
}

/**
 * 寫入新的狀態
 * @param {object} newState
 */
async function setState(newState) {
  try {
    const currentState = await getState();
    const updatedState = { ...currentState, ...newState };
    await fs.writeFile(stateFilePath, JSON.stringify(updatedState, null, 2));
    logger.info(`狀態已更新: ${JSON.stringify(updatedState)}`);
  } catch (error) {
    logger.error(`寫入狀態檔 state.json 失敗: ${error}`);
  }
}

export const stateManager = {
  get: getState,
  set: setState,
};