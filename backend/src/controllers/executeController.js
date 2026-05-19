import { executeCode, SUPPORTED_LANGUAGES } from '../services/codeExecutor.js';

// @desc    Run user-submitted code with optional stdin (for the "Run Code"
//          button inside an interview — not for scoring).
// @route   POST /api/execute/run
// @access  Private (logged-in users only)
export const runCode = async (req, res) => {
  const { language, code, stdin = '' } = req.body || {};

  if (!language || !SUPPORTED_LANGUAGES.includes(language)) {
    return res.status(400).json({
      message: `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
    });
  }

  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({ message: 'code must be a non-empty string' });
  }

  // Hard cap on payload size — Piston accepts up to ~64KB but a runaway
  // client shouldn't be able to ship megabytes of code at us either.
  if (code.length > 50_000) {
    return res.status(413).json({ message: 'code exceeds 50KB limit' });
  }

  if (typeof stdin !== 'string') {
    return res.status(400).json({ message: 'stdin must be a string' });
  }

  const result = await executeCode({ language, code, stdin });

  // Always return 200: the *HTTP call* succeeded even if the user's code failed.
  // The client looks at result.status to render success/error UX.
  res.json(result);
};
