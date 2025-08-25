#!/bin/bash

# Environment Variable Management Script
# Ensures both development and production always use the root .env file

set -e

# Configuration
ROOT_ENV="/home/ubuntu/.env"
PROJECT_DIR="/home/ubuntu/aw/dashboard-aw-main"
PROJECT_ENV="$PROJECT_DIR/.env"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[ENV]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to ensure environment variables are loaded
ensure_env() {
    log "Checking environment configuration..."
    
    # Check if root .env exists
    if [ ! -f "$ROOT_ENV" ]; then
        error "Root .env file not found at $ROOT_ENV"
        error "Please create the consolidated .env file at the root directory"
        return 1
    fi
    
    # Check if project .env symlink exists and is correct
    if [ ! -L "$PROJECT_ENV" ] || [ "$(readlink "$PROJECT_ENV")" != "$ROOT_ENV" ]; then
        log "Creating/updating .env symlink..."
        cd "$PROJECT_DIR"
        rm -f .env
        ln -sf "$ROOT_ENV" .env
        success "Symlink created: .env -> $ROOT_ENV"
    else
        success "Symlink already exists and is correct"
    fi
    
    # Load environment variables
    log "Loading environment variables from $ROOT_ENV..."
    export $(grep -v '^#' "$ROOT_ENV" | xargs)
    
    # Verify critical variables are loaded
    log "Verifying critical environment variables..."
    
    local missing_vars=()
    
    # Check for critical variables
    if [ -z "$NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY" ]; then
        missing_vars+=("NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY")
    fi
    
    if [ -z "$NEXT_PUBLIC_FINNHUB_API_KEY" ]; then
        missing_vars+=("NEXT_PUBLIC_FINNHUB_API_KEY")
    fi
    
    if [ -z "$NEXT_PUBLIC_FMP_API_KEY" ]; then
        missing_vars+=("NEXT_PUBLIC_FMP_API_KEY")
    fi
    
    if [ -z "$MONGODB_URI" ]; then
        missing_vars+=("MONGODB_URI")
    fi
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        success "All critical environment variables are loaded"
    else
        warning "Missing environment variables: ${missing_vars[*]}"
        warning "These may cause issues with the application"
    fi
    
    # Display environment status
    log "Environment configuration summary:"
    echo "  Root .env: $ROOT_ENV"
    echo "  Project .env: $PROJECT_ENV"
    echo "  Symlink target: $(readlink "$PROJECT_ENV")"
    echo "  NODE_ENV: ${NODE_ENV:-'not set'}"
    echo "  API Keys loaded: $([ -n "$NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY" ] && echo "✅" || echo "❌")"
    
    return 0
}

# Function to clean up duplicate environment files
cleanup_env_files() {
    log "Cleaning up duplicate environment files..."
    
    cd "$PROJECT_DIR"
    
    # Remove any .env files that aren't the symlink
    find . -maxdepth 1 -name ".env*" -type f ! -name ".env" | while read -r file; do
        if [ "$(readlink "$file" 2>/dev/null)" != "$ROOT_ENV" ]; then
            log "Removing duplicate file: $file"
            rm -f "$file"
        fi
    done
    
    # Remove any .local files that might contain environment variables
    find . -maxdepth 1 -name ".*.local" -type f | while read -r file; do
        if grep -q "=" "$file" 2>/dev/null; then
            log "Removing potential env file: $file"
            rm -f "$file"
        fi
    done
    
    success "Cleanup completed"
}

# Function to verify the setup
verify_setup() {
    log "Verifying environment setup..."
    
    # Check if we can access the environment variables
    if [ -n "$NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY" ]; then
        success "Environment variables are accessible"
        
        # Test API key format (should be alphanumeric)
        if [[ "$NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY" =~ ^[A-Za-z0-9]+$ ]]; then
            success "API key format is valid"
        else
            warning "API key format may be invalid"
        fi
    else
        error "Environment variables are not accessible"
        return 1
    fi
    
    # Check if the symlink is working
    if [ -L "$PROJECT_ENV" ] && [ -f "$PROJECT_ENV" ]; then
        success "Symlink is working correctly"
    else
        error "Symlink is not working correctly"
        return 1
    fi
    
    return 0
}

# Main execution
main() {
    echo "🔧 Environment Variable Management Script"
    echo "========================================"
    
    # Ensure we're in the right directory
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        error "This script must be run from the project directory"
        exit 1
    fi
    
    # Run the main functions
    if ensure_env && cleanup_env_files && verify_setup; then
        echo ""
        success "Environment setup completed successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "  1. Development: npm run dev"
        echo "  2. Production: npm run build && npm start"
        echo "  3. PM2: pm2 start ecosystem.config.js"
        echo ""
        echo "🔍 To verify environment variables:"
        echo "  source scripts/ensure-env.sh && echo \$NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY"
    else
        echo ""
        error "Environment setup failed!"
        exit 1
    fi
}

# Run main function
main "$@"
