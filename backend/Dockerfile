# Use Node.js LTS (Long Term Support) image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy local code to the container image
COPY . .

# Create the uploads directory to ensure it exists
RUN mkdir -p public/uploads/images

# Expose the port the app runs on
EXPOSE 9000

# Run the web service on container startup
CMD [ "npm", "start" ]
