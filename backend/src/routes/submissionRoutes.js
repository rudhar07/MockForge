import express from 'express';
import {
  saveSubmission,
  regenerateSubmissionReview,
  getMySubmissions,
  getLeaderboard,
} from '../controllers/submissionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { submissionSchema } from '../validation/submissionSchemas.js';

const router = express.Router();

// Only logged in users (protect) can save a score or view their history!
router.route('/leaderboard').get(protect, getLeaderboard); // naya cheez bnaya before making leaderboard page
router.route('/review').post(protect, validate({ body: submissionSchema }), regenerateSubmissionReview);
router.route('/').post(protect, validate({ body: submissionSchema }), saveSubmission);
router.route('/history').get(protect, getMySubmissions);

export default router;
