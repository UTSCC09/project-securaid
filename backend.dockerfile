# Backend Dockerfile
FROM --platform=linux/amd64 node:lts-slim AS build

# Create app directory
WORKDIR /app

# Copy server files and .env
COPY ./server /app
COPY ./.env /app

# Install dependencies
RUN npm install

# Stage 2: Run the server
FROM --platform=linux/amd64 node:lts-slim AS main
WORKDIR /app
COPY --from=build /app /app

# Expose the port the server runs on
EXPOSE 4000

# Start the server in production mode
CMD ["npm", "run", "prod"]