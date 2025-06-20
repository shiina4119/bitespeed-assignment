import { Request, Response, Router } from "express";
import { identifyRequest, identifyResponse } from "./interface.ts";
import db from "./db.ts";
import { contactTable } from "./schema.ts";
import { and, eq, not, or } from "drizzle-orm";
import { addNewContact } from "./controller.ts";

const router = Router();

router.get("/", (_, res) => {
  res.send("Hello world!");
});

function log(request: identifyRequest, message: string) {
  console.log(request);
  console.log(message);
}

router.post("/identify", async (req: Request, res: Response) => {
  const request: identifyRequest = req.body;
  if (request.email == undefined) {
    request.email = null;
  }
  if (request.phoneNumber == undefined) {
    request.phoneNumber = null;
  }

  /*

  check for duplicate
  check for 2 primary rows
  
  */

  if (!request.email && !request.phoneNumber) {
    res.json({ error: "Either phone number or email must be provided" });
    return;
  }

  let response: identifyResponse;

  let rows = await db
    .select()
    .from(contactTable)
    .where(
      and(
        eq(contactTable.email, request.email),
        eq(contactTable.phoneNumber, request.phoneNumber),
      ),
    );

  // check for duplicates
  if (rows.length) {
    log(request, "duplicate");
    let primaryId = rows[0].linkedId != null ? rows[0].linkedId : rows[0].id;
    rows = await db
      .select()
      .from(contactTable)
      .where(
        or(
          eq(contactTable.id, primaryId),
          eq(contactTable.linkedId, primaryId),
        ),
      );

    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryIds: number[] = [];

    for (const row of rows) {
      if (row.linkedId) {
        secondaryIds.push(row.id);
      }
      if (row.email) {
        emails.add(row.email);
      }
      if (row.phoneNumber) {
        phoneNumbers.add(row.phoneNumber);
      }
    }
    response = {
      primaryContactId: primaryId,
      emails: Array.from(emails.values()),
      phoneNumbers: Array.from(phoneNumbers.values()),
      secondaryContactIds: secondaryIds,
    };
    res.json(response);
    return;
  }

  let primaryRowsPromise = db
    .select()
    .from(contactTable)
    .where(
      and(
        or(
          eq(contactTable.email, request.email),
          eq(contactTable.phoneNumber, request.phoneNumber),
        ),
        eq(contactTable.linkPrecedence, "primary"),
      ),
    );

  let secondaryRowsPromise = db
    .select()
    .from(contactTable)
    .where(
      and(
        or(
          eq(contactTable.email, request.email),
          eq(contactTable.phoneNumber, request.phoneNumber),
        ),
        eq(contactTable.linkPrecedence, "secondary"),
      ),
    );

  let [primaryRows, secondaryRows] = await Promise.all([
    primaryRowsPromise,
    secondaryRowsPromise,
  ]);

  if (!primaryRows.length) {
    if (secondaryRows.length) {
      log(request, "new secondary record");
      let idPromise = addNewContact(
        request.phoneNumber,
        request.email,
        secondaryRows[0].linkedId,
      );
      let primaryRowPromise = db
        .select()
        .from(contactTable)
        .where(eq(contactTable.id, secondaryRows[0].linkedId));

      const [id, primaryRow] = await Promise.all([
        idPromise,
        primaryRowPromise,
      ]);
      let emails = new Set<string>();
      if (primaryRow[0].email) {
        emails.add(primaryRow[0].email);
      }
      let phoneNumbers = new Set<string>();
      if (primaryRow[0].phoneNumber) {
        phoneNumbers.add(primaryRow[0].phoneNumber);
      }
      let secondaryIds = [];
      for (let row of secondaryRows) {
        secondaryIds.push(row.id);
        if (row.email) {
          emails.add(row.email);
        }
        let phoneNumbers = new Set<string>();
        if (row.phoneNumber) {
          phoneNumbers.add(row.phoneNumber);
        }
      }

      response = {
        primaryContactId: primaryRow[0].id,
        emails: Array.from(emails.values()),
        phoneNumbers: Array.from(phoneNumbers.values()),
        secondaryContactIds: secondaryIds,
      };
      res.json(response);
    } else {
      // new primary record
      log(request, "new primary record");
      const id = await addNewContact(request.phoneNumber, request.email);
      const emails = new Set<string>();
      if (request.email) {
        emails.add(request.email);
      }
      const phoneNumbers = new Set<string>();
      if (request.phoneNumber) {
        phoneNumbers.add(request.phoneNumber);
      }

      response = {
        primaryContactId: id,
        emails: Array.from(emails.values()),
        phoneNumbers: Array.from(phoneNumbers.values()),
        secondaryContactIds: [],
      };
    }
  } else if (primaryRows.length == 1) {
    // new secondary record
    log(request, "new secondary record");
    const emails = new Set<string>();
    if (primaryRows[0].email) {
      emails.add(primaryRows[0].email);
    }
    const phoneNumbers = new Set<string>();
    if (primaryRows[0].phoneNumber) {
      phoneNumbers.add(primaryRows[0].phoneNumber);
    }
    const id = await addNewContact(
      request.phoneNumber,
      request.email,
      primaryRows[0].id,
    );
    const secondaryIds = [id];
    for (const row of secondaryRows) {
      secondaryIds.push(row.id);
      if (row.email) {
        emails.add(row.email);
      }
      if (row.phoneNumber) {
        phoneNumbers.add(row.phoneNumber);
      }
    }

    response = {
      primaryContactId: primaryRows[0].id,
      emails: Array.from(emails.values()),
      phoneNumbers: Array.from(phoneNumbers.values()),
      secondaryContactIds: secondaryIds,
    };
  } else {
    // multiple primary records
    log(request, "multiple primary records");
    let p1 = db
      .update(contactTable)
      .set({ linkedId: primaryRows[0].id })
      .where(eq(contactTable.linkedId, primaryRows[1].id));

    let p2 = db
      .update(contactTable)
      .set({ linkedId: primaryRows[0].id, linkPrecedence: "secondary" })
      .where(eq(contactTable.id, primaryRows[1].id));

    await Promise.all([p1, p2]);

    let rows = await db
      .select()
      .from(contactTable)
      .where(
        or(
          eq(contactTable.id, primaryRows[0].id),
          eq(contactTable.linkedId, primaryRows[0].id),
        ),
      );

    let primaryId = -1;
    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();
    const secondaryIds = [];
    for (const row of rows) {
      if (!row.linkedId == null) {
        primaryId = row.id;
      } else {
        secondaryIds.push(row.id);
      }
      if (row.email) {
        emails.add(row.email);
      }
      if (row.phoneNumber) {
        phoneNumbers.add(row.phoneNumber);
      }
    }

    response = {
      primaryContactId: primaryId,
      emails: Array.from(emails.values()),
      phoneNumbers: Array.from(phoneNumbers.values()),
      secondaryContactIds: secondaryIds,
    };
  }

  res.json(response);
});

export default router;
