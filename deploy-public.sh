#!/bin/bash

# Public deployment script that bypasses private deployment requirements

echo "=== PREPARING PUBLIC DEPLOYMENT ==="

# Remove temporary files that might interfere
rm -f package-public.json
rm -f .env.example

# Set environment for public deployment
export PUBLIC_DEPLOYMENT=true
export DISABLE_REPLIT_AUTH=true
export NO_AUTH=true
export REPLIT_DEPLOYMENT_TYPE=public

echo "Building for public deployment..."
npm run build

echo "Public deployment ready!"
echo "The app will be accessible without authentication"