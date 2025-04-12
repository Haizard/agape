#!/bin/bash

# Start the health check server in the background
node koyeb-server.js &

# Start the main server in the foreground
node server.js
