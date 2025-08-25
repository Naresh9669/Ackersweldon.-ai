#!/bin/bash

# Build verification script
# Ensures all static assets are properly configured

set -e

echo "🔍 Verifying Next.js build output..."

# Check if standalone directory exists
if [ ! -d ".next/standalone" ]; then
    echo "❌ .next/standalone directory not found"
    echo "   Run: npm run build:prod"
    exit 1
fi

# Check if server.js exists
if [ ! -f ".next/standalone/server.js" ]; then
    echo "❌ server.js not found in standalone directory"
    exit 1
fi

# Check if static assets directory exists
if [ ! -d ".next/standalone/.next/static" ]; then
    echo "❌ Static assets directory not found"
    echo "   This will cause 404 errors for JS, CSS, and font files"
    exit 1
fi

# Check static asset subdirectories
echo "📁 Checking static asset structure..."

# Check chunks directory
if [ -d ".next/standalone/.next/static/chunks" ]; then
    chunk_count=$(find .next/standalone/.next/static/chunks -type f | wc -l)
    echo "✅ Chunks directory: $chunk_count JavaScript files"
else
    echo "❌ Chunks directory missing - JavaScript files will 404"
fi

# Check CSS directory
if [ -d ".next/standalone/.next/static/css" ]; then
    css_count=$(find .next/standalone/.next/static/css -type f | wc -l)
    echo "✅ CSS directory: $css_count CSS files"
else
    echo "❌ CSS directory missing - Stylesheets will 404"
fi

# Check media directory (fonts, images)
if [ -d ".next/standalone/.next/static/media" ]; then
    media_count=$(find .next/standalone/.next/static/media -type f | wc -l)
    echo "✅ Media directory: $media_count font/media files"
else
    echo "❌ Media directory missing - Fonts and media will 404"
fi

# Check build ID directory
build_id_dirs=$(find .next/standalone/.next/static -maxdepth 1 -type d -name "*" | grep -v "static$" | grep -v "chunks\|css\|media" | wc -l)
if [ "$build_id_dirs" -gt 0 ]; then
    echo "✅ Build ID directory: Found $build_id_dirs build ID directories"
else
    echo "❌ Build ID directory missing - This may cause asset loading issues"
fi

# Check total static asset count
total_assets=$(find .next/standalone/.next/static -type f | wc -l)
echo "📊 Total static assets: $total_assets"

# Verify critical files that were causing 404s
echo "🔍 Checking for previously problematic assets..."

# Check for app-pages-internals.js pattern
if find .next/standalone/.next/static -name "*app-pages-internals*" | grep -q .; then
    echo "✅ app-pages-internals.js found"
else
    echo "⚠️  app-pages-internals.js not found (may be named differently)"
fi

# Check for main-app.js pattern
if find .next/standalone/.next/static -name "*main-app*" | grep -q .; then
    echo "✅ main-app.js found"
else
    echo "⚠️  main-app.js not found (may be named differently)"
fi

# Check for page.js pattern
if find .next/standalone/.next/static -name "*page*" | grep -q .; then
    echo "✅ page.js found"
else
    echo "⚠️  page.js not found (may be named differently)"
fi

# Check for font files
font_files=$(find .next/standalone/.next/static -name "*.woff*" -o -name "*.ttf" -o -name "*.otf" | wc -l)
if [ "$font_files" -gt 0 ]; then
    echo "✅ Font files found: $font_files files"
else
    echo "⚠️  No font files found (may cause font loading issues)"
fi

echo ""
echo "🎯 Build Verification Summary:"
echo "================================"

if [ "$total_assets" -gt 50 ]; then
    echo "✅ Build looks healthy - Static assets should load correctly"
    echo "🚀 Ready for production deployment!"
else
    echo "⚠️  Build may have issues - Check the warnings above"
fi

echo ""
echo "📋 Next steps:"
echo "1. Deploy .next/standalone/ to your server"
echo "2. Start with: node server.js"
echo "3. Ensure nginx/proxy is configured correctly"
echo ""
echo "🔗 If you still see 404 errors, check:"
echo "   - nginx configuration for /_next/static/ paths"
echo "   - All static assets were copied to standalone directory"
echo "   - Build output structure matches expected layout"
