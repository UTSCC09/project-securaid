#!/bin/bash

# Deploy Script for Next.js Backend and Frontend

# Exit immediately if a command exits with a non-zero status
set -e
echo "-------------------------------------------"
echo "Building backend Docker image..."
echo "___________________________________________"
docker build -t securaid-backend -f backend.dockerfile .

echo "-------------------------------------------"
echo "Building frontend Docker image..."
docker build -t securaid-frontend -f frontend.dockerfile .
echo "___________________________________________"


echo "-------------------------------------------"
echo "Stopping any running containers..."
docker stop $(docker ps -q) || echo "No running containers to stop."
echo "removing orphans..."
docker-compose down --remove-orphans
echo "remove dangling images"
docker rmi $(docker images --filter "dangling=true" -q --no-trunc)
echo "___________________________________________"

echo "-------------------------------------------"
echo "Running docker-compose"
echo "-------------------------------------------"
docker-compose up -d

echo "-------------------------------------------"
echo "Deployment complete!"
echo "-------------------------------------------"