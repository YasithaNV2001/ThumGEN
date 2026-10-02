import mongoose, { type InferSchemaType } from 'mongoose';
import { env } from '../configs/env.js';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    // select: false keeps the hash out of every query unless explicitly requested
    password: { type: String, required: true, select: false },
    credits: { type: Number, default: () => env.FREE_CREDITS, min: 0 },
    isGuest: { type: Boolean, default: false },
}, { timestamps: true });

export type IUser = InferSchemaType<typeof UserSchema>;

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
