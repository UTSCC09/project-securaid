# Stage 1: Build the server
FROM --platform=linux/amd64 node:lts-slim as build

# Create app directory
WORKDIR /app

# Copy server files
COPY ./server /app
COPY ./server/.env /app  

# Install dependencies
RUN npm install

# Stage 2: Run the server
FROM --platform=linux/amd64 node:lts-slim as main

WORKDIR /app
COPY --from=build /app /app

# Expose the port the server runs on
EXPOSE 4000

# Start the server in production mode
CMD ["npm", "run", "prod"]
