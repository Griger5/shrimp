import { pgTable, text, char, uuid } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
	id: uuid().primaryKey(),
	username: text().notNull(),
	email: text().notNull(),
	password_hash: char({ length: 60 }).notNull(),
});
