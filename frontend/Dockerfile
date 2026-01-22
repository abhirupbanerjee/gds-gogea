# Use Node.js base image
FROM node:18

# Set working directory in the container
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./

# Install expo-cli globally and project dependencies
RUN npm install -g expo-cli && npm install

# Copy the full project
COPY . .

# Expose common Expo ports
EXPOSE 19000 19001 19002 19006 8081

# Start Expo with tunnel enabled
CMD ["npx", "expo", "start","--offline"]
