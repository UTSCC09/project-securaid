# Use a stable version of Node.js
FROM node:18-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json specifically to leverage Docker cache
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy all other frontend files from the client directory
COPY client .

# Load environment variables for production during the build
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://34.130.102.184

# Build the Next.js application
RUN npm run build

# Serve the application
FROM node:18-alpine AS main
WORKDIR /app
COPY --from=build /app /app

# Expose the frontend port
EXPOSE 3000
CMD ["npm", "run", "start"]
