/*
{
	id                   Int                   
  phoneNumber          String?
  email                String?
  linkedId             Int? // the ID of another Contact linked to this one
  linkPrecedence       "secondary"|"primary" // "primary" if it's the first Contact in the link
  createdAt            DateTime              
  updatedAt            DateTime              
  deletedAt            DateTime?
}
*/

import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["primary", "secondary"]);

export const contactTable = pgTable("Contact", {
  id: serial("id"),
  phoneNumber: text("phoneNumber"),
  email: text("email"),
  linkedId: integer("linkedId"),
  linkPrecedence: roleEnum("role"),
  createdAt: date("createdAt").notNull(),
  updatedAt: date("updatedAt").notNull(),
  deletedAt: date("deletedAt"),
});
