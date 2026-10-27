import express from 'express';
import { runCode } from '../controllers/executeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { runCodeSchema } from '../validation/executeSchemas.js';

const router = express.Router();

router.route('/run').post(protect, validate({ body: runCodeSchema }), runCode);

export default router;
