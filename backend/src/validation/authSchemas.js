import { z } from 'zod';

const email = z
  .string({ error: 'A valid email is required' })
  .trim()
  .pipe(z.email({ error: 'A valid email is required' }));

export const registerSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(80, 'Name must be at most 80 characters'),
  email,
  // bcrypt only uses the first 72 bytes of a password, so longer ones would
  // silently be truncated — reject them instead.
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(72, 'Password must be at most 72 characters'),
});

// No length rules on login: existing accounts may predate them, and a wrong
// password is simply a failed login.
export const loginSchema = z.object({
  email,
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});
