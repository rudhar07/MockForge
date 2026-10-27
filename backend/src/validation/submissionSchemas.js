import { z } from 'zod';

// One answer per question: MCQs send `selectedOption`, code questions send `code`.
const responseSchema = z.object({
  questionId: z.string({ error: 'Each response needs a questionId' }).max(64),
  selectedOption: z.string().max(500).optional(),
  code: z.string().max(50_000).optional(),
});

// Shared by POST /api/submissions and POST /api/submissions/review.
export const submissionSchema = z.object({
  topic: z.string({ error: 'Topic is required' }).trim().min(1, 'Topic is required').max(50),
  responses: z
    .array(responseSchema, { error: 'Responses must be an array' })
    .max(200)
    .default([]),
  flaggedQuestionIds: z
    .array(z.string().max(64), { error: 'Flagged question ids must be an array' })
    .max(200)
    .default([]),
});
