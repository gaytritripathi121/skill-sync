import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import mongoose from "mongoose";
import { fileURLToPath } from "node:url";
import { CLERK_PROXY_PATH, clerkProxyMiddleware, getClerkProxyHost } from "./clerkProxyMiddleware.js";
import apiRouter from "./routes.js";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  const origin = req.get("origin");
  const forwardedHost = (req.get("x-forwarded-host") || req.get("host"))
    ?.split(",")[0]
    .trim();
  const forwardedProtocol = (req.get("x-forwarded-proto") || req.protocol)
    ?.split(",")[0]
    .trim();
  const sameOrigin = origin === `${forwardedProtocol}://${forwardedHost}`;

  if (origin && !sameOrigin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "This origin is not allowed." });
  }
  return cors({
    credentials: true,
    origin: origin || true,
  })(req, res, next);
});
app.use(express.json({ limit: "1mb" }));
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.get("/api/healthz", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});
app.use("/api", apiRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found." }));

if (process.env.NODE_ENV === "production") {
  const publicDirectory = fileURLToPath(new URL("../dist/public/", import.meta.url));
  const indexFile = fileURLToPath(new URL("../dist/public/index.html", import.meta.url));
  app.use(express.static(publicDirectory));
  app.get(/.*/, (_req, res, next) => {
    res.sendFile(indexFile, (error) => {
      if (error) next(error);
    });
  });
}

app.use((error, _req, res, _next) => {
  console.error("SERVER ERROR:", error);

  return res.status(500).json({
    error: error?.message || "The server could not complete that request.",
  });
});
export default app;
