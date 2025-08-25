#!/usr/bin/env node

// Load environment variables from the consolidated .env file
const fs = require('fs');
const path = require('path');

// Path to the consolidated .env file in the root directory
const envPath = path.join(__dirname, '..', '..', '.env');

if (fs.existsSync(envPath)) {
    console.log('Loading environment from consolidated .env file...');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let loadedCount = 0;
    lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.includes('=')) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            
            if (key && value !== undefined) {
                process.env[key] = value;
                loadedCount++;
                // Only log non-sensitive keys
                if (!key.includes('KEY') && !key.includes('PASSWORD') && !key.includes('SECRET')) {
                    console.log(`Loaded: ${key}=${value}`);
                } else {
                    console.log(`Loaded: ${key}=***`);
                }
            }
        }
    });
    
    console.log(`Environment variables loaded successfully! Total: ${loadedCount} variables`);
} else {
    console.log('Consolidated .env file not found, using local environment...');
    console.log('Expected path:', envPath);
}
