import express from "express";
import config from "./config.js";

const app = express();

app.use(express.json());

app.get("/", (_, res) => {
  res.send("Hello world");
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
