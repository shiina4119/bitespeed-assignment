import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

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

export const contacts = pgTable("Contact", {
    id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
    phoneNumber: text("phoneNumber"),
    email: text("email"),
    linkedId: integer("linkedId"),
    linkPrecedence: text("linkPrecedence", { enum: ["primary", "secondary"] }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    deletedAt: timestamp("deletedAt"),
});
