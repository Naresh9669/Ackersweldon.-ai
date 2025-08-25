"use server"
import { connectToMongoDB } from '@/lib/db';
import mongoose from 'mongoose';
import { METHODS } from 'http';

export async function getUserTweets() {
    const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const users = await mongoose.connection.db
        .collection("twitter_user_info")
        .find({})
        .sort({})
        .limit(10)
        .toArray()

    return JSON.parse(JSON.stringify(users));
}


export async function getSpecificUserTweets(search: string) {
    const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const users = await mongoose.connection.db
        .collection("twitter_user_info")
        .find({
            user_handle: {
                $regex: search,
                $options: 'i'
            }
        })
        
        .sort({})
        .limit(10)
        .toArray();

    return JSON.parse(JSON.stringify(users));
}



export async function insertUser(username: string) {
    try {
        const url = `${process.env.SERVER_BASE_URL!}/twitter/getUserId?username=${username}`
        console.log(url);

        const userInfo = await fetch(`${process.env.SERVER_BASE_URL!}/twitter/getUserId?username=${username}`);
        const user = await userInfo.json()
        console.log(user)
        
        if (user && user.length > 0) {
            const userId = user[0].user_id;
            const userName = user[0].user_name;
            const userHandle = user[0].user_handle;
            
            // Now fetch tweets for this user
            const tweetsResponse = await fetch(`${process.env.SERVER_BASE_URL!}/twitter/getTweets?user_id=${userId}`);
            const tweets = await tweetsResponse.json();
            
            return {
                success: true,
                user: { userId, userName, userHandle },
                tweets: tweets
            };
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        console.error('Error inserting user:', error);
        throw error;
    }
}

export async function getAllTweets() {
    const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const tweets = await mongoose.connection.db
        .collection("tweets")
        .find({})
        .sort({date_posted: -1})
        .limit(50)
        .toArray()

    return JSON.parse(JSON.stringify(tweets));
}

export async function getTweetsByUser(userId: string) {
    const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const tweets = await mongoose.connection.db
        .collection("tweets")
        .find({user_id: userId})
        .sort({date_posted: -1})
        .limit(20)
        .toArray()

    return JSON.parse(JSON.stringify(tweets));
}