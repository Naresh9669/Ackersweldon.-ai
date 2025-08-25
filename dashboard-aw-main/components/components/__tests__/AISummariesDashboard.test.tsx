import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AISummariesDashboard from '../AISummariesDashboard';

// Mock data for testing
const mockAINewsData = {
  success: true,
  news: [
    {
      _id: '1',
      title: 'AI Breakthrough in Healthcare',
      ai_summary: 'This is a test AI summary for healthcare AI breakthrough',
      sentiment: 'positive',
      category: 'Healthcare',
      source: 'TechNews',
      published_at: '2024-01-15T10:00:00Z',
      url: 'https://example.com/healthcare-ai'
    },
    {
      _id: '2',
      title: 'Machine Learning in Finance',
      ai_summary: 'Test summary for ML in finance applications',
      sentiment: 'neutral',
      category: 'Finance',
      source: 'FinanceDaily',
      published_at: '2024-01-14T15:30:00Z',
      url: 'https://example.com/finance-ml'
    }
  ],
  stats: {
    totalProcessed: 150,
    positiveSentiment: 45,
    negativeSentiment: 15,
    neutralSentiment: 90,
    topCategories: ['Technology', 'Healthcare', 'Finance'],
    topSources: ['TechNews', 'FinanceDaily', 'AIWeekly']
  }
};

const mockStatsData = {
  success: true,
  stats: {
    totalProcessed: 200,
    positiveSentiment: 60,
    negativeSentiment: 20,
    neutralSentiment: 120,
    topCategories: ['Technology', 'Healthcare', 'Finance', 'Education'],
    topSources: ['TechNews', 'FinanceDaily', 'AIWeekly', 'EduTech']
  }
};

describe('AISummariesDashboard', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Component Rendering', () => {
    it('renders the dashboard title and description', () => {
      render(<AISummariesDashboard />);
      
      expect(screen.getByText('AI Summaries Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/AI-powered news analysis and insights/)).toBeInTheDocument();
    });

    it('renders refresh buttons', () => {
      render(<AISummariesDashboard />);
      
      expect(screen.getByText('Refresh AI Data')).toBeInTheDocument();
      expect(screen.getByText('Refresh Stats')).toBeInTheDocument();
    });

    it('renders stats cards', () => {
      render(<AISummariesDashboard />);
      
      expect(screen.getByText('Total Processed')).toBeInTheDocument();
      expect(screen.getByText('Positive Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Negative Sentiment')).toBeInTheDocument();
      expect(screen.getByText('Neutral Sentiment')).toBeInTheDocument();
    });
  });

  describe('Data Loading States', () => {
    it('shows loading state initially', () => {
      render(<AISummariesDashboard />);
      
      expect(screen.getByText('Loading AI news data...')).toBeInTheDocument();
    });

    it('shows loading spinner during data fetch', () => {
      render(<AISummariesDashboard />);
      
      const loadingSpinner = screen.getByRole('status', { hidden: true });
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches AI news data on component mount', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai-news');
      });
    });

    it('handles successful data fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('AI Breakthrough in Healthcare')).toBeInTheDocument();
        expect(screen.getByText('Machine Learning in Finance')).toBeInTheDocument();
      });
    });

    it('handles API error gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading AI news/)).toBeInTheDocument();
      });
    });

    it('handles 404 response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading AI news/)).toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('displays correct stats after data fetch', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // totalProcessed
        expect(screen.getByText('45')).toBeInTheDocument(); // positiveSentiment
        expect(screen.getByText('15')).toBeInTheDocument(); // negativeSentiment
        expect(screen.getByText('90')).toBeInTheDocument(); // neutralSentiment
      });
    });

    it('shows last updated timestamp', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
      });
    });
  });

  describe('News Display', () => {
    it('renders news items with correct information', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        // Check first news item
        expect(screen.getByText('AI Breakthrough in Healthcare')).toBeInTheDocument();
        expect(screen.getByText('This is a test AI summary for healthcare AI breakthrough')).toBeInTheDocument();
        expect(screen.getByText('Healthcare')).toBeInTheDocument();
        expect(screen.getByText('TechNews')).toBeInTheDocument();
        expect(screen.getByText('positive')).toBeInTheDocument();

        // Check second news item
        expect(screen.getByText('Machine Learning in Finance')).toBeInTheDocument();
        expect(screen.getByText('Test summary for ML in finance applications')).toBeInTheDocument();
        expect(screen.getByText('Finance')).toBeInTheDocument();
        expect(screen.getByText('FinanceDaily')).toBeInTheDocument();
        expect(screen.getByText('neutral')).toBeInTheDocument();
      });
    });

    it('displays sentiment badges with correct colors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        const positiveBadge = screen.getByText('positive');
        const neutralBadge = screen.getByText('neutral');
        
        expect(positiveBadge).toHaveClass('bg-green-100', 'text-green-800');
        expect(neutralBadge).toHaveClass('bg-gray-100', 'text-gray-800');
      });
    });
  });

  describe('User Interactions', () => {
    it('refreshes AI data when refresh button is clicked', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('AI Breakthrough in Healthcare')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh AI Data');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refresh
      });
    });

    it('refreshes stats when stats refresh button is clicked', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAINewsData
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStatsData
        });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // Initial stats
      });

      const statsRefreshButton = screen.getByText('Refresh Stats');
      fireEvent.click(statsRefreshButton);

      await waitFor(() => {
        expect(screen.getByText('200')).toBeInTheDocument(); // Updated stats
      });
    });

    it('shows loading state during refresh', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockAINewsData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('AI Breakthrough in Healthcare')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh AI Data');
      fireEvent.click(refreshButton);

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message for network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading AI news/)).toBeInTheDocument();
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });

    it('displays error message for malformed data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false, error: 'Invalid data format' })
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Error loading AI news/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows no data message when news array is empty', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, news: [], stats: {} })
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/No AI news data available/)).toBeInTheDocument();
        expect(screen.getByText(/Try refreshing the data or check back later/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation', () => {
    it('filters out invalid news items', async () => {
      const invalidData = {
        success: true,
        news: [
          { _id: '1', title: 'Valid News', ai_summary: 'Valid summary' },
          { _id: '2' }, // Missing required fields
          { title: 'No ID' }, // Missing _id
          { _id: '3', title: 'No Summary' } // Missing ai_summary
        ],
        stats: mockAINewsData.stats
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => invalidData
      });

      render(<AISummariesDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Valid News')).toBeInTheDocument();
        expect(screen.queryByText('No ID')).not.toBeInTheDocument();
        expect(screen.queryByText('No Summary')).not.toBeInTheDocument();
      });
    });
  });
});
