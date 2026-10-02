import mongoose, { type InferSchemaType } from 'mongoose';

export const THUMBNAIL_STYLES = ['Bold & Graphic', 'Tech/Futuristic', 'Minimalist', 'Photorealistic', 'Illustrated'] as const;
export const ASPECT_RATIOS = ['16:9', '1:1', '9:16'] as const;
export const COLOR_SCHEMES = ['vibrant', 'sunset', 'forest', 'neon', 'purple', 'monochrome', 'ocean', 'pastel'] as const;

const ThumbnailSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    style: { type: String, enum: THUMBNAIL_STYLES, required: true },
    aspect_ratio: { type: String, required: true, enum: ASPECT_RATIOS, default: '16:9' },
    color_scheme: { type: String, enum: COLOR_SCHEMES },
    text_overlay: { type: Boolean, default: false },
    image_url: { type: String, default: '' },
    // Cloudinary id, so deleting a thumbnail also deletes the stored image
    image_public_id: { type: String },
    prompt_used: { type: String },
    user_prompt: { type: String },
    isGenerating: { type: Boolean, default: true },
}, { timestamps: true });

export type IThumbnail = InferSchemaType<typeof ThumbnailSchema>;

const Thumbnail = mongoose.models.Thumbnail || mongoose.model('Thumbnail', ThumbnailSchema);

export default Thumbnail;
