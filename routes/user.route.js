import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    getAllUser,
    updateUserImage,
    getUserStats,
} from "../controllers/user.controller.js";
import { isAuthenticated, isAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.js";

import express from "express";
const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/me", isAuthenticated, getCurrentUser);
router.put(
  "/update-image",
  isAuthenticated,
  upload.single("avatar"),
  updateUserImage
);

router.get("/stats", isAuthenticated, getUserStats);
router.get("/users", isAuthenticated, isAdmin, getAllUser);

export default router;
