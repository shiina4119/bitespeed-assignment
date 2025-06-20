import db from "./db.ts";
import { contactTable } from "./schema.ts";

export const addNewContact = async (
  phoneNumber: string | null,
  email: string | null,
  id: number | null = null,
): Promise<number> => {
  const date = new Date();
  const result = await db
    .insert(contactTable)
    .values({
      phoneNumber: phoneNumber,
      email: email,
      linkedId: id,
      linkPrecedence: id ? "secondary" : "primary",
      createdAt: date,
      updatedAt: date,
    })
    .returning({ id: contactTable.id });
  return result[0].id;
};
