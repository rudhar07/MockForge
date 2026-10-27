import { z } from 'zod';
import { QUESTION_TYPES, TOPICS, DIFFICULTIES, LANGUAGES } from '../models/Questions.js';
import { idParams } from './common.js';

const oneOf = (field, values) =>
  z.enum(values, { error: `${field} must be one of: ${values.join(', ')}` });

const testCaseSchema = z.object({
  input: z.string().max(10_000).default(''),
  expectedOutput: z.string({ error: 'Each test case needs an expected output' }).max(10_000),
  isSample: z.boolean().default(false),
});

// Shape and size checks only. Rules that depend on the question type (an MCQ
// needs a correctAnswer, a code question needs test cases) already live in the
// Mongoose model, and its ValidationError is turned into a 400 as well.
// Used for both POST (create) and PUT (full replace).
export const questionSchema = z.object({
  title: z.string({ error: 'Title is required' }).trim().min(1, 'Title is required').max(200),
  description: z
    .string({ error: 'Description is required' })
    .trim()
    .min(1, 'Description is required')
    .max(10_000),
  type: oneOf('Type', QUESTION_TYPES),
  topic: oneOf('Topic', TOPICS),
  difficulty: oneOf('Difficulty', DIFFICULTIES),
  options: z.array(z.string().max(500)).max(10).optional(),
  correctAnswer: z.string().max(500).optional(),
  explanation: z.string().max(5_000).optional(),
  // The admin form may send marks as a string ("10"); coerce it to a number.
  marks: z.coerce.number().int().min(0).max(100).optional(),
  language: oneOf('Language', LANGUAGES).optional(),
  starterCode: z.string().max(50_000).optional(),
  testCases: z.array(testCaseSchema).max(50).optional(),
});

export const questionIdParams = idParams('question id');
