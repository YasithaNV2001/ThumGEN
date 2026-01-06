import express from 'express';
import { registerUser, loginUser, verifyUser, logoutUser } from '../controllers/AuthControllers.js';
import { verify } from 'node:crypto';
import protect from '../middlewares/auth.js';
import { log } from 'node:console';

const AuthRouter = express.Router();

AuthRouter.post('/register', registerUser);
AuthRouter.post('/login', loginUser);
AuthRouter.get('/verify',protect,verifyUser)
AuthRouter.post('/logout', protect,logoutUser);

export default AuthRouter;