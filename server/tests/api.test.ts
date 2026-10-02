import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Express } from 'express';

// Replace the Gemini + Cloudinary calls; everything else (routes, validation, DB) is real
vi.mock('../services/thumbnailService.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../services/thumbnailService.js')>();
    return {
        ...actual,
        generateImage: vi.fn(async () => Buffer.from('fake-png')),
        uploadImage: vi.fn(async () => ({ url: 'https://res.cloudinary.com/test/image/upload/thumgen/a.png', publicId: 'thumgen/a' })),
        deleteImage: vi.fn(async () => undefined),
    };
});

const service = await import('../services/thumbnailService.js');
const { createApp } = await import('../app.js');
const { default: User } = await import('../models/User.js');
const { default: Thumbnail } = await import('../models/Thumbnail.js');

let mongo: MongoMemoryServer;
let app: Express;

const validUser = { name: 'Test User', email: 'test@example.com', password: 'password123' };
const validThumbnail = { title: 'Top 5 Laptops', style: 'Bold & Graphic', aspect_ratio: '16:9', color_scheme: 'neon' };

const signUp = async (user = validUser) => {
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(user).expect(201);
    return agent;
};

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

beforeEach(async () => {
    await mongoose.connection.db!.dropDatabase();
    vi.clearAllMocks();
});

describe('health', () => {
    it('reports status and DB connection', async () => {
        const res = await request(app).get('/api/health').expect(200);
        expect(res.body).toMatchObject({ status: 'ok', db: 'connected' });
    });

    it('returns JSON 404 for unknown routes', async () => {
        const res = await request(app).get('/api/nope').expect(404);
        expect(res.body.message).toContain('Route not found');
    });
});

describe('auth', () => {
    it('registers a user, starts a session and never returns the password', async () => {
        const agent = request.agent(app);
        const res = await agent.post('/api/auth/register').send(validUser).expect(201);

        expect(res.body.user).toMatchObject({ name: 'Test User', email: 'test@example.com', credits: 2 });
        expect(res.body.user.password).toBeUndefined();

        const verify = await agent.get('/api/auth/verify').expect(200);
        expect(verify.body.user.email).toBe('test@example.com');
        expect(verify.body.user.password).toBeUndefined();
    });

    it('stores a bcrypt hash, not the plain password', async () => {
        await signUp();
        const user = await User.findOne({ email: validUser.email }).select('+password');
        expect(user!.password).not.toBe(validUser.password);
        expect(user!.password).toMatch(/^\$2[aby]\$/);
    });

    it('rejects weak passwords and invalid emails', async () => {
        const weak = await request(app).post('/api/auth/register').send({ ...validUser, password: 'short' }).expect(400);
        expect(weak.body.message).toMatch(/at least 8/);

        const badEmail = await request(app).post('/api/auth/register').send({ ...validUser, email: 'nope' }).expect(400);
        expect(badEmail.body.message).toMatch(/valid email/);
    });

    it('rejects duplicate emails (case-insensitive)', async () => {
        await signUp();
        await request(app).post('/api/auth/register')
            .send({ ...validUser, email: 'TEST@example.com' })
            .expect(409);
    });

    it('logs in with correct credentials and rejects wrong ones', async () => {
        await signUp();
        await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'wrongpass1' }).expect(401);
        const res = await request(app).post('/api/auth/login').send({ email: validUser.email, password: validUser.password }).expect(200);
        expect(res.body.user.email).toBe(validUser.email);
    });

    it('logs out and ends the session', async () => {
        const agent = await signUp();
        await agent.post('/api/auth/logout').expect(200);
        await agent.get('/api/auth/verify').expect(401);
    });
});

describe('thumbnails', () => {
    it('requires login', async () => {
        await request(app).post('/api/thumbnail/generate').send(validThumbnail).expect(401);
        await request(app).get('/api/user/thumbnails').expect(401);
    });

    it('validates the request body', async () => {
        const agent = await signUp();
        const res = await agent.post('/api/thumbnail/generate').send({ ...validThumbnail, style: 'Hacker' }).expect(400);
        expect(res.body.message).toMatch(/valid style/);
        expect(service.generateImage).not.toHaveBeenCalled();
    });

    it('generates a thumbnail and spends one credit', async () => {
        const agent = await signUp();
        const res = await agent.post('/api/thumbnail/generate').send(validThumbnail).expect(201);

        expect(res.body.credits).toBe(1);
        expect(res.body.thumbnail).toMatchObject({
            title: 'Top 5 Laptops',
            isGenerating: false,
            image_url: 'https://res.cloudinary.com/test/image/upload/thumgen/a.png',
        });
        expect(service.generateImage).toHaveBeenCalledWith(expect.stringContaining('Top 5 Laptops'), '16:9');

        const list = await agent.get('/api/user/thumbnails').expect(200);
        expect(list.body.total).toBe(1);
        expect(list.body.thumbnails[0].createdAt).toBeDefined();
    });

    it('blocks generation when credits run out', async () => {
        const agent = await signUp();
        await agent.post('/api/thumbnail/generate').send(validThumbnail).expect(201);
        await agent.post('/api/thumbnail/generate').send(validThumbnail).expect(201);
        const res = await agent.post('/api/thumbnail/generate').send(validThumbnail).expect(402);
        expect(res.body.message).toMatch(/credits/);
        expect(service.generateImage).toHaveBeenCalledTimes(2);
    });

    it('refunds the credit and removes the record when the AI fails', async () => {
        vi.mocked(service.generateImage).mockRejectedValueOnce(new Error('Gemini down'));
        const agent = await signUp();

        const res = await agent.post('/api/thumbnail/generate').send(validThumbnail).expect(502);
        expect(res.body.credits).toBe(2);
        expect(await Thumbnail.countDocuments()).toBe(0);
    });

    it('does not let a user read or delete another user\'s thumbnail', async () => {
        const owner = await signUp();
        const { body } = await owner.post('/api/thumbnail/generate').send(validThumbnail).expect(201);
        const id = body.thumbnail._id;

        const attacker = await signUp({ ...validUser, email: 'attacker@example.com' });
        await attacker.get(`/api/user/thumbnails/${id}`).expect(404);
        await attacker.delete(`/api/thumbnail/delete/${id}`).expect(404);
        expect(await Thumbnail.countDocuments()).toBe(1);

        await owner.delete(`/api/thumbnail/delete/${id}`).expect(200);
        expect(await Thumbnail.countDocuments()).toBe(0);
        expect(service.deleteImage).toHaveBeenCalledWith('thumgen/a');
    });

    it('returns 400 for malformed ids', async () => {
        const agent = await signUp();
        await agent.get('/api/user/thumbnails/not-an-id').expect(400);
    });
});

describe('prompt builder', () => {
    it('includes style, colors, overlay text and user details', () => {
        const prompt = service.buildPrompt({
            title: 'Learn React', prompt: 'add a laptop', style: 'Minimalist',
            aspect_ratio: '1:1', color_scheme: 'ocean', text_overlay: true,
        });
        expect(prompt).toContain('minimalist thumbnail');
        expect(prompt).toContain('aquatic color palette');
        expect(prompt).toContain('overlay text');
        expect(prompt).toContain('add a laptop');
        expect(prompt).toContain('1:1');
    });

    it('asks for no text when overlay is off', () => {
        const prompt = service.buildPrompt({
            title: 'X', prompt: '', style: 'Illustrated', aspect_ratio: '16:9', text_overlay: false,
        });
        expect(prompt).toContain('Do not include any text');
    });
});
