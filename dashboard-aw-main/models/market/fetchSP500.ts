"use server"
import { connectToMongoDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function querySP500() {
    await connectToMongoDB();

    // Wait a bit for connection to be fully established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use Mongoose to query the sp500 collection
    const data = await mongoose.connection.db
        .collection("sp500")
        .find({})
        .sort({ name: 1 })
        .toArray()

    return JSON.parse(JSON.stringify(data));
}