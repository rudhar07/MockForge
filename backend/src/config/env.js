import { z } from 'zod';

// Settings the server cannot work without. Checked once at startup so a
// missing value stops the boot with a clear message, instead of the server
// looking healthy while every login fails.
const envSchema = z.object({
  MONGO_URI: z
    .string({ error: 'MONGO_URI is required' })
    .regex(/^mongodb(\+srv)?:\/\//, 'MONGO_URI must start with mongodb:// or mongodb+srv://'),
  JWT_SECRET: z.string({ error: 'JWT_SECRET is required' }).min(1, 'JWT_SECRET is required'),
});

// Optional settings: the app runs without them, with a feature switched off.
const OPTIONAL = {
  RAPIDAPI_KEY: 'code execution (Judge0) is disabled',
  OPENROUTER_API_KEY: 'AI review is disabled',
};

// Returns { warnings } when the environment is usable, throws otherwise.
export const validateEnv = (env = process.env) => {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `  - ${issue.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  const warnings = Object.entries(OPTIONAL)
    .filter(([key]) => !env[key])
    .map(([key, effect]) => `${key} is not set — ${effect}`);

  // Only a warning: a hard length rule could stop an already-deployed server
  // whose secret we can't see from here.
  if (env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is shorter than 32 characters — use a long random value');
  }

  return { warnings };
};
