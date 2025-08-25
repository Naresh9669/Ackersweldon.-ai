"use server"
import { connectToMongoDB } from "@/lib/db";
import News, { INews } from "./News";

export async function fetchHomepageNews(search?: string) {
  await connectToMongoDB();
  let newsTuple: [string, INews[], string][] = [];
  const query: any = {};
  if (search) {
    query.title = { $regex: `.*${search}.*`, $options: "i" };
  }

  query.source = "yahoo_finance";
  const yahoo_finance_news = await News
    .find(query)
    .sort({ date: -1 })
    .limit(4)

  query.source = "finviz";
  const finviz_news = await News
    .find(query)
    .sort({ date: -1 })
    .limit(4)

  query.source = "sharesight";
  const sharesight_news = await News
    .find(query)
    .sort({ date: -1 })
    .limit(4)

  query.source = "mckinsey";
  const mckinsey_news = await News
    .find(query)
    .sort({ date: -1 })
    .limit(4)

  query.source = "bloomberg";
  const bloomberg_news = await News
    .find(query)
    .sort({ date: -1 })
    .limit(4)

  const ids = [...yahoo_finance_news, ...finviz_news, ...sharesight_news, ...mckinsey_news, ...bloomberg_news].map(news => news._id.toString());
  const pipeline: any[] = [
    {
      $match: {
        _id: {
          $in: ids
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

  newsTuple.push(["Bloomberg", JSON.parse(JSON.stringify(bloomberg_news)), "bloomberg"]);
  newsTuple.push(["Finviz", JSON.parse(JSON.stringify(finviz_news)), "finviz"]);
  newsTuple.push(["Mckinsey", JSON.parse(JSON.stringify(mckinsey_news)), "mckinsey"]);
  newsTuple.push(["Sharesight", JSON.parse(JSON.stringify(sharesight_news)), "sharesight"]);
  newsTuple.push(["Yahoo Finance", JSON.parse(JSON.stringify(yahoo_finance_news)), "yahoo_finance"]);

  return newsTuple;
}


// export async function fetchLatestNews(){
//   await connectToMongoDB();
//   const news = await News.find({}).sort({date: -1}).limit(15);
//   return news;
// }