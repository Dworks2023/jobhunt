import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Fix DNS SRV lookup issues with some networks/ISPs
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { connectDatabase } from "./db.js";
import candidateRoutes from "./routes/candidates.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ==================================================
   FILE PATH SETUP
================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==================================================
   UPLOADS FOLDER
================================================== */

const uploadsDirectory = path.join(__dirname, "uploads");

// Create uploads folder automatically if it does not exist
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true,
  });
}

/* ==================================================
   CORS
================================================== */

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ==================================================
   MIDDLEWARE
================================================== */

// Parse JSON requests
app.use(express.json());

// Parse URL encoded requests
app.use(
  express.urlencoded({
    extended: true,
  }),
);

/* ==================================================
   STATIC UPLOAD FILES
================================================== */

// Example:
// http://localhost:5000/uploads/file-name.pdf
app.use(
  "/uploads",
  express.static(uploadsDirectory),
);

/* ==================================================
   HEALTH CHECK
================================================== */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "JobHunt backend is running",
  });
});

/* ==================================================
   CANDIDATE API ROUTES
================================================== */

// All candidate routes:
//
// GET    /api/candidates
// GET    /api/candidates/:id
// POST   /api/candidates
// PUT    /api/candidates/:id
// PATCH  /api/candidates/:id
// DELETE /api/candidates/:id
//
// Report routes should be handled inside routes/candidates.js
//
// POST   /api/candidates/:id/reports
//
app.use(
  "/api/candidates",
  candidateRoutes,
);

/* ==================================================
   404 HANDLER
================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* ==================================================
   GLOBAL ERROR HANDLER
================================================== */

app.use((error, req, res, next) => {
  console.error("Server Error:", error);

  res.status(
    error.status || 500,
  ).json({
    success: false,
    message:
      error.message ||
      "Internal server error",
  });
});

/* ==================================================
   START SERVER
================================================== */

async function startServer() {
  try {
    // Connect MongoDB first
    await connectDatabase();

    // Start Express server only after MongoDB connects
    app.listen(PORT, () => {
      console.log("=================================");
      console.log("MongoDB API ready");
      console.log(
        `JobHunt backend running on http://localhost:${PORT}`,
      );
      console.log(
        `Health check: http://localhost:${PORT}/api/health`,
      );
      console.log(
        `Candidates API: http://localhost:${PORT}/api/candidates`,
      );
      console.log(
        `Uploads: http://localhost:${PORT}/uploads`,
      );
      console.log("=================================");
    });
  } catch (error) {
    console.error(
      "Failed to start backend:",
      error,
    );

    process.exit(1);
  }
}

startServer();