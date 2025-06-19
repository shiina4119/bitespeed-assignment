import express, { Response } from "express";
import config from "./config.ts";
import router from "./routes.ts";

const app = express();

app.use("/", router);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
