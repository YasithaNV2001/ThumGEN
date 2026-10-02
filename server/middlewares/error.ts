import { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export const notFound = (req: Request, res: Response) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Express 5 forwards rejected promises from async handlers here automatically
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err?.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid id' });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Malformed JSON body' });
    }
    console.error(err);
    // Never leak internal error details to the client
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
};
