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

# Build the Next.js application
ENV NEXT_PUBLIC_ESLINT_DISABLE=true
ENV NEXT_LINT=false
RUN npm run build

# Serve the application
FROM node:18-alpine AS main
WORKDIR /app
COPY --from=build /app /app

EXPOSE 3000
CMD ["npm", "run", "start"]
