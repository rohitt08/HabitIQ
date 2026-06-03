import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MongoDB URI is not defined');
        const conn = await mongoose.connect(uri, {
            maxPoolSize: 100, // Handle up to 100 connections
        });
        console.log(`MongoDB Connected 🚀`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};