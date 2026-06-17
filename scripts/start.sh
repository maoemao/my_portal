#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js db push --accept-data-loss

echo "Initializing admin account..."
node scripts/init-admin.js

echo "Starting application..."
node server.js
