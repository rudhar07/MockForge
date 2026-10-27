import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiters.js';
import { registerSchema, loginSchema } from '../validation/authSchemas.js';

const router = express.Router();

// When someone sends a POST request to '/register', rate-limit, check the body, then trigger registerUser
router.post('/register', registerLimiter, validate({ body: registerSchema }), registerUser);

// When someone sends a POST request to '/login', rate-limit, check the body, then trigger loginUser
router.post('/login', loginLimiter, validate({ body: loginSchema }), loginUser);

export default router;
