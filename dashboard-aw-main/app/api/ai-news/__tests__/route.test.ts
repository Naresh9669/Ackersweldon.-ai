import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock MongoDB connection
jest.mock('@/lib/db', () => ({
  connectToMongoDB: jest.fn()
}));

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    db: {
      collection: jest.fn()
    }
  }
}));

describe('/api/ai-news', () => {
  let mockCollection: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      aggregate: jest.fn()
    };

    const { connectToMongoDB } = require('@/lib/db');
    const mongoose = require('mongoose');
    
    connectToMongoDB.mockResolvedValue({});
    mongoose.connection.db.collection.mockReturnValue(mockCollection);
    
    mockRequest = new NextRequest('http://localhost:3000/api/ai-news');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns AI news data successfully', async () => {
      const mockNewsData = [
        {
          _id: '1',
          title: 'Test AI News',
          ai_summary: 'Test summary',
          sentiment: 'positive',
          category: 'Technology',
          source: 'TestSource',
          published_at: '2024-01-15T10:00:00Z',
          url: 'https://example.com'
        }
      ];

      const mockStatsData = [
        {
          totalProcessed: 100,
          positiveSentiment: 30,
          negativeSentiment: 10,
          neutralSentiment: 60,
          topCategories: ['Technology', 'Healthcare'],
          topSources: ['TestSource', 'AnotherSource']
        }
      ];

      mockCollection.toArray.mockResolvedValue(mockNewsData);
      mockCollection.aggregate.mockResolvedValue(mockStatsData);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.news).toHaveLength(1);
      expect(data.news[0].title).toBe('Test AI News');
      expect(data.stats).toBeDefined();
      expect(data.stats.totalProcessed).toBe(100);
    });

    it('handles empty news collection', async () => {
      mockCollection.toArray.mockResolvedValue([]);
      mockCollection.aggregate.mockResolvedValue([{
        totalProcessed: 0,
        positiveSentiment: 0,
        negativeSentiment: 0,
        neutralSentiment: 0,
        topCategories: [],
        topSources: []
      }]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.news).toHaveLength(0);
      expect(data.stats.totalProcessed).toBe(0);
    });

    it('handles MongoDB connection error', async () => {
      const { connectToMongoDB } = require('@/lib/db');
      connectToMongoDB.mockRejectedValue(new Error('Connection failed'));

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Connection failed');
    });

    it('handles missing database connection', async () => {
      const mongoose = require('mongoose');
      mongoose.connection.db = null;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('MongoDB connection not established');
    });

    it('handles collection query error', async () => {
      mockCollection.find.mockImplementation(() => {
        throw new Error('Query failed');
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Query failed');
    });

    it('handles aggregation error', async () => {
      mockCollection.toArray.mockResolvedValue([]);
      mockCollection.aggregate.mockImplementation(() => {
        throw new Error('Aggregation failed');
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Aggregation failed');
    });

    it('transforms news data correctly', async () => {
      const rawNewsData = [
        {
          _id: '1',
          title: 'Raw Title',
          ai_summary: 'Raw summary',
          sentiment: 'positive',
          category: 'Tech',
          source: 'Source',
          published_at: '2024-01-15T10:00:00Z',
          url: 'https://example.com',
          extra_field: 'should be ignored'
        }
      ];

      const mockStatsData = [{
        totalProcessed: 1,
        positiveSentiment: 1,
        negativeSentiment: 0,
        neutralSentiment: 0,
        topCategories: ['Tech'],
        topSources: ['Source']
      }];

      mockCollection.toArray.mockResolvedValue(rawNewsData);
      mockCollection.aggregate.mockResolvedValue(mockStatsData);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.news[0]).toEqual({
        _id: '1',
        title: 'Raw Title',
        ai_summary: 'Raw summary',
        sentiment: 'positive',
        category: 'Tech',
        source: 'Source',
        published_at: '2024-01-15T10:00:00Z',
        url: 'https://example.com'
      });
      expect(data.news[0]).not.toHaveProperty('extra_field');
    });

    it('applies correct sorting and limiting', async () => {
      mockCollection.toArray.mockResolvedValue([]);
      mockCollection.aggregate.mockResolvedValue([{
        totalProcessed: 0,
        positiveSentiment: 0,
        negativeSentiment: 0,
        neutralSentiment: 0,
        topCategories: [],
        topSources: []
      }]);

      await GET(mockRequest);

      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.sort).toHaveBeenCalledWith({ published_at: -1 });
      expect(mockCollection.limit).toHaveBeenCalledWith(100);
    });
  });
});
