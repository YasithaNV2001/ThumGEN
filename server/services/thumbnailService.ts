import type { GenerateContentConfig } from '@google/genai';
import ai from '../configs/ai.js';
import cloudinary from '../configs/cloudinary.js';
import { env } from '../configs/env.js';
import type { GenerateInput } from '../validators/schemas.js';

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

// Calls Gemini and returns the generated image bytes
export const generateImage = async (prompt: string, aspectRatio: GenerateInput['aspect_ratio']): Promise<Buffer> => {
    const config: GenerateContentConfig = {
        temperature: 1,
        topP: 0.95,
        responseModalities: ['IMAGE'],
        imageConfig: {
            aspectRatio,
            // imageSize is only supported by the Pro image models
            ...(env.GEMINI_IMAGE_MODEL.includes('pro') && { imageSize: '1K' }),
        },
    };

    const response = await ai.models.generateContent({
        model: env.GEMINI_IMAGE_MODEL,
        contents: [prompt],
        config,
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
        const reason = response.candidates?.[0]?.finishReason;
        throw new Error(`Gemini returned no image${reason ? ` (finish reason: ${reason})` : ''}`);
    }

    return Buffer.from(imagePart.inlineData.data, 'base64');
};

// Uploads straight from memory: no temp files, works on read-only serverless filesystems
export const uploadImage = async (image: Buffer): Promise<{ url: string; publicId: string }> => {
    const dataUri = `data:image/png;base64,${image.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'image',
        folder: 'thumgen',
    });
    return { url: result.secure_url, publicId: result.public_id };
};

export const deleteImage = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
};
