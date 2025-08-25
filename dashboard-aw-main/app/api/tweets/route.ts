import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
    try {
        const connection = await connectToMongoDB();

        // Ensure connection is established
        if (!mongoose.connection.db) {
            throw new Error('MongoDB connection not established');
        }

        const tweets = await mongoose.connection.db
            .collection("tweets")
            .find({})
            .sort({date_posted: -1})
            .toArray();
   
        return NextResponse.json(tweets);
    } catch (error) {
        console.error('Error fetching tweets:', error);
        return NextResponse.json({ error: 'Failed to fetch tweets' }, { status: 500 });
    }
} 