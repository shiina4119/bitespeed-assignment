import express, { Response } from "express";
import config from "./config.js";

const app = express();

app.get("/", (_, res: Response) => {
  res.send("Hello World!");
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
