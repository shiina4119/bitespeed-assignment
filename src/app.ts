import express, { Response } from "express";
import config from "./config.js";
import router from "./routes.js"

const app = express();

app.use("/", router);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
