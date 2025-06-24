import { Request, Response } from "express";
import { addNewContact } from "./helper.js";
import { db } from "./db.js";
import { contacts } from "./schema.js";
import { eq, not, or } from "drizzle-orm";

type Contact = typeof contacts.$inferSelect;

export const handleIdentifyRoute = async (req: Request, res: Response) => {
    const email = req.body.email ? req.body.email : null;
    const phoneNumber = req.body.phoneNumber ? req.body.phoneNumber : null;

    if (!email && !phoneNumber) {
        res.status(400).json({
            error: "No email or Phone Number provided",
        });
        return;
    }

    const matchingRows = await db
        .select()
        .from(contacts)
        .where(
            or(
                eq(contacts.email, email),
                eq(contacts.phoneNumber, phoneNumber),
            ),
        );

    let primaryRow: Contact | null = null;
    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryIds = new Array<number>();

    if (!matchingRows.length) {
        // new primary record
        // console.log("new primary row");
        primaryRow = await addNewContact(email, phoneNumber);
        if (email) {
            emails.add(email);
        }
        if (phoneNumber) {
            phoneNumbers.add(phoneNumber);
        }
    } else {
        const primaryRows = matchingRows.filter(
            (contact) => contact.linkPrecedence == "primary",
        );
        primaryRow = primaryRows[0];

        const duplicates = matchingRows.filter(
            (contact) =>
                contact.email === email && contact.phoneNumber === phoneNumber,
        );
        if (duplicates.length) {
            // duplicate row
            // console.log("duplicate");
            for (const row of matchingRows) {
                if (row.email) {
                    emails.add(row.email);
                }
                if (row.phoneNumber) {
                    phoneNumbers.add(row.phoneNumber);
                }
                if (row.linkPrecedence == "secondary") {
                    secondaryIds.push(row.id);
                }
            }
        } else if (!email || !phoneNumber) {
            // no new info
            // console.log("no new info");
            for (const row of matchingRows) {
                if (row.email) {
                    emails.add(row.email);
                }
                if (row.phoneNumber) {
                    phoneNumbers.add(row.phoneNumber);
                }
                if (row.linkPrecedence == "secondary") {
                    secondaryIds.push(row.id);
                }
            }
        } else if (primaryRows.length > 1) {
            // multiple primary rows
            // console.log("multiple primary rows");
            const updateTasks = [];
            for (const row of matchingRows) {
                if (row.id !== primaryRow.id) {
                    updateTasks.push(
                        db
                            .update(contacts)
                            .set({
                                linkedId: primaryRow.id,
                                linkPrecedence: "secondary",
                                updatedAt: new Date(),
                            })
                            .where(eq(contacts.id, row.id)),
                    );
                    secondaryIds.push(row.id);
                }
                if (row.email) {
                    emails.add(row.email);
                }
                if (row.phoneNumber) {
                    phoneNumbers.add(row.phoneNumber);
                }
            }
            await Promise.all(updateTasks);
        } else {
            // new secondary row
            // console.log("new secondary row");
            const secondaryRow = await addNewContact(
                email,
                phoneNumber,
                primaryRow.id,
            );
            for (const row of matchingRows) {
                if (row.email) {
                    emails.add(row.email);
                }
                if (row.phoneNumber) {
                    phoneNumbers.add(row.phoneNumber);
                }
                if (row.linkPrecedence == "secondary") {
                    secondaryIds.push(row.id);
                }
            }
            if (email) {
                emails.add(email);
            }
            if (phoneNumber) {
                phoneNumbers.add(phoneNumber);
            }
            secondaryIds.push(secondaryRow.id);
        }
    }
    const response = {
        contact: {
            primaryContactId: primaryRow?.id,
            emails: Array.from(emails),
            phoneNumbers: Array.from(phoneNumbers),
            secondaryContactIds: secondaryIds,
        },
    };

    res.json(response);
};

export const fetchAllRows = async (_: Request, res: Response) => {
    const rows = await db.select().from(contacts);
    const response = new Array<Contact>();
    for (const row of rows) {
        response.push(row);
    }
    res.json(response);
};

export const deleteAllRecords = async (_: Request, res: Response) => {
    await db.delete(contacts);
    res.json({ message: "DB cleared" });
};
