// Dummy values so env validation passes; external services are mocked in the tests
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://placeholder';
process.env.SESSION_SECRET = 'test-session-secret-0123456789';
process.env.GEMINI_API_KEY = 'test-key';
process.env.CLOUDINARY_URL = 'cloudinary://key:secret@test';
process.env.FREE_CREDITS = '2';
process.env.DAILY_GENERATION_LIMIT = '3';
process.env.CLOUDFLARE_ACCOUNT_ID = 'test-account';
process.env.CLOUDFLARE_API_TOKEN = 'test-token';
