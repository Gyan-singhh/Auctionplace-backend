import mongoose from "mongoose";
import { User } from "./user.model.js";

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      trim: true,
    },
    image: {
      url: { type: String },
      public_id: { type: String },
      alt: { type: String, default: "Product image" },
    },
    category: {
      type: String,
      default: "All",
    },
    commission: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Please add a Price"],
    },
    height: {
      type: Number,
    },
    length: {
      type: Number,
    },
    width: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    isVerify: {
      type: Boolean,
      default: true,
    },
    isSoldOut: {
      type: Boolean,
      default: false,
    },
    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
