'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Global Application Error:', error);
    
    // Optionally log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      console.log('Global Error digest:', error.digest);
    }
  }, [error]);

  const handleReset = () => {
    // Clear the error and try to re-render the page
    reset();
  };

  const handleGoHome = () => {
    // Force a hard refresh to the home page
    window.location.href = '/';
  };

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Application Error</CardTitle>
              <CardDescription className="text-gray-600">
                We encountered a critical error in the application
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error Details - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p className="text-sm text-gray-700 font-mono break-words">
                    {error.message || 'Unknown error occurred'}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleReset} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleGoHome}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-500">
                <p>If this problem persists, please contact support</p>
                <p className="mt-1">
                  <a 
                    href="mailto:support@ackersweldon.com" 
                    className="text-blue-600 hover:underline"
                  >
                    support@ackersweldon.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}
