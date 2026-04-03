import jwt from "jsonwebtoken";

const SEVEN_DAYS_IN_MS = 1000 * 60 * 60 * 24 * 7;

function resolveCookieConfig() {
  const isProduction = process.env.NODE_ENV === "production";
  const envSameSite = (process.env.COOKIE_SAME_SITE || "").trim().toLowerCase();

  const sameSite = envSameSite || (isProduction ? "none" : "lax");

  const envSecure = (process.env.COOKIE_SECURE || "").trim().toLowerCase();
  const secure = envSecure
    ? envSecure === "true"
    : sameSite === "none" || isProduction;

  return {
    sameSite,
    secure,
  };
}

export function createToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function setAuthCookie(response, token) {
  const cookieName = process.env.COOKIE_NAME || "smart_notes_token";
  const { sameSite, secure } = resolveCookieConfig();

  response.cookie(cookieName, token, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: SEVEN_DAYS_IN_MS,
  });
}

export function clearAuthCookie(response) {
  const cookieName = process.env.COOKIE_NAME || "smart_notes_token";
  const { sameSite, secure } = resolveCookieConfig();

  response.clearCookie(cookieName, {
    httpOnly: true,
    sameSite,
    secure,
  });
}
