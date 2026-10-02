import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

let client: GoogleGenAI | null = null;

// Created on first use, so the server can run without a Gemini key when another provider is selected
export const getGemini = () => {
    client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    return client;
};
