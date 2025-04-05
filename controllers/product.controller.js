import { asyncHandler } from "../util/asyncHandler.js";
import { BiddingProduct } from "../models/bidding.model.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../util/cloudinary.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { ApiError } from "../util/ApiError.js";
import { cloudinary } from "../index.js";
import mongoose from "mongoose";

const createProduct = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    price,
    category = "All",
    commission = 0,
    height,
    length,
    width,
    weight,
  } = req.body;

  const userId = req.user?._id;

  if (
    !title ||
    !description ||
    !price ||
    !category ||
    !height ||
    !length ||
    !width ||
    !weight
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  if (isNaN(price) || price <= 0) {
    throw new ApiError(400, "Price must be a positive number");
  }

  let fileData = {};
  const localFilePath = req.file?.path;

  if (!localFilePath) {
    throw new ApiError(400, "Product image is required");
  }

  try {
    const productImage = await uploadOnCloudinary(localFilePath);

    if (!productImage?.secure_url) {
      throw new ApiError(400, "Image upload failed");
    }

    fileData = {
      url: productImage.secure_url,
      public_id: productImage.public_id,
      alt: title,
    };

    const product = await Product.create({
      user: userId,
      title,
      description,
      price: parseFloat(price),
      category,
      commission: parseFloat(commission),
      height: height ? parseFloat(height) : undefined,
      length: length ? parseFloat(length) : undefined,
      width: width ? parseFloat(width) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      image: fileData,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, product, "Product created successfully"));
  } catch (error) {
    if (fileData.public_id) {
      await cloudinary.uploader
        .destroy(fileData.public_id)
        .catch(console.error);
    }
    throw new ApiError(500, "Product creation failed");
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { title, description, price, category, height, length, width, weight } =
    req.body;
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  const product = await Product.findOne({ _id: id, user: userId });

  if (!product) {
    throw new ApiError(
      404,
      "Product not found or you don't have permission to edit the product"
    );
  }

  if (title && !title.trim()) {
    throw new ApiError(400, "Title cannot be empty");
  }
  if (description && !description.trim()) {
    throw new ApiError(400, "Description cannot be empty");
  }
  if (price && (isNaN(price) || price <= 0)) {
    throw new ApiError(400, "Price must be a positive number");
  }

  let fileData = {};
  let oldImagePublicId = null;

  try {
    if (req.file) {
      const localFilePath = req.file.path;
      const uploadedImage = await uploadOnCloudinary(localFilePath);

      if (!uploadedImage) {
        throw new ApiError(400, "Image upload failed");
      }

      if (product.image?.public_id) {
        oldImagePublicId = product.image.public_id;
      }

      fileData = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
        alt: title || product.title,
      };
    }

    const updateFields = {
      title: title || product.title,
      description: description || product.description,
      price: price ? parseFloat(price) : product.price,
      category: category || product.category,
      commission: product.commission,
      height: height ? parseFloat(height) : product.height,
      length: length ? parseFloat(length) : product.length,
      width: width ? parseFloat(width) : product.width,
      weight: weight ? parseFloat(weight) : product.weight,
      ...(req.file && { image: fileData }),
    };

    const updatedProduct = await Product.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (oldImagePublicId) {
      await cloudinary.uploader.destroy(oldImagePublicId).catch(console.error);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
  } catch (error) {
    if (fileData.public_id) {
      await cloudinary.uploader
        .destroy(fileData.public_id)
        .catch(console.error);
    }

    throw new ApiError(500, "Product updation failed");
  }
});

const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .sort("-createdAt")
    .populate("user")
    .lean();

  if (!products || products.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No products found"));
  }

  const productsWithDetails = await Promise.all(
    products.map(async (product) => {
      const latestBid = await BiddingProduct.findOne({ product: product._id })
        .sort("-createdAt")
        .lean();

      const totalBids = await BiddingProduct.countDocuments({
        product: product._id,
      });

      return {
        ...product,
        biddingPrice: latestBid ? latestBid.price : product.price,
        totalBids,
      };
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, productsWithDetails, "Products fetched successfully")
    );
});

const getAllProductsofUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const products = await Product.find({ user: userId })
    .sort("-createdAt")
    .populate("user")
    .lean();

  if (!products || products.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No products found"));
  }

  const productsWithPrices = await Promise.all(
    products.map(async (product) => {
      const latestBid = await BiddingProduct.findOne({ product: product._id })
        .sort("-createdAt")
        .lean();

      return {
        ...product,
        biddingPrice: latestBid ? latestBid.price : product.price,
      };
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        productsWithPrices,
        "User's products fetched successfully"
      )
    );
});

const getWonProducts = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wonProducts = await Product.find({ soldTo: userId })
    .sort("-createdAt")
    .populate("user")
    .lean();

  if (!wonProducts || wonProducts.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No won products found"));
  }

  const productsWithPrices = await Promise.all(
    wonProducts.map(async (product) => {
      const latestBid = await BiddingProduct.findOne({ product: product._id })
        .sort("-createdAt")
        .lean();

      return {
        ...product,
        biddingPrice: latestBid ? latestBid.price : product.price,
      };
    })
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        productsWithPrices,
        "Won products fetched successfully"
      )
    );
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).lean();

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const latestBid = await BiddingProduct.findOne({ product: product._id })
    .sort("-createdAt")
    .lean();

  const productWithBiddingDetails = {
    ...product,
    biddingPrice: latestBid ? latestBid.price : product.price,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        productWithBiddingDetails,
        "Product fetched successfully"
      )
    );
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (product.image?.public_id) {
    try {
      await cloudinary.uploader.destroy(product.image.public_id);
    } catch (error) {
      console.error("Error deleting image from Cloudinary:", error);
    }
  }

  await Product.findByIdAndDelete(id);
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"));
});

const verifyAndAddCommissionProductByAdmin = asyncHandler(async (req, res) => {
  const { commission } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  product.isVerify = true;
  product.commission = commission;

  await product.save();

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product verified successfully"));
});

export {
  createProduct,
  getAllProducts,
  getWonProducts,
  getProductById,
  deleteProduct,
  updateProduct,
  verifyAndAddCommissionProductByAdmin,
  getAllProductsofUser,
};
