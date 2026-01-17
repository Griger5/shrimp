import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { imagesTable } from "../../db/schema";

export default defineEventHandler(async (event) => {
    const session = await getUserSession(event);

    const images = await db.select().from(imagesTable).where(eq(imagesTable.user_id, session.user?.id));

    return { images: images };
});
