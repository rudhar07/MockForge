// Wraps the Piston public code-execution API (https://github.com/engineer-man/piston).
// Piston is free, no API key, runs code in a sandboxed Docker container, and
// supports 60+ languages. We hide all Piston-specific details inside this file
// so the rest of the app can stay agnostic of the execution engine.

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

// Hardcoded language → Piston runtime version map.
// We pin versions so behavior is reproducible — Piston supports multiple
// versions per language and picks "latest" if you don't specify, which can
// change under us silently.
const LANGUAGE_VERSIONS = {
  python: '3.10.0',
  javascript: '18.15.0', // Piston uses 'javascript' for Node
  cpp: '10.2.0',
  java: '15.0.2',
  c: '10.2.0',
};

// Per-run safety limits. Piston enforces its own ceilings, but we send these
// to make timeouts predictable and prevent a single malicious submission from
// pegging Piston's queue.
const COMPILE_TIMEOUT_MS = 10_000; // 10s — gives C++/Java enough to compile
const RUN_TIMEOUT_MS = 3_000;      // 3s — typical DSA solutions finish in <100ms

/**
 * Execute a snippet of code against optional stdin.
 * @param {object} params
 * @param {string} params.language  One of the keys in LANGUAGE_VERSIONS.
 * @param {string} params.code      Full source file contents.
 * @param {string} [params.stdin]   Input piped to the program's stdin.
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
  const version = LANGUAGE_VERSIONS[language];
  if (!version) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      exitCode: null,
      runtimeMs: 0,
      message: `Unsupported language: ${language}`,
    };
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(PISTON_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version,
        files: [{ content: code }],
        stdin,
        compile_timeout: COMPILE_TIMEOUT_MS,
        run_timeout: RUN_TIMEOUT_MS,
      }),
    });

    if (!response.ok) {
      // 429 = rate limited by Piston (~200 req/5min on the free tier).
      // 5xx = Piston down. Surface a clean message; don't leak HTTP details.
      return {
        status: 'error',
        stdout: '',
        stderr: '',
        exitCode: null,
        runtimeMs: Date.now() - startedAt,
        message:
          response.status === 429
            ? 'Code execution is busy. Please try again in a moment.'
            : `Code execution service returned ${response.status}.`,
      };
    }

    const data = await response.json();
    const runtimeMs = Date.now() - startedAt;

    // Piston response shape:
    //   { compile?: { stdout, stderr, code, signal, output },
    //     run:      { stdout, stderr, code, signal, output } }
    // `compile` only exists for compiled languages (C, C++, Java).
    const compile = data.compile;
    const run = data.run || {};

    // Compile failures: non-zero compile.code means the program never ran.
    if (compile && compile.code !== 0) {
      return {
        status: 'compile_error',
        stdout: '',
        stderr: compile.stderr || compile.output || 'Compile failed.',
        exitCode: compile.code,
        runtimeMs,
        message: 'Compilation failed.',
      };
    }

    // Piston signals SIGKILL when our run_timeout fires.
    if (run.signal === 'SIGKILL') {
      return {
        status: 'timeout',
        stdout: run.stdout || '',
        stderr: run.stderr || '',
        exitCode: run.code,
        runtimeMs,
        message: `Execution exceeded ${RUN_TIMEOUT_MS}ms.`,
      };
    }

    if (run.code !== 0) {
      return {
        status: 'runtime_error',
        stdout: run.stdout || '',
        stderr: run.stderr || run.output || '',
        exitCode: run.code,
        runtimeMs,
        message: 'Program exited with a non-zero status.',
      };
    }

    return {
      status: 'success',
      stdout: run.stdout || '',
      stderr: run.stderr || '',
      exitCode: run.code,
      runtimeMs,
      message: '',
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

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_VERSIONS);
