#!/bin/bash

echo "🧹 AI Dashboard Cleanup Script"
echo "=============================="

# Create backup first
echo "📦 Creating backup..."
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

echo "🔍 Analyzing unused dependencies..."

# Check for unused dependencies (requires npm-check-unused)
if command -v npx &> /dev/null; then
    echo "Running dependency analysis..."
    npx depcheck --ignores="@types/*,eslint*,prettier,tailwindcss,@tailwindcss/*" 2>/dev/null || echo "Install depcheck for detailed analysis: npm install -g depcheck"
fi

# List potentially unused files
echo ""
echo "📁 Potentially unused files/directories:"

# Check for unused test files
if [ -d "test" ] || [ -d "tests" ] || [ -d "__tests__" ]; then
    echo "   - Test directories found (may not be needed in production)"
fi

# Check for unused chart components if not using financials
echo "   - Chart components in components/components/chart/ (only needed for financials page)"

# Check for unused KYC components
echo "   - KYC components in app/KYC/ (only needed for KYC functionality)"

# Check for unused documentation
find . -name "*.md" -not -path "./node_modules/*" | head -5 | sed 's/^/   - /'

echo ""
echo "⚠️  Manual cleanup recommendations:"
echo "   1. If you don't need financials page: rm -rf app/financials components/components/chart"
echo "   2. If you don't need KYC functionality: rm -rf app/KYC services/kyc"
echo "   3. If you don't need general search: rm -rf app/general-search"
echo "   4. Clean up documentation: rm *.md (keep README.md)"
echo ""
echo "🚀 Core pages that should be kept:"
echo "   - app/page.tsx (home)"
echo "   - app/news/page.tsx (news)"
echo "   - app/ai-summaries/ (AI summaries)"
echo "   - app/api/ (API routes)"
echo ""

read -p "🤔 Do you want to remove unused development dependencies? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing development dependencies..."
    
    # Remove testing dependencies
    npm uninstall --save-dev @types/jest jest jsdom
    
    # Remove unused build tools
    npm uninstall --save-dev @types/babel__core @types/babel__generator @types/babel__template @types/babel__traverse
    
    echo "✅ Development dependencies cleaned up"
    echo "📦 Run 'npm install' to ensure everything still works"
fi

echo ""
echo "✨ Cleanup complete!"
echo "💡 Remember to test your application after cleanup"
