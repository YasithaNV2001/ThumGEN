import { Request, Response } from 'express';
import Thumbnail from '../models/Thumbnail.js';
import User from '../models/User.js';
import { buildPrompt, deleteImage, generateImage, uploadImage } from '../services/thumbnailService.js';
import type { GenerateInput } from '../validators/schemas.js';
import { env } from '../configs/env.js';

export const generateThumbnail = async (req: Request, res: Response) => {
    const { userId } = req.session;
    const input = req.body as GenerateInput;

    // Global daily cap protects the API bill if the public demo gets heavy traffic
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const generatedToday = await Thumbnail.countDocuments({ createdAt: { $gte: startOfDay } });
    if (generatedToday >= env.DAILY_GENERATION_LIMIT) {
        return res.status(503).json({ message: 'The demo has reached its daily generation limit. Please try again tomorrow.' });
    }

    // Atomically spend one credit; fails if none are left (no race between check and decrement)
    const user = await User.findOneAndUpdate(
        { _id: userId, credits: { $gt: 0 } },
        { $inc: { credits: -1 } },
        { new: true },
    );
    if (!user) {
        return res.status(402).json({ message: 'You have used all your free credits.' });
    }

    const prompt = buildPrompt(input);
    const thumbnail = await Thumbnail.create({
        userId,
        title: input.title,
        user_prompt: input.prompt,
        prompt_used: prompt,
        style: input.style,
        aspect_ratio: input.aspect_ratio,
        color_scheme: input.color_scheme,
        text_overlay: input.text_overlay,
        isGenerating: true,
    });

    try {
        const image = await generateImage(prompt, input.aspect_ratio);
        const { url, publicId } = await uploadImage(image, input.aspect_ratio);

        thumbnail.image_url = url;
        thumbnail.image_public_id = publicId;
        thumbnail.isGenerating = false;
        await thumbnail.save();

        return res.status(201).json({
            message: 'Thumbnail generated successfully',
            thumbnail,
            credits: user.credits,
        });
    } catch (error) {
        console.error('Thumbnail generation failed:', error);
        // Don't leave a stuck "generating" record, and give the credit back
        await Thumbnail.deleteOne({ _id: thumbnail._id });
        const refunded = await User.findByIdAndUpdate(userId, { $inc: { credits: 1 } }, { new: true });
        return res.status(502).json({
            message: 'The AI could not generate this thumbnail. Your credit was refunded, please try again.',
            credits: refunded?.credits,
        });
    }
};

export const deleteThumbnail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId } = req.session;

    // Filtering by userId ensures users can only delete their own thumbnails
    const thumbnail = await Thumbnail.findOneAndDelete({ _id: id, userId });
    if (!thumbnail) {
        return res.status(404).json({ message: 'Thumbnail not found' });
    }

    if (thumbnail.image_public_id) {
        deleteImage(thumbnail.image_public_id).catch((error) =>
            console.error('Failed to delete image from Cloudinary:', error));
    }

    return res.json({ message: 'Thumbnail deleted successfully' });
};
