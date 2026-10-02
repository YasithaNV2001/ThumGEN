import express from 'express';
import { registerUser, loginUser, verifyUser, logoutUser } from '../controllers/AuthControllers.js';
import protect from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { validateBody } from '../middlewares/validate.js';
import { loginSchema, registerSchema } from '../validators/schemas.js';

const AuthRouter = express.Router();

AuthRouter.post('/register', authLimiter, validateBody(registerSchema), registerUser);
AuthRouter.post('/login', authLimiter, validateBody(loginSchema), loginUser);
AuthRouter.get('/verify', protect, verifyUser);
AuthRouter.post('/logout', protect, logoutUser);

export default AuthRouter;
