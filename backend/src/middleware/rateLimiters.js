import { rateLimit, MemoryStore } from 'express-rate-limit';

// Counters live in this process's memory. That's fine for a single Render
// instance; with several instances each would count separately, and a shared
// store (e.g. Redis) would be needed.
const stores = [];

const MINUTE = 60 * 1000;

const createLimiter = ({ windowMs, limit, message, ...options }) => {
  const store = new MemoryStore();
  stores.push(store);

  return rateLimit({
    windowMs,
    limit,
    store,
    // Send standard `RateLimit` / `RateLimit-Policy` headers so clients can
    // see their remaining budget; drop the old non-standard X-RateLimit-* ones.
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    // Same `{ message }` shape as every other error, so the UI can show it.
    handler: (req, res) => {
      console.warn(`Rate limit hit: ${req.method} ${req.originalUrl} key=${req.rateLimit.key}`);
      res.status(429).json({ message });
    },
    ...options,
  });
};

// Broad safety net for the whole API, per IP address.
export const apiLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 300,
  message: 'Too many requests. Please slow down and try again in a few minutes.',
});

// Brute-force protection: only *failed* logins count, so a user who types the
// right password is never locked out by earlier successful sessions.
export const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts. Please try again in 15 minutes.',
});

export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  message: 'Too many accounts created from this network. Please try again later.',
});

// The next two protect paid/quota-limited services (Judge0 allows ~50 calls a
// day on the free plan; each submission also runs every hidden test case and
// an AI review). They run after `protect`, so they count per user, not per IP.
const perUser = (req) => req.user._id.toString();

export const executeLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 20,
  keyGenerator: perUser,
  message: 'You are running code too often. Please wait a few minutes and try again.',
});

export const submissionLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  keyGenerator: perUser,
  message: 'Too many submissions. Please wait a few minutes and try again.',
});

// Lets tests start every case with fresh counters.
export const resetRateLimits = () => Promise.all(stores.map((store) => store.resetAll()));
