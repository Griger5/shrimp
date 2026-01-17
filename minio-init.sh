#!/bin/sh
set -e

until mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} --api S3v4 --path on; do
    echo "Waiting for MinIO..."
    sleep 2
done

mc mb --ignore-existing local/${S3_BUCKET}

echo "MinIO initialization complete."