import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validation/authSchemas.js';

const router = express.Router();

// When someone sends a POST request to '/register', check the body, then trigger registerUser
router.post('/register', validate({ body: registerSchema }), registerUser);

// When someone sends a POST request to '/login', check the body, then trigger loginUser
router.post('/login', validate({ body: loginSchema }), loginUser);

export default router;
