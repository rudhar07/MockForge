import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// When someone sends a POST request to '/register', trigger registerUser function
router.post('/register', registerUser);

// When someone sends a POST request to '/login', trigger loginUser function
router.post('/login', loginUser);

export default router;
