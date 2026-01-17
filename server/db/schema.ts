import { pgTable, text, char, uuid, integer, timestamp } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: uuid().primaryKey(),
	username: text().notNull(),
	email: text().notNull(),
	password_hash: char({ length: 60 }).notNull(),
});

export const imagesTable = pgTable("images", {
	id: uuid().primaryKey(),
	object_key: text().notNull().unique(),
	mime_type: text().notNull(),
	size: integer().notNull(),
	user_id: uuid().notNull(),
	created_at: timestamp().notNull().defaultNow(),
});
