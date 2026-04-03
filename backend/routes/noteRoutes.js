import { Router } from "express";
import {
  deleteNote,
  generateNote,
  getNote,
  listNotes,
  regenerateNote,
  toggleArchive,
  toggleComplete,
  upload,
} from "../controllers/noteController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listNotes);
router.get("/:noteId", getNote);
router.post("/generate", upload.single("file"), generateNote);
router.post("/:noteId/regenerate", regenerateNote);
router.patch("/:noteId/complete", toggleComplete);
router.patch("/:noteId/archive", toggleArchive);
router.delete("/:noteId", deleteNote);

export default router;
