import {
  createProduct,
  getAllProducts,
  getWonProducts,
  getProductById,
  deleteProduct,
  updateProduct,
  verifyAndAddCommissionProductByAdmin,
  getAllProductsofUser,
} from "../controllers/product.controller.js";
import { isAuthenticated, isAdmin, isOwner } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.js";

import express from "express";
const router = express.Router();

router.get("/user", isAuthenticated, getAllProductsofUser);
router.get("/won", isAuthenticated, getWonProducts);

router.get("/", getAllProducts);
router.post("/", isAuthenticated, upload.single("image"), createProduct);
router.get("/:id", getProductById);
router.delete("/:id", isAuthenticated, isOwner, deleteProduct);
router.put("/:id", isAuthenticated, upload.single("image"), updateProduct);

router.patch(
  "/commission/:id",
  isAuthenticated,
  isAdmin,
  verifyAndAddCommissionProductByAdmin
);

export default router;
