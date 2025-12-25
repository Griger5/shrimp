import { pgTable, text, char, uuid } from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const usersTable = pgTable("users", {
	id: uuid().primaryKey().$defaultFn(uuidv4),
	username: text().notNull(),
	email: text().notNull(),
	password_hash: char({ length: 60 }).notNull(),
});
