import { db } from "./db.js";
import { contacts } from "./schema.js";

type Contact = typeof contacts.$inferSelect;

export const addNewContact = async (
    email: string | null,
    phoneNumber: string | null,
    linkedId: number | null = null,
): Promise<Contact> => {
    const result = await db
        .insert(contacts)
        .values({
            email: email,
            phoneNumber: phoneNumber,
            linkedId: linkedId,
            linkPrecedence: linkedId ? "secondary" : "primary",
        })
        .returning();
    return result[0];
};
