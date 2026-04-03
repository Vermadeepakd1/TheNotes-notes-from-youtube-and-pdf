import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeNote } from "../utils/noteSerializer.js";

export const getSharedNote = asyncHandler(async (request, response) => {
  const note = await Note.findOne({
    shareId: request.params.shareId,
  });

  if (!note) {
    response.status(404).json({
      error: "Shared note not found",
    });
    return;
  }

  response.json({
    note: serializeNote(note),
  });
});
