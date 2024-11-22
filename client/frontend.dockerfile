# Use the official Node.js image
FROM node:18-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json specifically to leverage Docker cache
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy all other frontend files from the client directory
COPY client .

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://34.130.102.184:4000
ENV AWS_ACCESS_KEY_ID=AKIAWYBUINI7HOWFN3OU
ENV AWS_SECRET_ACCESS_KEY=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
ENV AWS_REGION=ca-central-1
ENV AWS_S3_BUCKET_NAME=securaid
ENV ONGODB_URI=mongodb+srv://anish0516u:3A9fIWnjF258wf2N@securaid.3qjq1.mongodb.net/?retryWrites=true&w=majority&connectTimeoutMS=30000
ENV VIRUSTOTAL_API_KEY=5caa1f14d212122d41e27c94c7a7c9e4fff60eeb66aa143366c1e5f03cb10c29

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
