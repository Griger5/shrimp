import { eq, desc } from "drizzle-orm";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../../utils/db";
import { imagesTable } from "../../db/schema";
import { externalS3Client } from "../../utils/s3";

export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	const images = (await db.select().from(imagesTable).where(eq(imagesTable.user_id, session.user?.id)).orderBy(desc(imagesTable.created_at)));

	const imagesWithURL = await Promise.all(
		images.map(async (img) => {
			const url = await getSignedUrl(
				externalS3Client,
				new GetObjectCommand({
					Bucket: process.env.S3_BUCKET!,
					Key: img.object_key,
				}),
				{ expiresIn: 300 },
			);

			return {
				id: img.id,
				object_key: img.object_key,
				mime_type: img.mime_type,
				size: img.size,
				created_at: img.created_at,
				url,
			};
		}),
	);

	return { images: imagesWithURL };
});
