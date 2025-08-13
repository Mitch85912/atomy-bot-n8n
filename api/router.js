// --- START OF MODIFIED FILE router.js ---

import { Router } from 'express';
// ★ 移除 getLatestAchievement 的 import ★
import { getPvReport, updateAndStoreAchievementDate } from './controller.js';

const router = Router();

// PV 查詢路由
router.get('/pv', getPvReport); 

// ★ 移除不再需要的路由 (GET /api/achievement/latest) ★

// 觸發「更新並儲存」最新達標日的端點
router.post('/achievement/update', updateAndStoreAchievementDate);



export const apiRouter = router;
// --- END OF MODIFIED FILE router.js ---