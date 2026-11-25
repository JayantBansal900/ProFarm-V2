import { z } from 'zod';

// Core field shapes (also used directly by controllers for type inference)
export const registerBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
});

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Wrapped for validateRequest middleware (which parses {body, query, params})
export const registerSchema = z.object({ body: registerBodySchema });
export const loginSchema = z.object({ body: loginBodySchema });

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;

// ---------------------------------------------------------------------------
// Two-step verification
// ---------------------------------------------------------------------------

// A 6-digit authenticator code or a backup code like "abcde-fghjk".
const secondFactorCode = z
  .string()
  .trim()
  .min(6, 'Enter the 6-digit code or a backup code')
  .max(20, 'Enter the 6-digit code or a backup code');

export const mfaLoginSchema = z.object({
  body: z.object({
    challengeToken: z.string().regex(/^[a-f0-9]{64}$/, 'Sign-in session is not valid'),
    code: secondFactorCode,
  }),
});

export const mfaCodeSchema = z.object({ body: z.object({ code: secondFactorCode }) });

export const mfaDisableSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required').max(128),
    code: secondFactorCode,
  }),
});
