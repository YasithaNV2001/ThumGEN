import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Validates req.body against a zod schema and replaces it with the parsed (trimmed, typed) value
export const validateBody = (schema: z.ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
        const issue = result.error.issues[0];
        return res.status(400).json({
            message: issue.message,
            errors: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
        });
    }
    req.body = result.data;
    next();
};
