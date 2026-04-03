import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function requireAuth(request, response, next) {
  const cookieName = process.env.COOKIE_NAME || "smart_notes_token";
  const token = request.cookies?.[cookieName];

  if (!token) {
    response.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("name email");

    if (!user) {
      response.status(401).json({
        error: "User not found",
      });
      return;
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({
      error: "Session expired. Please sign in again.",
    });
  }
}
