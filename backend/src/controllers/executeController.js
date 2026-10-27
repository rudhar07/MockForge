import { executeCode } from '../services/codeExecutor.js';

// @desc    Run user-submitted code with optional stdin (for the "Run Code"
//          button inside an interview — not for scoring).
// @route   POST /api/execute/run
// @access  Private (logged-in users only)
// The body is validated by `validate(runCodeSchema)` in executeRoutes.js.
export const runCode = async (req, res) => {
  const { language, code, stdin } = req.body;

  const result = await executeCode({ language, code, stdin });

  // Always return 200: the *HTTP call* succeeded even if the user's code failed.
  // The client looks at result.status to render success/error UX.
  res.json(result);
};
