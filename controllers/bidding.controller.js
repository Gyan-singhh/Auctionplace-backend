import { asyncHandler } from "../util/asyncHandler.js";
import { User } from "../models/user.model.js";
import { BiddingProduct } from "../models/bidding.model.js";
import { Product } from "../models/product.model.js";
import { sendEmail } from "../util/sendEmail.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";

const placeBid = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  const { price } = req.body;
  const userId = req.user._id;

  if (!price || isNaN(price) || price <= 0) {
    throw new ApiError(400, "Invalid bid amount");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.isSoldOut) {
    throw new ApiError(400, "This product is sold out. Bidding is closed.");
  }

  if (price <= product.price) {
    throw new ApiError(
      400,
      "Your bid must be equal to or higher than the minimum bidding price."
    );
  }

  const existingUserBid = await BiddingProduct.findOne({
    user: userId,
    product: productId,
  });

  const highestBid = await BiddingProduct.findOne({
    product: productId,
  }).sort({ price: -1 });

  const minimumBid =
    Math.max(
      product.price,
      highestBid?.price || 0,
      existingUserBid?.price || 0
    ) + 1;

  if (price <= minimumBid) {
    throw new ApiError(400, `Your bid must be higher than $${minimumBid}`);
  }

  let biddingProduct;
  if (existingUserBid) {
    existingUserBid.price = price;
    biddingProduct = await existingUserBid.save();
  } else {
    biddingProduct = await BiddingProduct.create({
      user: userId,
      product: productId,
      price,
    });
  }

  await product.save();

  return res
    .status(existingUserBid ? 200 : 201)
    .json(
      new ApiResponse(
        existingUserBid ? 200 : 201,
        biddingProduct,
        existingUserBid ? "Bid updated successfully" : "Bid placed successfully"
      )
    );
});

const getBiddingHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const biddingHistory = await BiddingProduct.find({ product: id })
    .sort("-updatedAt")
    .populate("user")
    .populate("product");

  if (!biddingHistory || biddingHistory.length === 0) {
    throw new ApiError(404, "No bidding history found for this product");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        biddingHistory,
        "Bidding history retrieved successfully"
      )
    );
});

const sellProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!id) {
    throw new ApiError(400, "Product ID is required");
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (!product.isVerify) {
    throw new ApiError(400, "Bidding is not verified for this product");
  }

  if (product.isSoldOut) {
    throw new ApiError(400, "Product is already sold out");
  }

  if (String(product.user) !== String(userId)) {
    throw new ApiError(403, "You do not have permission to sell this product");
  }

  const highestBid = await BiddingProduct.findOne({ product: id })
    .sort({ price: -1 })
    .populate("user")
    .lean();

  if (!highestBid) {
    throw new ApiError(400, "No winning bid found for the product");
  }

  const commissionRate = product.commission || 0;
  if (isNaN(commissionRate) || commissionRate < 0) {
    throw new ApiError(400, "Invalid commission rate");
  }

  const commissionAmount = (commissionRate / 100) * highestBid.price;
  const finalPrice = highestBid.price - commissionAmount;

  product.isSoldOut = true;
  product.soldTo = highestBid.user;
  await product.save();

  const admin = await User.findOne({ role: "admin" });
  if (admin) {
    admin.commissionBalance += commissionAmount;
    await admin.save();
  }

  const seller = await User.findById(product.user);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  seller.balance += finalPrice;
  await seller.save();

  try {
    await sendEmail({
      sellerEmail: req.user.email,
      sellerName: req.user.name,
      email: highestBid.user.email,
      subject: "Congratulations! You won the auction!",
      text: `You have won the auction for "${product.title}" with a bid of $${highestBid.price}.`,
    });
  } catch (error) {
    console.error("Failed to send email:", error.message);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product successfully sold!"));
});

export { placeBid, getBiddingHistory, sellProduct };
