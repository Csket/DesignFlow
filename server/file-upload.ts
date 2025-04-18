import express, { Express, Request, Response } from "express";
import multer from "multer";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent collisions
    const uniqueSuffix = `${Date.now()}-${randomBytes(8).toString("hex")}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

// File filter to only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error("Only image files are allowed!"));
  }
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export function setupFileUpload(app: Express) {
  // Route for file uploads
  app.post("/api/upload", (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Use multer to handle the file upload
    upload.array("files", 5)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File too large (max 5MB)" });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        // An unknown error occurred
        return res.status(500).json({ error: err.message });
      }

      // Everything went fine with multer
      const files = req.files as Express.Multer.File[];
      
      // Generate URLs for the uploaded files
      const baseUrl = process.env.NODE_ENV === "production"
        ? `${req.protocol}://${req.get("host")}`
        : `http://localhost:5000`;
        
      const urls = files.map(file => `${baseUrl}/uploads/${file.filename}`);
      
      res.status(200).json({ urls });
    });
  });

  // Serve uploaded files
  app.use("/uploads", express.static(UPLOAD_DIR));
}
