// Named import: the default export resolves differently under Vercel's builder than under local tsc
import { rateLimit } from 'express-rate-limit';
import type { Request } from 'express';
import { env } from '../configs/env.js';

const skip = () => env.NODE_ENV === 'test';

// Brute-force protection for login/register (per IP)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip,
    message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

// Each guest account carries free credits, so creating them is tightly limited per IP
export const guestLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip,
    message: { message: 'Too many guest sessions from this network. Please sign up for a free account instead.' },
});

// Image generation is slow and costs money; cap bursts per account (runs after `protect`)
export const generateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 3,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip,
    keyGenerator: (req: Request) => req.session.userId!,
    message: { message: 'You are generating too fast. Please wait a minute.' },
});
