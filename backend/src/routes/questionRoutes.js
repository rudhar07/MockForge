import express from 'express';
import { 
  getQuestions, 
  getQuestionsByTopic, 
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// The '/' here means the exact URL we define in server.js (which will be /api/questions)
// Notice how we stack middleware: `protect` (must be logged in) -> `admin` (must be admin) -> `createQuestion`
router.route('/')
  .get(protect, getQuestions)                  // Any logged-in user can GET
  .post(protect, admin, createQuestion);       // ONLY Admins can POST

// Get questions by a specific topic
router.route('/topic/:topic').get(protect, getQuestionsByTopic);

router.route('/:id')
  .get(protect, admin, getQuestionById)
  .put(protect, admin, updateQuestion)
  .delete(protect, admin, deleteQuestion);

export default router;
