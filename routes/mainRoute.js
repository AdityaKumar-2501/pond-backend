import express from "express";
const router = express.Router();

import { signupUser, loginUser, getUsers } from "../controllers/User.js";

import verifyToken from "../middlewares/verifyToken.js";
import { handleUploadImage } from "../controllers/Upload.js";
import { testUpload, upload as testUploadMiddleware } from "../controllers/TestUpload.js";
import { upload } from "../middlewares/multer.js";
import { MulterError } from "multer";

router.post("/signup", signupUser);
router.post("/login", loginUser);

router.post(
    "/upload",
    verifyToken,
    // handles error while uploading
    (req, res, next) => {
        upload.single("image")(req, res, (err) => {
            if (err) {
                if (err instanceof MulterError) {
                    return res
                        .status(400)
                        .json({ error: "Multer error: " + err.message });
                } else if (err.message === "Only image files are allowed!") {
                    return res.status(400).json({ error: err.message });
                } else {
                    return res
                        .status(500)
                        .json({ error: "Unknown error occurred." });
                }
            }
            next();
        });
    },
    handleUploadImage
);

router.get("/users", verifyToken, getUsers);

// Test route for content analysis (no auth required)
router.post("/test-upload", testUploadMiddleware.single('file'), testUpload);

export default router;
