ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS build

WORKDIR /app

COPY ./package.json /app/
COPY ./package-lock.json /app/

ENV ESBUILD_BINARY_PATH=/usr/bin/esbuild
RUN apt-get update && apt-get install -y \ 
    esbuild \
    make \
    git \
    python3 \
    xz-utils \
    libatomic1 \
    && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY . ./

RUN make

RUN npm run build

RUN npx drizzle-kit generate

FROM node:${NODE_VERSION}-slim

WORKDIR /app

RUN apt-get update && apt-get install -y postgresql-client

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/.output ./

EXPOSE 3000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]