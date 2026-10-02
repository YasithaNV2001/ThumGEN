import { Request, Response } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { env } from '../configs/env.js';

const toPublicUser = (user: any) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    credits: user.credits,
    isGuest: user.isGuest ?? false,
});

// Regenerate the session on login to prevent session fixation
const startSession = (req: Request, userId: string) =>
    new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.isLoggedIn = true;
            req.session.userId = userId;
            req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
        });
    });

export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    const existing = await User.exists({ email });
    if (existing) {
        return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    await startSession(req, newUser._id.toString());

    return res.status(201).json({
        message: 'Account created successfully',
        user: toPublicUser(newUser),
    });
};

// One-click demo account: no form, a few credits, random unusable credentials
export const guestLogin = async (req: Request, res: Response) => {
    const id = crypto.randomBytes(6).toString('hex');
    const randomPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

    const guest = await User.create({
        name: 'Guest',
        email: `guest-${id}@guest.thumgen.invalid`,
        password: randomPassword,
        credits: env.GUEST_CREDITS,
        isGuest: true,
    });

    await startSession(req, guest._id.toString());

    return res.status(201).json({
        message: `Welcome! You have ${env.GUEST_CREDITS} free generations to try.`,
        user: toPublicUser(guest),
    });
};

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    // Same message for unknown email and wrong password, so emails can't be enumerated
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    await startSession(req, user._id.toString());

    return res.json({
        message: 'Logged in successfully',
        user: toPublicUser(user),
    });
};

export const logoutUser = (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Could not log out. Please try again.' });
        }
        res.clearCookie('thumgen.sid', { path: '/' });
        return res.json({ message: 'Logged out successfully' });
    });
};

export const verifyUser = async (req: Request, res: Response) => {
    const user = await User.findById(req.session.userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: toPublicUser(user) });
};
