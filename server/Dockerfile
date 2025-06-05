FROM node:20

WORKDIR /usr/src/app

# Install system dependencies needed for native modules like bcrypt
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && update-ca-certificates

# Copy package files first for better Docker layer caching
COPY server/package.json server/yarn.lock ./server/
COPY common ./common

# Install dependencies in server directory
WORKDIR /usr/src/app/server

# Configure yarn to use HTTP registry as fallback for certificate issues
RUN yarn config set registry https://registry.npmjs.org/ && \
    yarn config set strict-ssl false && \
    yarn install --frozen-lockfile && \
    yarn config set strict-ssl true

# Install nodemon globally
RUN npm install -g nodemon

# Copy source code
WORKDIR /usr/src/app
COPY server ./server

WORKDIR /usr/src/app/server

EXPOSE 3000
EXPOSE 9220

CMD ["nodemon"]

