# Bitespeed Backend Task: Identity Reconciliation

An express.js app written in typescript.
Postgres was selected as the database and drizzle ORM is used for DB operations.

## How to use

POST `/identify` returns a response of the following format

```js
{
  "contact":{
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu","mcfly@hillvalley.edu"]
    "phoneNumbers": ["123456"]
    "secondaryContactIds": [23]
  }
}
```

GET `/all` will return a JSON array containing all the records stored in the database
