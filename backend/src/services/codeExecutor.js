// Wraps the Judge0 CE code-execution API via RapidAPI
// (https://rapidapi.com/judge0-official/api/judge0-ce).
//
// Why Judge0 and not Piston?
//   - Piston's public endpoint went whitelist-only on 2026-02-15. Judge0 on
//     RapidAPI is the closest like-for-like replacement that's still freely
//     accessible (50 calls/day free tier — enough for portfolio scale).
//   - Judge0 keeps all languages permanently warm; no per-language cold-start
//     cost as we'd hit self-hosting Piston on Render free tier.
//
// The whole point of this file is to hide engine specifics — the rest of the
// app keeps consuming `executeCode({language, code, stdin})` and gets back
// the same normalized shape regardless of what's under the hood.

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com';

// Map our internal language names to Judge0 CE numeric language_ids.
// These IDs are stable in Judge0 CE; the version comments are FYI.
const LANGUAGE_IDS = {
  python: 71,       // Python 3.8.1
  javascript: 63,   // JavaScript (Node.js 12.14.0)
  cpp: 54,          // C++ (GCC 9.2.0)
  java: 62,         // Java (OpenJDK 13.0.1)
  c: 50,            // C (GCC 9.2.0)
};

// Judge0 status.id meanings — we normalize these to our own status strings
// so the rest of the app doesn't deal with Judge0 vocabulary.
// Full table: https://github.com/judge0/judge0/blob/master/docs/api/STATUSES.md
const STATUS_MAP = {
  3: 'success',          // Accepted
  5: 'timeout',          // Time Limit Exceeded
  6: 'compile_error',    // Compilation Error
  7: 'runtime_error',    // Runtime Error (SIGSEGV)
  8: 'runtime_error',    // Runtime Error (SIGXFSZ)
  9: 'runtime_error',    // Runtime Error (SIGFPE)
  10: 'runtime_error',   // Runtime Error (SIGABRT)
  11: 'runtime_error',   // Runtime Error (NZEC)
  12: 'runtime_error',   // Runtime Error (Other)
  13: 'error',           // Internal Error
  14: 'error',           // Exec Format Error
};

const RUN_TIMEOUT_S = 3;     // Judge0 expects seconds for cpu_time_limit
const WALL_TIMEOUT_S = 5;    // Hard wallclock cap including I/O setup

/**
 * Execute a snippet of code against optional stdin.
 * Signature is unchanged from the Piston-backed version; this is the whole
 * reason we split execution into a service layer back in Phase 2.
 *
 * @returns {Promise<{
 *   status: 'success' | 'runtime_error' | 'compile_error' | 'timeout' | 'error',
 *   stdout: string,
 *   stderr: string,
 *   exitCode: number | null,
 *   runtimeMs: number,
 *   message: string,
 * }>}
 */
export const executeCode = async ({ language, code, stdin = '' }) => {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      exitCode: null,
      runtimeMs: 0,
      message: `Unsupported language: ${language}`,
    };
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      exitCode: null,
      runtimeMs: 0,
      message: 'RAPIDAPI_KEY is not configured on the server.',
    };
  }

  const startedAt = Date.now();

  try {
    // `wait=true` makes Judge0 hold the connection until the result is ready
    // (synchronous mode). The async alternative requires a poll-loop; for
    // ~1-second compute jobs the wait mode is simpler and equivalent.
    //
    // `base64_encoded=false` keeps stdout/stderr/source_code as plain text
    // so we don't have to encode/decode on every call.
    const url = `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true&fields=stdout,stderr,status,time,memory,compile_output,exit_code,message`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin,
        cpu_time_limit: RUN_TIMEOUT_S,
        wall_time_limit: WALL_TIMEOUT_S,
      }),
    });

    if (!response.ok) {
      // 429 typically = daily quota exhausted on the free RapidAPI plan.
      // 401/403 = API key invalid or subscription lapsed.
      return {
        status: 'error',
        stdout: '',
        stderr: '',
        exitCode: null,
        runtimeMs: Date.now() - startedAt,
        message:
          response.status === 429
            ? 'Daily code execution quota exhausted. Try again tomorrow.'
            : response.status === 401 || response.status === 403
              ? 'Code execution service rejected our API key.'
              : `Code execution service returned ${response.status}.`,
      };
    }

    const data = await response.json();
    const runtimeMs = Date.now() - startedAt;

    const judge0StatusId = data?.status?.id;
    const normalized = STATUS_MAP[judge0StatusId] ?? 'error';

    // Judge0 separates compilation errors from program output. For our
    // shape, surface compile errors as stderr so the UI can display them
    // the same way as runtime errors.
    const stderr =
      normalized === 'compile_error'
        ? (data.compile_output || data.stderr || '')
        : (data.stderr || '');

    return {
      status: normalized,
      stdout: data.stdout || '',
      stderr,
      exitCode: typeof data.exit_code === 'number' ? data.exit_code : null,
      // Judge0's `time` is a string in seconds (e.g. "0.014"). Convert to ms.
      runtimeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : runtimeMs,
      message: normalized === 'success' ? '' : (data?.status?.description || ''),
    };
  } catch (error) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      exitCode: null,
      runtimeMs: Date.now() - startedAt,
      message: error.message || 'Failed to reach code execution service.',
    };
  }
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);
