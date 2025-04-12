#!/bin/bash

# Print current directory for debugging
echo "Current directory: $(pwd)"

# Install dependencies
npm install

# Build the app
CI= npm run build

# Success message
echo "Build completed successfully!"
