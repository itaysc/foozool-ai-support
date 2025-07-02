FROM node:23.2.0

WORKDIR /usr/src/app

# Install ca-certificates to fix SSL issues
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Set environment variables to handle SSL certificate issues
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
ENV NGROK_SKIP_VERIFY=true

# Copy package files first for caching
COPY server/package.json server/yarn.lock ./
COPY common ./common

# Copy server source code (including tsconfig.json) before installing dependencies
COPY server ./server

# Change to server directory where tsconfig.json is located
WORKDIR /usr/src/app/server

# Debug: Check what files are present
RUN ls -la && echo "=== Checking for tsconfig.json ===" && ls -la tsconfig.json || echo "tsconfig.json not found!"

# Install dependencies (this will now have access to tsconfig.json)
RUN yarn install

# Install build tools for bcrypt
RUN apt-get update && apt-get install -y build-essential python3
# Rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source
# Clean up
RUN apt-get remove -y build-essential python3 && apt-get autoremove -y && apt-get clean

# Install nodemon globally using npm (more reliable than yarn global)
RUN npm install -g nodemon

# Build the TypeScript code with explicit config path
RUN yarn build

# Start the server
EXPOSE 9220
# CMD ["node", "--inspect=0.0.0.0:9220", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/index.ts"]
CMD ["nodemon"]

