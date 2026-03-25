import express from 'express';
import dotenv from 'dotenv';
import submissionRoutes from './src/routes/submissionRoutes.js';
import cors from 'cors';
import connectDB from './src/config/db.js';

// 1. Import our new auth routes!
import authRoutes from './src/routes/authRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';


dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// 2. Main API Routes
app.use('/api/auth', authRoutes); 
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);


app.get('/', (req, res) => {
  res.send('MockForge API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
