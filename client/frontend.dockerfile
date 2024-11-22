# Use the official Node.js image
FROM node:lts-alpine as build

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy the application source
COPY . .

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://34.130.102.184:4000
ENV AWS_ACCESS_KEY_ID=AKIAWYBUINI7HOWFN3OU
ENV AWS_SECRET_ACCESS_KEY=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
ENV AWS_REGION=ca-central-1
ENV AWS_S3_BUCKET_NAME=securaid
ENV ONGODB_URI=mongodb+srv://anish0516u:3A9fIWnjF258wf2N@securaid.3qjq1.mongodb.net/?retryWrites=true&w=majority&connectTimeoutMS=30000
ENV VIRUSTOTAL_API_KEY=5caa1f14d212122d41e27c94c7a7c9e4fff60eeb66aa143366c1e5f03cb10c29

# Build the application
RUN npm run build

# Start the runtime image
FROM node:lts-alpine as runtime
WORKDIR /app

# Copy only the built files from the previous stage
COPY --from=build /app/.next /app/.next
COPY --from=build /app/public /app/public
COPY --from=build /app/package*.json /app/

# Install only production dependencies
RUN npm install --production

# Expose the port
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start"]
