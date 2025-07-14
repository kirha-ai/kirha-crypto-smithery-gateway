FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install --include=dev

# Copy source files
COPY . .

# Build the TypeScript code
RUN npm run build

# The server will be started by Smithery's runtime
CMD ["node", "dist/index.js"]