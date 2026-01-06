import express from "express";  
import { getThumbnailbyId, getUserThumbnails } from "../controllers/UserController.js";
import protect from "../middlewares/auth.js";


const UserRouter = express.Router();

// Define user-related routes here

UserRouter.get('/thumbnails',protect, getUserThumbnails);
UserRouter.get('/thumbnails/:id',protect, getThumbnailbyId);

export default UserRouter;