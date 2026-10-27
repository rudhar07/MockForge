import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import executeRoutes from './routes/executeRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiters.js';

// Builds the Express app without side effects (no DB connection, no listening
// port) so tests can import it and drive it with Supertest. server.js is the
// entry point that actually connects and listens.
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Render, requests reach us through a proxy, so the socket address is the
// proxy's — the same for every visitor. Trusting one proxy hop makes req.ip
// the real client address (from X-Forwarded-For), which the per-IP rate
// limits depend on. Override with TRUST_PROXY if the hosting setup changes.
// `||` (not `??`) so an empty TRUST_PROXY= from .env.example also means 1.
app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));

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

// API Routes (all share one per-IP request budget; /health above is exempt
// so uptime pings never count against it)
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/execute', executeRoutes);

// Any /api/* path that didn't match a route above.
app.use('/api', notFound);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  // This file lives in backend/src/, so the client build is two levels up.
  const frontendPath = path.join(__dirname, '..', '..', 'client', 'dist');
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

// Must be registered last so it catches errors from everything above.
app.use(errorHandler);

export default app;
