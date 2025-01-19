# Use a lightweight Node.js image that supports installing packages
FROM node:18-bullseye-slim

# Install dependencies to get Chrome running
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    # Install Chromium and Chromium driver
    chromium \
    chromium-driver \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install NPM dependencies
RUN npm install --omit=dev

# Copy the rest of your code into the container
COPY . .

# Expose the port (if you run locally, not strictly needed on Render)
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
