# ---- Build Stage ----
FROM node:20 AS builder

WORKDIR /usr/src/app

# Install CA certificates
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

# Copy package files and install dependencies
COPY server/package.json server/yarn.lock ./
COPY common ./common
COPY server ./

RUN yarn install --frozen-lockfile
RUN yarn build

# ---- Production Stage ----
FROM node:20-slim

WORKDIR /usr/src/app

# Install CA certificates
RUN apt-get update && apt-get install -y ca-certificates && update-ca-certificates

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/yarn.lock ./
COPY --from=builder /usr/src/app/common ./common

RUN yarn install --production --frozen-lockfile

ENV NODE_ENV=production

EXPOSE 9220

CMD ["node", "dist/index.js"] 