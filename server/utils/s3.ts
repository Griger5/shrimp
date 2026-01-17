import { S3Client } from "@aws-sdk/client-s3";

export const internalS3Client = new S3Client({
	endpoint: process.env.S3_URL_INTERNAL!,
	region: "eu-central-1",
	credentials: {
		accessKeyId: process.env.MINIO_ROOT_USER!,
		secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
	},
	forcePathStyle: true,
});

export const externalS3Client = new S3Client({
	endpoint: process.env.S3_URL_EXTERNAL!,
	region: "eu-central-1",
	credentials: {
		accessKeyId: process.env.MINIO_ROOT_USER!,
		secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
	},
	forcePathStyle: true,
});
