# Use the official Node.js image
FROM node:lts-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the application source
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV FRONTEND_URL=http://34.130.102.184:3000
ENV MONGODB_URI=mongodb+srv://anish0516u:3A9fIWnjF258wf2N@securaid.3qjq1.mongodb.net/?retryWrites=true&w=majority&connectTimeoutMS=30000

# Expose the port
EXPOSE 4000

# Run the application
CMD ["npm", "run", "prod"]
