import { db } from "./db.js";
import { contacts } from "./schema.js";

export const addNewContact = async (
  email: string | null,
  phoneNumber: string | null,
): Promise<number> => {
  const result = await db
    .insert(contacts)
    .values({
      email: email,
      phoneNumber: phoneNumber,
    })
    .returning({
      id: contacts.id,
    });
  return result[0].id;
};
