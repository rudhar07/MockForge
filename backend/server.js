import express from 'express';
import dotenv from 'dotenv';
import submissionRoutes from './src/routes/submissionRoutes.js';
import cors from 'cors';
import connectDB from './src/config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';
import executeRoutes from './src/routes/executeRoutes.js';

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// Lightweight health check for uptime pings (keeps Render's free tier warm).
// No DB call — we don't want a keep-alive ping to spend Mongo/Atlas ops.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/execute', executeRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(frontendPath));

  // All non-API routes return the React app
  app.get('/{*any}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('MockForge API is running...');
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
