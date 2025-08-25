"use server"
import { connectToMongoDB } from "@/lib/db";
import News from "./News";

export async function fetchNewsUpdate() {
    await connectToMongoDB();

    const pipeline = [
        {
          $match: {
            read: false
          }
        },
        {
          $group: {
            _id: "$source",
            count: {
              $sum: 1
            }
          }
        }
      ];

    const update = await News.aggregate(pipeline);

    return JSON.parse(JSON.stringify(update));
}