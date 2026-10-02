import mongoose from 'mongoose';
import { env } from './env.js';

// Reuse the connection across serverless invocations (Vercel keeps the module warm)
const connectDB = async (uri: string = env.MONGODB_URI) => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
    mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error));

    await mongoose.connect(uri);
    return mongoose.connection;
};

export default connectDB;
