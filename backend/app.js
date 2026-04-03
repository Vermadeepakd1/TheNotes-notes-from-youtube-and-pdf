import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectToDatabase } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const configuredFrontendUrls = expandLoopbackOrigins(
  (process.env.FRONTEND_URL || "http://127.0.0.1:5173").split(","),
);

function expandLoopbackOrigins(urls) {
  const normalizedUrls = urls
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url) => url.replace(/\/$/, ""));
  const expandedUrls = new Set(normalizedUrls);

  normalizedUrls.forEach((url) => {
    try {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname.replace(/^www\./i, "");

      if (hostname === "127.0.0.1") {
        parsedUrl.hostname = "localhost";
        expandedUrls.add(parsedUrl.toString().replace(/\/$/, ""));
      }

      if (hostname === "localhost") {
        parsedUrl.hostname = "127.0.0.1";
        expandedUrls.add(parsedUrl.toString().replace(/\/$/, ""));
      }
    } catch {
      // Ignore invalid URLs and keep the original value only.
    }
  });

  return [...expandedUrls];
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (configuredFrontendUrls.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_request, response) => {
  response.json({
    name: "Smart Notes Generator API",
    version: "1.0.0",
    status: "ready",
  });
});

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/public", publicRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.statusCode || 500).json({
    error: error.message || "Internal server error",
  });
});

async function startServer() {
  await connectToDatabase();

  app.listen(port, () => {
    console.log(`Smart Notes backend running on http://127.0.0.1:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
