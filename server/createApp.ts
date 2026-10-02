import express, { Request, Response } from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import type { HelmetOptions } from 'helmet';
import mongoose from 'mongoose';
import session from 'express-session';
import { MongoStore } from 'connect-mongo';
import { env } from './configs/env.js';
import AuthRouter from './routes/AuthRoutes.js';
import ThumbnailRouter from './routes/ThumbnailRoutes.js';
import UserRouter from './routes/UserRoutes.js';
import { errorHandler, notFound } from './middlewares/error.js';

// helmet ships a dual ESM/CJS package whose default export resolves differently depending on how the
// file is compiled (local tsc vs Vercel's builder), so unwrap it explicitly to work in both
const helmet = ((helmetModule as any).default ?? helmetModule) as (options?: HelmetOptions) => express.RequestHandler;

declare module 'express-session' {
    interface SessionData {
        isLoggedIn: boolean;
        userId: string;
    }
}

// Builds the Express app (named createApp.ts, not app.ts, so Vercel picks server.ts as the entry). Expects mongoose to be connected already (the session store reuses its client).
export const createApp = () => {
    const app = express();

    // Vercel sits behind a proxy; needed for secure cookies and correct client IPs in rate limiting
    app.set('trust proxy', 1);

    app.use(helmet());
    app.use(cors({ origin: env.clientOrigins, credentials: true }));
    app.use(express.json({ limit: '20kb' }));

    app.use(session({
        name: 'thumgen.sid',
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            httpOnly: true,
            // Production: frontend and API are on different domains, so the cookie must be cross-site
            secure: env.isProduction,
            sameSite: env.isProduction ? 'none' : 'lax',
            path: '/',
        },
        store: MongoStore.create({
            client: mongoose.connection.getClient() as any,
            collectionName: 'sessions',
        }),
    }));

    app.get('/', (req: Request, res: Response) => {
        res.send('ThumGEN API is live!');
    });

    app.get('/api/health', (req: Request, res: Response) => {
        res.json({
            status: 'ok',
            db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            uptime: Math.round(process.uptime()),
        });
    });

    app.use('/api/auth', AuthRouter);
    app.use('/api/thumbnail', ThumbnailRouter);
    app.use('/api/user', UserRouter);

    app.use(notFound);
    app.use(errorHandler);

    return app;
};
