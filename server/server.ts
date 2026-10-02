import { env } from './configs/env.js';
import connectDB from './configs/db.js';
import { createApp } from './app.js';

await connectDB();

const app = createApp();

// On Vercel the exported app runs as a serverless function; locally we listen on a port
if (!process.env.VERCEL) {
    app.listen(env.PORT, () => {
        console.log(`Server is running at http://localhost:${env.PORT}`);
        console.log(`Running in ${env.NODE_ENV} mode`);
    });
}

export default app;
