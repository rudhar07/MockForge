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
import { validate } from '../middleware/validate.js';
import { questionSchema, questionIdParams } from '../validation/questionSchemas.js';

const router = express.Router();

// The '/' here means the exact URL we define in app.js (which will be /api/questions)
// Notice how we stack middleware: `protect` (must be logged in) -> `admin` (must be admin)
// -> `validate` (body must be a well-formed question) -> `createQuestion`
router.route('/')
  .get(protect, getQuestions)                  // Any logged-in user can GET
  .post(protect, admin, validate({ body: questionSchema }), createQuestion); // ONLY Admins can POST

// Get questions by a specific topic
router.route('/topic/:topic').get(protect, getQuestionsByTopic);

router.route('/:id')
  .get(protect, admin, validate({ params: questionIdParams }), getQuestionById)
  .put(protect, admin, validate({ params: questionIdParams, body: questionSchema }), updateQuestion)
  .delete(protect, admin, validate({ params: questionIdParams }), deleteQuestion);

export default router;
