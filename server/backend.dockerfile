# Stage 1: Build the server
FROM --platform=linux/amd64 node:lts-slim as build

# Create app directory
WORKDIR /app

# Copy server files
COPY ./server /app
COPY ./server/.env /app  

# Install dependencies
RUN npm install
# Set environment variables for production
ENV NODE_ENV=production
ENV FRONTEND_URL=http://34.130.102.184:3000
ENV MONGODB_URI=mongodb+srv://anish0516u:3A9fIWnjF258wf2N@securaid.3qjq1.mongodb.net/?retryWrites=true&w=majority&connectTimeoutMS=30000
# Stage 2: Run the server
FROM --platform=linux/amd64 node:lts-slim as main

WORKDIR /app
COPY --from=build /app /app



# Expose the port
EXPOSE 4000

# Run the application
CMD ["npm", "run", "prod"]
