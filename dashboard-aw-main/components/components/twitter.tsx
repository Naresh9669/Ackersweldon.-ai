"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "../ui/card";
import { MessageCircleMore, Repeat2, HeartIcon } from "lucide-react";


export function card({ username, userhandle, profile_url, text, msg_count, tweet_url, retweet_count, like_count, img_path }: { username: string, userhandle: string, profile_url: string, text: string, msg_count: number, tweet_url: string, retweet_count: number, like_count: number, img_path?: string }) {
    let img: JSX.Element;
    if (img_path !== null) {
        img = (<img src={img_path} alt="Image" className="w-full h-auto rounded-md" />);
    } else {
        img = (<></>);
    }

    return (
        <div className="min-w-[700px] max-w-[700px]">
            <Card className="hover:shadow-md">
                <CardHeader>
                    <div className="flex gap-2 items-center justify-between">
                        <div className="flex gap-2 items-center">
                            <img src={profile_url} className="rounded-lg min-w-[30px] max-w-[50px]" />
                            <div className="flex flex-col items-start">
                                <span className="font- text-lg">{username}</span>
                                <a href={`https://x.com/${userhandle}`} target="_blank">
                                    <span className="font-light text-sm text-gray-500 flex justify-center hover:text-cyan-500"><span>@</span>{userhandle}</span>
                                </a>
                            </div>
                        </div>
                        <div>
                            <a href={tweet_url} target="_blank">
                                <button className="btn bg-cyan-500 p-2 m-2 rounded-lg text-white hover:bg-gray-700 transition-all">View Tweets</button>
                            </a>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <div dangerouslySetInnerHTML={{ __html: urlify(text) }}></div>
                    {img}
                </CardContent>

                <CardFooter className="justify-between">
                    <div className="flex gap-1 items-center">
                        <MessageCircleMore />
                        <span>{msg_count}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                        <Repeat2 />
                        <span>{retweet_count}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                        <HeartIcon />
                        <span>{like_count}</span>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
/**
 * @Description
 *  - Uses regex to look for link in a text and add an <a> tags to make it into a usable url link.
 * @Param
*   - text: String [A text that has a link in it.]
*/
function urlify(text: string): string {
    const urlRegex: RegExp = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url: string) => {
        return `<a style="color:blue" target="_blank" href="${url}">${url}</a>`;
    });
}


