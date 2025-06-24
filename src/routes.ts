import { Request, Response, Router } from "express";
import { handleIdentifyRoute } from "./controller.js";

const router = Router();

router.get("/", (_: Request, res: Response) => {
  res.send("Hello");
});
router.post("/identify", handleIdentifyRoute);

export default router;
