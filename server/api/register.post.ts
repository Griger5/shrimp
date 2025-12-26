import { z } from "zod";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

import { usersTable } from "../db/schema";
import { db } from "../utils/db";

const bodySchema = z.object({
	username: z.string(),
	email: z.email(),
	password: z.string().min(8),
});

export default defineEventHandler(async (event) => {
	const { username, email, password } = await readValidatedBody(event, bodySchema.parse).catch((error) => {
		throw createError({
			statusCode: 400,
			statusMessage: "Ill-formed data. Password should be at least 8 characters.",
		});
	});

	const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

	if (existingUser.length > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: "E-mail is already taken",
		});
	}

	const passwordHash = await bcrypt.hash(password, 10);

	const id = uuidv4();

	const newUser: typeof usersTable.$inferInsert = {
		id: id,
		username: username,
		email: email,
		password_hash: passwordHash,
	};

	await db.insert(usersTable).values(newUser);

	await setUserSession(event, {
		user: {
			name: username,
			id: id,
		},
	});

	return { ok: true };
});
