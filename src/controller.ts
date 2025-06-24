import { Request, Response } from "express";

export const handleIdentifyRoute = (req: Request, res: Response) => {
  res.json({ Contact: {} });
};
