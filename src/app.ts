import express from "express";
import config from "./config.ts";
import router from "./routes.ts";

const app = express();

app.use(express.json());

app.use("/", router);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
