#!/bin/sh

cd /app

until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}"; do
  echo "Waiting for PostgreSQL..."
  sleep 1
done

echo "Running Drizzle migrations..."
npx drizzle-kit migrate

echo "Starting Nuxt app..."
exec node server/index.mjs