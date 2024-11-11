# Stage 1: Build the frontend
FROM --platform=linux/amd64 node:lts-slim as build

# Create app directory
WORKDIR /app

# Copy frontend files
COPY ./client /app
COPY ./client/.env.local /app  

# Install dependencies and build the app
RUN npm install
RUN npm run build

# Stage 2: Run the frontend
FROM --platform=linux/amd64 node:lts-slim as main

WORKDIR /app
COPY --from=build /app /app

# Expose the port Next.js serves on
EXPOSE 3000

# Start the frontend in production mode
CMD ["npm", "run", "start"]
