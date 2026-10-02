import { Request, Response } from 'express';
import Thumbnail from '../models/Thumbnail.js';

const MAX_PAGE_SIZE = 50;

// GET /api/user/thumbnails?page=1&limit=20
export const getUserThumbnails = async (req: Request, res: Response) => {
    const { userId } = req.session;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || 20));

    const [thumbnails, total] = await Promise.all([
        Thumbnail.find({ userId })
            .select('-prompt_used')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Thumbnail.countDocuments({ userId }),
    ]);

    return res.json({ thumbnails, page, limit, total, totalPages: Math.ceil(total / limit) });
};

export const getThumbnailById = async (req: Request, res: Response) => {
    const { userId } = req.session;
    const { id } = req.params;

    const thumbnail = await Thumbnail.findOne({ userId, _id: id });
    if (!thumbnail) {
        return res.status(404).json({ message: 'Thumbnail not found' });
    }
    return res.json({ thumbnail });
};
