import { Router } from 'express';
import { getPvReport, getLatestAchievement } from './controller.js';

const router = Router();

// 定義我們的 API 端點
// GET /api/pv?query=0801
// GET /api/pv?query=上半個月
router.get('/pv', getPvReport); 

// GET /api/achievement/latest
router.get('/achievement/latest', getLatestAchievement);

// 未來可以擴充訂購 API
// POST /api/order
// router.post('/order', createOrder);

export const apiRouter = router;