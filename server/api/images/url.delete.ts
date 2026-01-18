import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { internalS3Client } from "../../utils/s3";
import { db } from "../../utils/db";
import { imagesTable } from "../../db/schema";

const bodySchema = z.object({
	id: z.uuidv4(),
});

export default defineEventHandler(async (event) => {
	const { id } = await readValidatedBody(event, bodySchema.parse).catch((error) => {
		throw createError({
			statusCode: 400,
			statusMessage: "Ill-formed data.",
		});
	});

	const [ image ] = await db.select({ object_key: imagesTable.object_key }).from(imagesTable).where(eq(imagesTable.id, id)).limit(1);
    
    const key = image.object_key;

    await internalS3Client.send(
        new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: key,
        })
    );

    await db.delete(imagesTable).where(eq(imagesTable.id, id));
    
	return { ok: true };
});
