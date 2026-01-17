import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { externalS3Client } from "../../utils/s3";

const bodySchema = z.object({
	contentType: z.string().startsWith("image/"),
	size: z.number(),
});

export default defineEventHandler(async (event) => {
	const { contentType } = await readValidatedBody(event, bodySchema.parse).catch((error) => {
		throw createError({
			statusCode: 400,
			statusMessage: "Ill-formed data.",
		});
	});

	const key = `temp/${uuidv4()}`;

	const command = new PutObjectCommand({
		Bucket: process.env.S3_BUCKET!,
		Key: key,
		ContentType: contentType,
	});

	const uploadURL = await getSignedUrl(externalS3Client, command, {
		expiresIn: 60,
	});

	return { uploadURL: uploadURL, key: key };
});
