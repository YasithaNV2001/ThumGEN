import type { GenerateContentConfig } from '@google/genai';
import { getGemini } from '../configs/ai.js';
import cloudinary from '../configs/cloudinary.js';
import { env } from '../configs/env.js';
import type { GenerateInput } from '../validators/schemas.js';

export interface GeneratedImage {
    data: Buffer;
    mimeType: string;
}

type AspectRatio = GenerateInput['aspect_ratio'];

const stylePrompts: Record<GenerateInput['style'], string> = {
    'Bold & Graphic': 'eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style',
    'Tech/Futuristic': 'futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere',
    'Minimalist': 'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point',
    'Photorealistic': 'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',
    'Illustrated': 'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
};

const colorSchemeDescriptions: Record<NonNullable<GenerateInput['color_scheme']>, string> = {
    vibrant: 'vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette',
    sunset: 'warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow',
    forest: 'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',
    neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
    purple: 'purple-dominant color palette, magenta and violet tones, modern and stylish mood',
    monochrome: 'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',
    ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
    pastel: 'soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic',
};

export const buildPrompt = (input: GenerateInput): string => {
    const parts = [`Create a ${stylePrompts[input.style]} for: "${input.title}".`];

    if (input.color_scheme) {
        parts.push(`Use a ${colorSchemeDescriptions[input.color_scheme]} color scheme.`);
    }
    parts.push(input.text_overlay
        ? `Include the title text "${input.title}" as large, bold, highly legible overlay text.`
        : 'Do not include any text in the image.');
    if (input.prompt) {
        parts.push(`Additional details: ${input.prompt}.`);
    }
    parts.push(`The thumbnail should be in ${input.aspect_ratio} aspect ratio, visually stunning, and designed to maximize click-through rates. Make it bold, professional, and impossible to ignore.`);

    return parts.join(' ');
};

// Identify the format from the file's magic bytes (providers return PNG or JPEG)
const detectMimeType = (data: Buffer) => (data[0] === 0xff && data[1] === 0xd8 ? 'image/jpeg' : 'image/png');

const generateWithGemini = async (prompt: string, aspectRatio: AspectRatio): Promise<GeneratedImage> => {
    const config: GenerateContentConfig = {
        temperature: 1,
        topP: 0.95,
        responseModalities: ['IMAGE'],
        imageConfig: {
            aspectRatio,
            // imageSize is not supported by the legacy 2.5 image model
            ...(!env.GEMINI_IMAGE_MODEL.includes('2.5') && { imageSize: '1K' }),
        },
    };

    const response = await getGemini().models.generateContent({
        model: env.GEMINI_IMAGE_MODEL,
        contents: [prompt],
        config,
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
        const reason = response.candidates?.[0]?.finishReason;
        throw new Error(`Gemini returned no image${reason ? ` (finish reason: ${reason})` : ''}`);
    }

    const data = Buffer.from(imagePart.inlineData.data, 'base64');
    return { data, mimeType: imagePart.inlineData.mimeType || detectMimeType(data) };
};

// Cloudflare Workers AI REST API. FLUX.1 schnell outputs a square image; uploadImage crops it to the ratio.
const generateWithCloudflare = async (prompt: string): Promise<GeneratedImage> => {
    const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${env.CLOUDFLARE_IMAGE_MODEL}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, steps: 6 }),
        signal: AbortSignal.timeout(90_000),
    });

    const body: any = await response.json().catch(() => null);
    const image = body?.result?.image;
    if (!response.ok || !image) {
        const detail = body?.errors?.[0]?.message || `HTTP ${response.status}`;
        throw new Error(`Cloudflare Workers AI returned no image: ${detail}`);
    }

    const data = Buffer.from(image, 'base64');
    return { data, mimeType: detectMimeType(data) };
};

// Generates the image with whichever provider IMAGE_PROVIDER selects
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<GeneratedImage> =>
    env.IMAGE_PROVIDER === 'gemini'
        ? generateWithGemini(prompt, aspectRatio)
        : generateWithCloudflare(prompt);

// Uploads straight from memory (no temp files, works on read-only serverless filesystems)
// and center-crops to the requested aspect ratio so every provider returns the right shape
export const uploadImage = async (image: GeneratedImage, aspectRatio: AspectRatio): Promise<{ url: string; publicId: string }> => {
    const dataUri = `data:${image.mimeType};base64,${image.data.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'image',
        folder: 'thumgen',
        transformation: [{ aspect_ratio: aspectRatio, crop: 'fill', gravity: 'center' }],
    });
    return { url: result.secure_url, publicId: result.public_id };
};

export const deleteImage = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};
