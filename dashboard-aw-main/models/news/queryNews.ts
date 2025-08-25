"use server"
import { connectToMongoDB } from '@/lib/db';
import News from '@/models/news/News';

const card_num = 20;

export async function queryNews(page: number, source: string, category?: string, search?: string) {
    await connectToMongoDB();

    const query: any = { source: source };
    if (category) {
        query.categories = category;
    }
    if (search) {
        query.title = "/.*" + search + ".*/";
    }

    const news = await News
        .find(query)
        .sort({ date: -1 })
        .skip((card_num * page) - card_num)
        .limit(card_num)
    const pipeline: any[] = [
        {
            $match: {
                _id: {
                    $in: news.map((news) => news._id)
                }
            }
        },
        {
            $set: {
                read: true
            }
        },
        {
            $merge: {
                into: "news",
                whenMatched: "merge",
                whenNotMatched: "fail"
            }
        }
    ];
    await News.aggregate(pipeline);

    return JSON.parse(JSON.stringify(news));
}
