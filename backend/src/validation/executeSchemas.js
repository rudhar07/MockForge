import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../services/codeExecutor.js';

export const runCodeSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, {
    error: `language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
  }),
  // Hard cap on size — a runaway client shouldn't be able to ship megabytes
  // of code to the execution service.
  code: z
    .string({ error: 'code must be a non-empty string' })
    .refine((code) => code.trim().length > 0, 'code must be a non-empty string')
    .refine((code) => code.length <= 50_000, 'code exceeds 50KB limit'),
  stdin: z.string({ error: 'stdin must be a string' }).max(10_000).default(''),
});
