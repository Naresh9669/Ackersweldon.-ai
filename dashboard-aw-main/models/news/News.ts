import { models, model, Schema } from 'mongoose';

export interface INews extends Document {
    _id: string;
    title: string;
    summary?: string;
    date: number;
    source: string;
    categories: string[];
    image?: string;
    type: string;
    ai_summary?: string;
    sentiment?: number;
    read?: boolean;
}

const newsSchema: Schema = new Schema({
    _id: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: false },
    date: { type: Number, required: true },
    source: { type: String, required: true },
    categories: { type: Array, required: false },
    image: { type: String, required: false },
    type: { type: String, required: true },
    ai_summary: { type: String, required: false },
    sentiment: { type: Number, required: false },
    read: { type: Boolean, required: false, default: false }
});

const News = models.News || model<INews>('News', newsSchema);
export default News;