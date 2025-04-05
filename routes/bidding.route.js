import {
  placeBid,
  getBiddingHistory,
  sellProduct,
} from "../controllers/bidding.controller.js";
import { isAuthenticated } from "../middleware/auth.middleware.js";

import express from "express";
const router = express.Router();

router.get("/:id", getBiddingHistory);
router.post("/:id", isAuthenticated, placeBid);
router.patch("/:id/sell", isAuthenticated, sellProduct);

export default router;
