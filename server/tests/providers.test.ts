import { afterEach, describe, expect, it, vi } from 'vitest';

// tests/setup.ts selects the default provider (cloudflare) with dummy credentials
const { generateImage } = await import('../services/thumbnailService.js');

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('Cloudflare Workers AI provider', () => {
    it('calls the Workers AI REST endpoint and decodes the base64 image', async () => {
        const fetchMock = vi.fn(async () => new Response(
            JSON.stringify({ success: true, result: { image: JPEG.toString('base64') } }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        ));
        vi.stubGlobal('fetch', fetchMock);

        const image = await generateImage('a red sports car', '16:9');

        expect(image.data.equals(JPEG)).toBe(true);
        expect(image.mimeType).toBe('image/jpeg');

        const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
        expect(url).toBe('https://api.cloudflare.com/client/v4/accounts/test-account/ai/run/@cf/black-forest-labs/flux-1-schnell');
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
        expect(JSON.parse(init.body as string)).toMatchObject({ prompt: 'a red sports car' });
    });

    it('surfaces the API error message when generation fails', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(
            JSON.stringify({ success: false, errors: [{ message: 'Daily free allocation exceeded' }] }),
            { status: 429 },
        )));

        await expect(generateImage('anything', '1:1')).rejects.toThrow('Daily free allocation exceeded');
    });
});
