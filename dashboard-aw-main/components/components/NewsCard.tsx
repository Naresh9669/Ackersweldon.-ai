"use client"
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import { AnyObject } from "mongoose";
import { ChevronRight, ChevronDown, Brain, TrendingUp, TrendingDown, Minus, Sparkles, Clock, Tag } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WithId } from "mongodb";
import { useInView } from "react-intersection-observer";
import { fetchSpecificSourceNews } from "@/models/news/fetchSpecificSourceNews";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";

// Enhanced NewsCard with AI features
export function NewsCard({ title, date, summary, url, img_link, read, source, categories, sentiment, ai_summary }: { 
    title: string, 
    date: string, 
    summary: string, 
    url: string, 
    img_link?: string, 
    read: boolean, 
    source?: string,
    categories?: string[],
    sentiment?: number,
    ai_summary?: string
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [processedAI, setProcessedAI] = useState({
        summary: ai_summary || "",
        sentiment: sentiment || 0,
        categories: categories || []
    });

    img_link = img_link || "https://placehold.co/600x400?text=Image+Not+Found";

    if (summary == undefined){
        summary = "The summary is being processed. Please be patient."
    }

    // Get sentiment display
    const getSentimentDisplay = (sentiment: number) => {
        if (sentiment > 0.1) return { icon: TrendingUp, color: "text-green-600", bg: "bg-green-100", text: "Positive" };
        if (sentiment < -0.1) return { icon: TrendingDown, color: "text-red-600", bg: "bg-red-100", text: "Negative" };
        return { icon: Minus, color: "text-gray-600", bg: "bg-gray-100", text: "Neutral" };
    };

    const sentimentInfo = getSentimentDisplay(processedAI.sentiment);

    // Process AI content if not already processed
    const processAIContent = async () => {
        if (processedAI.summary || processedAI.sentiment !== 0) return;
        
        setIsProcessingAI(true);
        try {
            // Since the backend doesn't have a process-news endpoint,
            // we'll use the existing AI data if available
            if (ai_summary) {
                setProcessedAI({
                    summary: ai_summary,
                    sentiment: sentiment || 0,
                    categories: categories || []
                });
            } else {
                // Show message that AI processing isn't available
                setProcessedAI({
                    summary: "AI processing not available for this article",
                    sentiment: 0,
                    categories: []
                });
            }
        } catch (error) {
            console.error('Error processing AI content:', error);
        } finally {
            setIsProcessingAI(false);
        }
    };

    // Auto-process AI content if available but not processed
    useEffect(() => {
        if (ai_summary && !processedAI.summary) {
            setProcessedAI({
                summary: ai_summary,
                sentiment: sentiment || 0,
                categories: categories || []
            });
        }
    }, [ai_summary, sentiment, categories]);

    return (
        <div className="min-w-[400px] w-full my-2 hover:drop-shadow-lg transition-all cursor-pointer z-0">
            <Card className="p-3">
                {/* Header with AI indicators */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <CardTitle>
                            <div className="text-md text-wrap line-clamp-2 overflow-hidden whitespace-wrap text-ellipsis m-2 truncate">
                                {title}
                            </div>
                        </CardTitle>
                        
                        {/* AI Processing Status */}
                        {!processedAI.summary && !isProcessingAI && (
                            <div className="flex items-center gap-2 ml-2 mb-2">
                                <Brain className="w-4 h-4 text-blue-500" />
                                <span className="text-xs text-blue-600">AI processing available</span>
                                <button 
                                    onClick={(e) => { e.preventDefault(); processAIContent(); }}
                                    className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                                >
                                    Process
                                </button>
                            </div>
                        )}
                        
                        {isProcessingAI && (
                            <div className="flex items-center gap-2 ml-2 mb-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                <span className="text-xs text-blue-600">AI processing...</span>
                            </div>
                        )}
                    </div>
                    
                    {/* AI Summary Toggle */}
                    {processedAI.summary && (
                        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                            <CollapsibleTrigger asChild>
                                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                </div>

                {/* Meta Information */}
                <CardDescription className="p-1">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{date}</span>
                        </div>
                        <div className="flex gap-2">
                            {source && <Badge variant="secondary" className="text-xs">{source}</Badge>}
                            {!read && <Badge variant="destructive" className="text-xs">Unread</Badge>}
                        </div>
                    </div>
                </CardDescription>

                {/* Sentiment Analysis */}
                {processedAI.sentiment !== 0 && (
                    <div className="flex items-center gap-2 ml-2 mb-2">
                        <sentimentInfo.icon className={`w-4 h-4 ${sentimentInfo.color}`} />
                        <Badge className={`text-xs ${sentimentInfo.bg} ${sentimentInfo.color}`}>
                            {sentimentInfo.text} ({Math.abs(processedAI.sentiment * 100).toFixed(0)}%)
                        </Badge>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    processedAI.sentiment > 0 ? 'bg-green-500' : 
                                    processedAI.sentiment < 0 ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                                style={{ 
                                    width: `${Math.min(Math.abs(processedAI.sentiment * 100), 100)}%`,
                                    marginLeft: processedAI.sentiment < 0 ? 'auto' : '0'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Categories */}
                {processedAI.categories && processedAI.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 ml-2 mb-2">
                        <Tag className="w-3 h-3 text-gray-500" />
                        {processedAI.categories.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Content */}
                <CardContent className="text-wrap p-1">
                    {/* Original Summary */}
                    <div className="mb-2">
                        <p className="text-sm text-gray-700">{summary}</p>
                    </div>

                    {/* AI Summary (Collapsible) */}
                    {processedAI.summary && (
                        <CollapsibleContent>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-purple-700">AI Summary</span>
                                </div>
                                <p className="text-sm text-gray-800 bg-purple-50 p-2 rounded">
                                    {processedAI.summary}
                                </p>
                            </div>
                        </CollapsibleContent>
                    )}
                </CardContent>

                {/* Action Button */}
                <div className="flex justify-end mt-2">
                    <a 
                        href={url} 
                        target="_blank" 
                        className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                    >
                        Read Full Article
                    </a>
                </div>
            </Card>
        </div>
    );
}


export function NewsCardList({ title, news, isSpecific, src, key, sidemenus }: { title: string, news: WithId<AnyObject>[], isSpecific?: boolean, src?: string, key?: number, sidemenus?: WithId<AnyObject>[] }) {
    var source: string = src || (useParams() as { source: string }).source;

    if (news.length == 0) {
        return (
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl">{title}</h1>
                <div className="flex flex-wrap justify-center">
                    <p className="text-xl text-pink-500">No updates available</p>
                </div>
            </div>
        );
    }

    if (isSpecific) {
        return (
            <div className="flex flex-col w-full gap-1 mx-auto" key={key || 0}>
                <a href={`/news/${source}`} className="flex gap-1 cursor-pointer justify-between items-center">
                    <h1 className="text-3xl">{title}</h1>
                    <div className="flex justify-evenly items-center p-2 px-4 rounded-2xl bg-gray-300 hover:bg-gray-400 hover:underline transition-all">
                        <span>More</span>
                        <ChevronRight className="ml-auto" />
                    </div>
                </a>
                <div className="flex flex-wrap pr-2 gap-8 mt-2">
                    {news.map((news) => {
                        return (
                            <NewsCard 
                                title={news.title} 
                                date={new Date(news.date * 1000).toLocaleDateString()} 
                                summary={news.summary} 
                                url={news._id.toString()} 
                                img_link={news.image} 
                                read={news.read} 
                                key={news._id.toString() + (Math.random() + 1).toString(36).substring(7)}
                                categories={news.categories}
                                sentiment={news.sentiment}
                                ai_summary={news.ai_summary}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    const [newsList, setNewsList] = useState<WithId<AnyObject>[]>(news);
    const [ref, inView] = useInView()
    const [page, setPage] = useState(2);

    const searchParams = useSearchParams();
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const [hasMore, setHasMore] = useState(true);

    async function loadMoreNews() {
        setPage((prevPage) => prevPage + 1)
        const data = await fetchSpecificSourceNews(page, source, category || undefined, search || undefined);
        setNewsList((prevNews) => [...prevNews, ...data]);

        if (data.length < 15) {
            setHasMore(false);
        }
    }

    useEffect(() => {
        setNewsList(news);
    }, [news]);

    useEffect(() => {
        if (inView && hasMore) {
            loadMoreNews();
        }
    }, [inView]);
    
    return (
        <>
            <div className="flex w-full flex-col p-2 gap-2 justify-between">
                {newsList.map((news) => {
                    const sourceName = sidemenus?.find((sidemenu) => sidemenu._id.toString() === news.source)?.name;
                    return (
                        <NewsCard 
                            title={news.title} 
                            date={new Date(news.date * 1000).toLocaleDateString()} 
                            summary={news.summary} 
                            url={news._id.toString()} 
                            img_link={news.image} 
                            key={news._id.toString() + (Math.random() + 1).toString(36).substring(7)} 
                            read={news.read} 
                            source={sourceName}
                            categories={news.categories}
                            sentiment={news.sentiment}
                            ai_summary={news.ai_summary}
                        />
                    );
                })}
            </div>
            <div ref={ref} className="flex justify-center items-center">
                {hasMore && <Spinner size="large" />}
            </div>
        </>
    );
}


