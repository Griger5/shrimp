import { HeadObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { internalS3Client } from "../../utils/s3";
import { db } from "../../utils/db";
import { imagesTable } from "../../db/schema";

const bodySchema = z.object({
	key: z.string().startsWith("temp/"),
});

export default defineEventHandler(async (event) => {
	const { key } = await readValidatedBody(event, bodySchema.parse).catch((error) => {
		throw createError({
			statusCode: 400,
			statusMessage: "Ill-formed data.",
		});
	});

	const session = await getUserSession(event);

	const head = await internalS3Client.send(
		new HeadObjectCommand({
			Bucket: process.env.S3_BUCKET!,
			Key: key,
		}),
	);

	const finalKey = key.replace("temp/", "images/");

	await internalS3Client.send(
		new CopyObjectCommand({
			Bucket: process.env.S3_BUCKET!,
			CopySource: encodeURIComponent(`${process.env.S3_BUCKET}/${key}`),
			Key: finalKey,
			ContentType: head.ContentType,
		}),
	);

	await internalS3Client.send(
		new DeleteObjectCommand({
			Bucket: process.env.S3_BUCKET!,
			Key: key,
		}),
	);

	const id = uuidv4();

	const newImage: typeof imagesTable.$inferInsert = {
		id: id,
		object_key: finalKey,
		mime_type: head.ContentType!,
		size: Number(head.ContentLength),
		user_id: session.user?.id,
	};

	await db.insert(imagesTable).values(newImage);

	return { id: id };
});
