# Use a slim Node.js image
FROM node:18-bullseye-slim

# Install dependencies for Chrome + fonts
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-liberation \
    # ... any other needed libs
  && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /usr/src/app

# Copy package info & install
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest
COPY . .

# Expose port
EXPOSE 3000

CMD ["node", "app.js"]
