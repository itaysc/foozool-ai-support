FROM node:23.2.0

WORKDIR /usr/src/app

# Copy package files first for caching
COPY server/package.json server/yarn.lock ./
COPY common ./common
RUN yarn install

# Install dependencies
WORKDIR /usr/src/app/server
RUN yarn install
# RUN yarn remove bcrypt
# Install build tools for bcrypt
RUN apt-get update && apt-get install -y build-essential python3
# Rebuild bcrypt
RUN npm rebuild bcrypt --build-from-source
# Clean up
RUN apt-get remove -y build-essential python3 && apt-get autoremove -y && apt-get clean

# Install nodemon globally using npm (more reliable than yarn global)
RUN npm install -g nodemon

WORKDIR /usr/src/app
# Copy common folder and server source
COPY server ./server 

WORKDIR /usr/src/app/server
# Start the server
EXPOSE 9220
# CMD ["node", "--inspect=0.0.0.0:9220", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "src/index.ts"]
CMD ["nodemon"]

