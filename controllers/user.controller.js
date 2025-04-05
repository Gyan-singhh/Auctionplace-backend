import { User } from "../models/user.model.js";
import { asyncHandler } from "../util/asyncHandler.js";
import { Product } from "../models/product.model.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { cloudinary } from "../index.js";

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    throw new ApiError(400, "All fields are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  const userExits = await User.findOne({ email });
  if (userExits) {
    res.status(400);
    throw new ApiError(400, "Email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(400, "Something went wrong while registering the user");
  }

  const token = user.generateAccessToken();
  const cookieName = "accessToken";
  const message = "User Registered successfully";

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };

  return res.status(200).cookie(cookieName, token, cookieOptions).json({
    success: true,
    message,
    createdUser,
    token,
  });
});

const updateUserImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!req.file) {
    throw new ApiError(400, "No image provided");
  }

  const localFilePath = req.file.path;
  const uploadedImage = await uploadOnCloudinary(localFilePath);
  if (!uploadedImage || !uploadedImage?.secure_url) {
    throw new ApiError(400, "Image upload failed");
  }

  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId);
  }

  user.avatar = {
    publicId: uploadedImage.public_id,
    secureUrl: uploadedImage.secure_url,
  };

  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Profile image updated successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please fill full form");
  }

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(400, "No account found with this email!");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = user.generateAccessToken();
  const cookieName = "accessToken";
  const message = "User login successfully";
  user.password = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };

  return res.status(200).cookie(cookieName, token, cookieOptions).json({
    success: true,
    message,
    user,
    token,
  });
});

const logoutUser = asyncHandler(async (req, res, next) => {
  res.clearCookie("accessToken", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  req.user.password = "";
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const getAllUser = asyncHandler(async (req, res) => {
  const userList = await User.find({}).select("-password");

  if (!userList.length) {
    return res.status(404).json(new ApiResponse(404, {}, "No users found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userList, "Users fetched successfully"));
});

const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const balance = req.user.balance;

  const productsCount = await Product.countDocuments({ user: userId });

  const itemsWonCount = await Product.countDocuments({
    soldTo: userId,
    isSoldOut: true,
  });

  const data = {
    balance,
    productsCreated: productsCount,
    itemsWon: itemsWonCount,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, data, "User stats fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getAllUser,
  updateUserImage,
  getUserStats,
};
