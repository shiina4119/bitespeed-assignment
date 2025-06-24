import { Request, Response, Router } from "express";
import { fetchAllRows, handleIdentifyRoute } from "./controller.js";

const router = Router();

router.get("/", (_: Request, res: Response) => {
    res.send("Hello");
});
router.post("/identify", handleIdentifyRoute);
router.get("/all", fetchAllRows);

export default router;
