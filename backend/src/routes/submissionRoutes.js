import express from 'express';
import { saveSubmission, getMySubmissions , getLeaderboard } from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only logged in users (protect) can save a score or view their history!
router.route('/leaderboard').get(protect, getLeaderboard); // naya cheez bnaya before making leaderboard page
router.route('/').post(protect, saveSubmission);
router.route('/history').get(protect, getMySubmissions);

export default router;
