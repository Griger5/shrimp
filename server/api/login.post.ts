import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { usersTable } from "../db/schema";
import { db } from "../utils/db";

const bodySchema = z.object({
	email: z.email(),
	password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
	const { email, password } = await readValidatedBody(event, bodySchema.parse).catch((error) => {
		throw createError({
			statusCode: 400,
			statusMessage: "Ill-formed data.",
		});
	});

	const user = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

	if (user.length > 0) {
		if (await bcrypt.compare(password, user[0].password_hash)) {
			await setUserSession(event, {
				user: {
					name: user[0].username,
					id: user[0].id,
				},
			});
		}
		else {
			throw createError({
				statusCode: 401,
				statusMessage: "Wrong email or password.",
			});
		}
	}
	else {
		throw createError({
			statusCode: 401,
			statusMessage: "Wrong email or password.",
		});
	}
});
