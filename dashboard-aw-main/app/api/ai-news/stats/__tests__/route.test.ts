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

describe('/api/ai-news/stats', () => {
  let mockCollection: any;
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockCollection = {
      aggregate: jest.fn()
    };

    const { connectToMongoDB } = require('@/lib/db');
    const mongoose = require('mongoose');
    
    connectToMongoDB.mockResolvedValue({});
    mongoose.connection.db.collection.mockReturnValue(mockCollection);
    
    mockRequest = new NextRequest('http://localhost:3000/api/ai-news/stats');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('returns comprehensive statistics successfully', async () => {
      const mockStatsData = [
        {
          totalProcessed: 1000,
          positiveSentiment: 300,
          negativeSentiment: 100,
          neutralSentiment: 600,
          topCategories: [
            { _id: 'Technology', count: 250 },
            { _id: 'Healthcare', count: 200 },
            { _id: 'Finance', count: 150 }
          ],
          topSources: [
            { _id: 'TechNews', count: 300 },
            { _id: 'HealthDaily', count: 250 },
            { _id: 'FinanceTimes', count: 200 }
          ],
          sentimentDistribution: [
            { _id: 'positive', count: 300 },
            { _id: 'negative', count: 100 },
            { _id: 'neutral', count: 600 }
          ]
        }
      ];

      mockCollection.aggregate.mockResolvedValue(mockStatsData);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.stats.totalProcessed).toBe(1000);
      expect(data.stats.positiveSentiment).toBe(300);
      expect(data.stats.negativeSentiment).toBe(100);
      expect(data.stats.neutralSentiment).toBe(600);
      expect(data.stats.topCategories).toHaveLength(3);
      expect(data.stats.topSources).toHaveLength(3);
    });

    it('handles empty collection statistics', async () => {
      const mockEmptyStats = [
        {
          totalProcessed: 0,
          positiveSentiment: 0,
          negativeSentiment: 0,
          neutralSentiment: 0,
          topCategories: [],
          topSources: [],
          sentimentDistribution: []
        }
      ];

      mockCollection.aggregate.mockResolvedValue(mockEmptyStats);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.totalProcessed).toBe(0);
      expect(data.stats.topCategories).toHaveLength(0);
      expect(data.stats.topSources).toHaveLength(0);
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

    it('handles aggregation pipeline error', async () => {
      mockCollection.aggregate.mockImplementation(() => {
        throw new Error('Aggregation pipeline failed');
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Aggregation pipeline failed');
    });

    it('returns correct data structure for statistics', async () => {
      const mockStatsData = [
        {
          totalProcessed: 500,
          positiveSentiment: 150,
          negativeSentiment: 50,
          neutralSentiment: 300,
          topCategories: [
            { _id: 'AI', count: 100 },
            { _id: 'ML', count: 80 }
          ],
          topSources: [
            { _id: 'AISource', count: 120 },
            { _id: 'MLSource', count: 90 }
          ],
          sentimentDistribution: [
            { _id: 'positive', count: 150 },
            { _id: 'negative', count: 50 },
            { _id: 'neutral', count: 300 }
          ]
        }
      ];

      mockCollection.aggregate.mockResolvedValue(mockStatsData);

      const response = await GET(mockRequest);
      const data = await response.json();

      const stats = data.stats;
      
      // Check basic counts
      expect(stats.totalProcessed).toBe(500);
      expect(stats.positiveSentiment).toBe(150);
      expect(stats.negativeSentiment).toBe(50);
      expect(stats.neutralSentiment).toBe(300);

      // Check top categories structure
      expect(stats.topCategories).toEqual(['AI', 'ML']);
      
      // Check top sources structure
      expect(stats.topSources).toEqual(['AISource', 'MLSource']);

      // Check sentiment distribution
      expect(stats.sentimentDistribution).toBeDefined();
    });

    it('handles missing aggregation results gracefully', async () => {
      mockCollection.aggregate.mockResolvedValue([]);

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toBeDefined();
      // Should have default values when no aggregation results
      expect(data.stats.totalProcessed).toBe(0);
    });

    it('validates aggregation pipeline structure', async () => {
      const mockStatsData = [
        {
          totalProcessed: 100,
          positiveSentiment: 30,
          negativeSentiment: 10,
          neutralSentiment: 60,
          topCategories: [
            { _id: 'Tech', count: 50 },
            { _id: 'Health', count: 30 },
            { _id: 'Finance', count: 20 }
          ],
          topSources: [
            { _id: 'TechNews', count: 40 },
            { _id: 'HealthNews', count: 35 },
            { _id: 'FinanceNews', count: 25 }
          ],
          sentimentDistribution: [
            { _id: 'positive', count: 30 },
            { _id: 'negative', count: 10 },
            { _id: 'neutral', count: 60 }
          ]
        }
      ];

      mockCollection.aggregate.mockResolvedValue(mockStatsData);

      const response = await GET(mockRequest);
      const data = await response.json();

      const stats = data.stats;
      
      // Verify the structure matches expected format
      expect(stats).toHaveProperty('totalProcessed');
      expect(stats).toHaveProperty('positiveSentiment');
      expect(stats).toHaveProperty('negativeSentiment');
      expect(stats).toHaveProperty('neutralSentiment');
      expect(stats).toHaveProperty('topCategories');
      expect(stats).toHaveProperty('topSources');
      expect(stats).toHaveProperty('sentimentDistribution');

      // Verify data types
      expect(typeof stats.totalProcessed).toBe('number');
      expect(Array.isArray(stats.topCategories)).toBe(true);
      expect(Array.isArray(stats.topSources)).toBe(true);
    });
  });
});
