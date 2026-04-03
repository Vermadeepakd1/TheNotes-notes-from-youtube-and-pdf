import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User.js";
import { createToken, clearAuthCookie, setAuthCookie } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6).max(128),
});

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export const register = asyncHandler(async (request, response) => {
  const payload = authSchema.extend({
    name: z.string().trim().min(2).max(80),
  }).parse(request.body);

  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    response.status(409).json({
      error: "An account already exists with this email",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await User.create({
    name: payload.name,
    email: payload.email,
    passwordHash,
  });

  const token = createToken(user._id.toString());
  setAuthCookie(response, token);

  response.status(201).json({
    user: serializeUser(user),
  });
});

export const login = asyncHandler(async (request, response) => {
  const payload = authSchema.parse(request.body);

  const user = await User.findOne({ email: payload.email }).select("+passwordHash");

  if (!user) {
    response.status(401).json({
      error: "Invalid email or password",
    });
    return;
  }

  const passwordMatches = await bcrypt.compare(payload.password, user.passwordHash);

  if (!passwordMatches) {
    response.status(401).json({
      error: "Invalid email or password",
    });
    return;
  }

  const token = createToken(user._id.toString());
  setAuthCookie(response, token);

  response.json({
    user: serializeUser(user),
  });
});

export const logout = asyncHandler(async (_request, response) => {
  clearAuthCookie(response);
  response.json({
    success: true,
  });
});

export const getCurrentUser = asyncHandler(async (request, response) => {
  response.json({
    user: serializeUser(request.user),
  });
});
