import { createMessage, getMessages } from "../controllers/message.controller.js";
import { isAdmin, isAuthenticated } from "../middleware/auth.middleware.js";

import express from "express";
const router = express.Router();

router.post("/", createMessage);
router.get("/", isAuthenticated, isAdmin, getMessages);

export default router;
