import { z } from 'zod';
import { ASPECT_RATIOS, COLOR_SCHEMES, THUMBNAIL_STYLES } from '../models/Thumbnail.js';

const email = z.string().trim().toLowerCase().email('Please enter a valid email');

export const registerSchema = z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name is too long'),
    email,
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(72, 'Password is too long') // bcrypt only uses the first 72 bytes
        .regex(/[A-Za-z]/, 'Password must contain a letter')
        .regex(/[0-9]/, 'Password must contain a number'),
});

export const loginSchema = z.object({
    email,
    password: z.string().min(1, 'Password is required'),
});

export const generateSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    prompt: z.string().trim().max(500, 'Additional details must be 500 characters or less').optional().default(''),
    style: z.enum(THUMBNAIL_STYLES, { message: 'Please choose a valid style' }),
    aspect_ratio: z.enum(ASPECT_RATIOS).default('16:9'),
    color_scheme: z.enum(COLOR_SCHEMES).optional(),
    text_overlay: z.boolean().default(true),
});

export type GenerateInput = z.infer<typeof generateSchema>;
