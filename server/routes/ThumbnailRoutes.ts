import express from 'express';
import { deleteThumbnail, generateThumbnail } from '../controllers/ThumbnailController.js';
import protect from '../middlewares/auth.js';
import { generateLimiter } from '../middlewares/rateLimit.js';
import { validateBody } from '../middlewares/validate.js';
import { generateSchema } from '../validators/schemas.js';

const ThumbnailRouter = express.Router();

ThumbnailRouter.post('/generate', protect, generateLimiter, validateBody(generateSchema), generateThumbnail);
ThumbnailRouter.delete('/delete/:id', protect, deleteThumbnail);

export default ThumbnailRouter;
