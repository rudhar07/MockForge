import mongoose from 'mongoose';
import { ZodError } from 'zod';
import HttpError from '../utils/HttpError.js';

// Unknown /api/* routes get a JSON 404 instead of Express's default HTML page
// (or, in production, the React app's index.html).
export const notFound = (req, res, next) => {
  next(new HttpError(404, `Not found: ${req.method} ${req.originalUrl}`));
};

// Every error in the app ends up here — thrown in a controller, rejected from
// an async handler (Express 5 forwards those automatically), or passed via
// next(err). Expected problems map to 4xx with a safe message; anything else
// is a bug, so it's logged and the client gets a generic 500.
// Express recognises error middleware by its four arguments, so `next` must
// stay in the signature even though it's unused.
export const errorHandler = (err, req, res, next) => {
  // Request failed our zod schema (see middleware/validate.js).
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: err.issues[0].message,
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  // Mongoose schema rules (e.g. "Code questions require at least one test case.").
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    return res.status(400).json({ message: errors[0].message, errors });
  }

  // A value that can't be cast to the schema type, e.g. "abc" as an ObjectId.
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid ${err.path}` });
  }

  // express.json() couldn't parse the body, or it was over the size limit.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // Anything else is unexpected. Log the full error for us; never send stack
  // traces or internal messages to clients in production.
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  return res.status(500).json({ message });
};
