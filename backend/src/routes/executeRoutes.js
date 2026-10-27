import express from 'express';
import { runCode } from '../controllers/executeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { executeLimiter } from '../middleware/rateLimiters.js';
import { runCodeSchema } from '../validation/executeSchemas.js';

const router = express.Router();

// executeLimiter counts per user, so it must come after `protect` sets req.user.
router.route('/run').post(protect, executeLimiter, validate({ body: runCodeSchema }), runCode);

export default router;
