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

router.post("/identify", async (req: Request, res: Response) => {
  const request: identifyRequest = req.body;
  if (request.email == undefined) {
    request.email = null;
  }
  if (request.phoneNumber == undefined) {
    request.email = null;
  }

  if (!request.email && !request.phoneNumber) {
    res.json({ error: "Either phone number or email must be provided" });
  }

  let response: identifyResponse;

  const matchingRows = await db
    .select()
    .from(contactTable)
    .where(
      or(
        eq(contactTable.phoneNumber, request.phoneNumber),
        eq(contactTable.email, request.email),
      ),
    );

  if (!matchingRows.length) {
    console.log("New record!!!");
    const id = await addNewContact(request.phoneNumber, request.email);
    response = {
      primaryContactId: id,
      emails: request.email ? [request.email] : [],
      phoneNumbers: request.phoneNumber ? [request.phoneNumber] : [],
      secondaryContactIds: [],
    };
    res.json({ contact: response });
    return;
  }

  let newEntry = true; // to check if entry is duplicate
  let primaryId: number = -1;
  let disgraceId: number = -1;
  const emails: string[] = [];
  const phoneNumbers: string[] = [];
  const secondaryIds: number[] = [];
  for (const row of matchingRows) {
    if (row.email == request.email && row.phoneNumber == request.phoneNumber) {
      newEntry = false;
    }
    if (row.linkPrecedence == "primary") {
      if (primaryId == -1) {
        primaryId = row.id;
      } else {
        disgraceId = row.id;
      }
    } else {
      secondaryIds.push(row.id);
    }
    if (row.email) {
      emails.push(row.email);
    }
    if (row.phoneNumber) {
      phoneNumbers.push(row.phoneNumber);
    }
  }

  if (!newEntry) {
    console.log("Duplicate entry :(");
    response = {
      primaryContactId: primaryId,
      emails: emails,
      phoneNumbers: phoneNumbers,
      secondaryContactIds: secondaryIds,
    };
    res.json({ contact: response });
    return;
  }

  if (disgraceId != -1) {
    console.log("Multiple primary IDs");
    let p1 = db
      .update(contactTable)
      .set({ linkedId: primaryId })
      .where(eq(contactTable.linkedId, disgraceId));

    let p2 = db
      .update(contactTable)
      .set({ linkedId: primaryId, linkPrecedence: "secondary" })
      .where(eq(contactTable.id, disgraceId));

    await Promise.all([p1, p2]);

    secondaryIds.push(disgraceId);
  } else {
    console.log("Secondary new record");
    const id = await addNewContact(
      request.phoneNumber,
      request.email,
      primaryId,
    );
    secondaryIds.push(id);
    if (request.email && !emails.includes(request.email)) {
      emails.push(request.email);
    }
    if (request.phoneNumber && !phoneNumbers.includes(request.phoneNumber)) {
      phoneNumbers.push(request.phoneNumber);
    }
  }

  response = {
    primaryContactId: primaryId,
    emails: emails,
    phoneNumbers: phoneNumbers,
    secondaryContactIds: secondaryIds,
  };
  res.json({ contact: response });
  // const primaryRows = await db
  //   .select()
  //   .from(contactTable)
  //   .where(
  //     and(
  //       or(
  //         eq(contactTable.phoneNumber, request.phoneNumber),
  //         eq(contactTable.email, request.email),
  //       ),
  //       eq(contactTable.linkPrecedence, "primary"),
  //     ),
  //   );

  // if (!primaryRows.length) {
  //   // create new record
  //   console.log("Creating new primary row.");
  //   const id = await addNewContact(request.phoneNumber, request.email);
  //   const response: identifyResponse = {
  //     primaryContactId: id,
  //     emails: request.email ? [request.email] : [],
  //     phoneNumbers: request.phoneNumber ? [request.phoneNumber] : [],
  //     secondaryContactIds: [],
  //   };
  //   res.json(response);
  // } else if (primaryRows.length == 1) {
  //   const prow = primaryRows[0];

  //   let response: identifyResponse;
  //   // check if both number and email are the same
  //   if (
  //     prow.email == request.email &&
  //     prow.phoneNumber == request.phoneNumber
  //   ) {
  //     console.log("Both phone number and email are the same.");
  //     response = {
  //       primaryContactId: prow.id,
  //       emails: prow.email ? [prow.email] : [],
  //       phoneNumbers: prow.phoneNumber ? [prow.phoneNumber] : [],
  //       secondaryContactIds: [],
  //     };
  //   } else {
  //     const sec

  //     const secondaryRows = await db
  //       .select()
  //       .from(contactTable)
  //       .where(
  //         and(
  //           eq(contactTable.linkedId, prow.id),
  //           and(
  //             not(eq(contactTable.email, request.email)),
  //             not(eq(contactTable.phoneNumber, request.phoneNumber))
  //           ),
  //         ),
  //       );

  //     // add new row with new info
  //     console.log("Creating new secondary row.");
  //     const id = await addNewContact(
  //       request.phoneNumber,
  //       request.email,
  //       prow.id,
  //     );

  //     const emails: string[] = [];
  //     const phoneNumbers: string[] = [];
  //     const secondaryContactIds: number[] = [];

  //     for (const srow of secondaryRows) {
  //       console.log(srow);
  //       if (srow.email) {
  //         emails.push(srow.email);
  //       }
  //       if (srow.phoneNumber) {
  //         phoneNumbers.push(srow.phoneNumber);
  //       }
  //       secondaryContactIds.push(srow.id);
  //     }
  //     response = {
  //       primaryContactId: prow.id,
  //       emails: emails,
  //       phoneNumbers: phoneNumbers,
  //       secondaryContactIds: secondaryContactIds,
  //     };
  //     response.secondaryContactIds.push(id);
  //   }
  //   res.json(response);
});

export default router;
