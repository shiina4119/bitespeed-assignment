import express from "express";
import config from "./config.js";
import routes from "./routes.js";

const app = express();

app.use(express.json());

app.use("/", routes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export default app;
