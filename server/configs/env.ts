import 'dotenv/config';
import { z } from 'zod';

// Validate environment variables once at startup so a missing key fails fast
// with a clear message instead of crashing on the first request.
const EnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
    SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters'),
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
    // Flash is faster and much cheaper per image; set gemini-3-pro-image-preview for top quality
    GEMINI_IMAGE_MODEL: z.string().default('gemini-2.5-flash-image'),
    CLOUDINARY_URL: z.string().startsWith('cloudinary://', 'CLOUDINARY_URL must look like cloudinary://key:secret@cloud'),
    // Comma-separated list of allowed frontend origins
    CLIENT_URL: z.string().default('http://localhost:5173'),
    // Generations each new account gets; protects the paid Gemini key on a public demo
    FREE_CREDITS: z.coerce.number().int().min(0).default(5),
    // Credits for one-click guest accounts (lets recruiters/visitors try the app without signing up)
    GUEST_CREDITS: z.coerce.number().int().min(0).default(2),
    // Hard cap on generations across ALL users per UTC day; bounds the worst-case Gemini bill
    DAILY_GENERATION_LIMIT: z.coerce.number().int().min(0).default(50),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error('Invalid environment configuration. See server/.env.example');
}

export const env = {
    ...parsed.data,
    isProduction: parsed.data.NODE_ENV === 'production',
    clientOrigins: parsed.data.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean),
};
