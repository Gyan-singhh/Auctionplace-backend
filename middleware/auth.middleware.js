import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";

const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    const token =
      (await req.cookies?.accessToken) ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Unauthorized request"));
    }

    const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decodeToken?._id).select("-password");

    if (!user) {
      return next(new ApiError(401, "Invalid Access Token"));
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const isAdmin = asyncHandler((req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    throw new ApiError(403, "Access denied, You are not a admin");
  }
});

const isOwner = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id);

  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  if (
    req.user.role === "admin" ||
    String(product.owner._id) === String(req.user._id)
  ) {
    return next();
  }
  throw new ApiError(403, "You don't have permission to perform this action");
});

export { isAuthenticated, isAdmin, isOwner };
