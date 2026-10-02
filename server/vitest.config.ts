import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 120000, // first run downloads the MongoDB binary
        fileParallelism: false,
    },
});
