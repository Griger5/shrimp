ARG NODE_VERSION=20.19.0

FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

COPY ./package.json /app/
COPY ./package-lock.json /app/

RUN npm install

COPY . ./

RUN npm run build

FROM node:${NODE_VERSION}-slim

WORKDIR /app

COPY --from=build /app/.output ./

EXPOSE 3000

CMD ["node","/app/server/index.mjs"]