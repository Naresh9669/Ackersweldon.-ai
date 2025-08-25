"use server"
import { connectToMongoDB } from '@/lib/db';
import mongoose from 'mongoose';

export async function queryTweet() {
     const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const news = await mongoose.connection.db
        .collection("tweets")
        .find({})
        .sort({date_posted: -1})
        .toArray()
   
    // console.log(news)
    return JSON.parse(JSON.stringify(news));
}

// export async function getSpecificUser_id(userid: string){ 
//     const db = await connectToMongoDB();
//     const news = await db.collection("tweets")
//         .find({ _id:userid})
//         .sort({date_posted: -1})
//         .toArray()
   
//     // console.log(news)
//     return JSON.parse(JSON.stringify(news));
// }

export async function getSpecificUser_handle(userhandle: string){ 
    const connection = await connectToMongoDB();

    // Ensure connection is established
    if (!mongoose.connection.db) {
        throw new Error('MongoDB connection not established');
    }

    const news = await mongoose.connection.db
        .collection("tweets")
        .find({user_handle : userhandle})
        .sort({date_posted: -1})
        .toArray()
   
    // console.log(news)
    return JSON.parse(JSON.stringify(news));
}

