import express from 'express';
import {
  saveSubmission,
  regenerateSubmissionReview,
  getMySubmissions,
  getLeaderboard,
} from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { submissionLimiter } from '../middleware/rateLimiters.js';
import { submissionSchema } from '../validation/submissionSchemas.js';

const router = express.Router();

// Grading runs every hidden test on Judge0 plus an AI review, so both POSTs
// share a per-user budget (after `protect`, which sets req.user).
const gradeRequest = [protect, submissionLimiter, validate({ body: submissionSchema })];

// Only logged in users (protect) can save a score or view their history!
router.route('/leaderboard').get(protect, getLeaderboard); // naya cheez bnaya before making leaderboard page
router.route('/review').post(...gradeRequest, regenerateSubmissionReview);
router.route('/').post(...gradeRequest, saveSubmission);
router.route('/history').get(protect, getMySubmissions);

export default router;
