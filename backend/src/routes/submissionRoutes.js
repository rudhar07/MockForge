import express from 'express';
import { saveSubmission, getMySubmissions } from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in users (protect) can save a score or view their history!
router.route('/').post(protect, saveSubmission);
router.route('/history').get(protect, getMySubmissions);

export default router;
