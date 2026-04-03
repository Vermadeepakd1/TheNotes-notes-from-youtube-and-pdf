import { Router } from "express";
import { getSharedNote } from "../controllers/publicController.js";

const router = Router();

router.get("/notes/:shareId", getSharedNote);

export default router;
