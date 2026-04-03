import jwt from "jsonwebtoken";

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

export function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setAuthCookie(response, token) {
  const cookieName = process.env.COOKIE_NAME || "smart_notes_token";

  response.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SEVEN_DAYS_IN_MS,
  });
}

export function clearAuthCookie(response) {
  const cookieName = process.env.COOKIE_NAME || "smart_notes_token";
  response.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
