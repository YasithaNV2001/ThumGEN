import express from "express";
import { deleteThumbnails, generateThumbnail } from "../controllers/ThumbnailController.js";
import protect from "../middlewares/auth.js";

const ThumbnailRouter = express.Router();

ThumbnailRouter.post('/generate',protect, generateThumbnail);
ThumbnailRouter.delete('/delete/:id',protect, deleteThumbnails ); // Implement delete controller later


export default ThumbnailRouter;