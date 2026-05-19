import express from 'express';
import { runCode } from '../controllers/executeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/run').post(protect, runCode);

export default router;
