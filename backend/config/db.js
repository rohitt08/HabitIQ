import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async () => {
    try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);

        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MongoDB URI is not defined');
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected 🚀`);
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};