import express from "express";
const router = express.Router();

import { signupUser, loginUser, getUsers } from "../controllers/User.js";

import verifyToken from "../middlewares/verifyToken.js";
import {
  handleUploadImage,
  handleAnalyzeImage,
  getUserImages,
  deleteImage,
  updateImageDescription
} from "../controllers/Upload.js";
import {
  testUpload,
  upload as testUploadMiddleware,
} from "../controllers/TestUpload.js";
import { upload } from "../middlewares/multer.js";
import { MulterError } from "multer";

const uploadMiddleware = (req, res, next) => {
    console.log("Multer middleware triggered");
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err instanceof MulterError) {
          return res.status(400).json({ error: "Multer error: " + err.message });
        } else if (err.message === "Only image files are allowed!") {
          return res.status(400).json({ error: err.message });
        } else {
          return res.status(500).json({ error: "Unknown error occurred." });
        }
      }
      next();
    });
  };

router.post("/signup", signupUser);
router.post("/login", loginUser);

router.post("/upload", verifyToken, uploadMiddleware, handleUploadImage);
router.get("/images", verifyToken, getUserImages);
router.delete("/images/:imageId", verifyToken, deleteImage);
router.put("/images/:imageId/description", verifyToken, updateImageDescription);

router.get("/users", verifyToken, getUsers);

// Route for analyzing images from URLs
router.post("/analyze", verifyToken, handleAnalyzeImage);

// Test route for content analysis (no auth required)
router.post("/test-upload", testUploadMiddleware.single("file"), testUpload);

export default router;
