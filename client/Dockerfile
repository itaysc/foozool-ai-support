FROM node:23 AS build

WORKDIR /usr/src/client

COPY client/package.json client/yarn.lock ./

COPY common ./common
COPY client ./client

WORKDIR /usr/src/client/client

RUN yarn install
RUN yarn dev

FROM nginx:alpine
COPY --from=build /usr/src/client/client/build /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
