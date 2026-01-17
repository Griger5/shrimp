import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { externalS3Client } from "../../utils/s3";
import { db } from "../../utils/db";
import { imagesTable } from "../../db/schema";

const querySchema = z.object({
	id: z.string(),
});

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const parsed = querySchema.parse(query);

	const id = parsed.id;

	const session = await getUserSession(event);

	const [image] = await db.select().from(imagesTable).where(eq(imagesTable.id, id)).limit(1);

	if (!image || image.user_id !== session.user?.id) {
		throw createError({ 
			statusCode: 404,
			statusMessage: "Image not found.",
		});
	}

	const url = await getSignedUrl(
		externalS3Client,
		new GetObjectCommand({
			Bucket: process.env.S3_BUCKET!,
			Key: image.object_key,
		}),
		{ expiresIn: 300 },
	);

	return { url: url };
});
