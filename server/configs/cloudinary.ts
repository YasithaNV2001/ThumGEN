import { v2 as cloudinary } from 'cloudinary';
import './env.js';

// The SDK reads CLOUDINARY_URL from the environment; force HTTPS URLs.
cloudinary.config({ secure: true });

export default cloudinary;
