import { models, model, Schema, Document } from 'mongoose';

export interface IAIResult extends Document {
  _id: string;
  articleId: string;
  type: 'summary' | 'sentiment';
  content: string;
  success: boolean;
  metadata: {
    model?: string;
    confidence?: number;
    reasoning?: string;
    tone?: string;
    [key: string]: any;
  };
  timestamp: Date;
  cached: boolean;
}

const aiResultSchema: Schema = new Schema({
  articleId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['summary', 'sentiment'], index: true },
  content: { type: String, required: true },
  success: { type: Boolean, required: true, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
  cached: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Create compound index for efficient lookups
aiResultSchema.index({ articleId: 1, type: 1 }, { unique: true });

const AIResult = models.AIResult || model<IAIResult>('AIResult', aiResultSchema);
export default AIResult;
