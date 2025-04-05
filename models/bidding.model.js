import mongoose from "mongoose";
import { User } from "./user.model.js";
import { Product } from "./product.model.js";

const BiddingProductSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "User",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Product",
    },
    price: {
      type: Number,
      require: [true, "Please add a Price"],
    },
  },
  { timestamps: true }
);
export const BiddingProduct = mongoose.model(
  "BiddingProduct",
  BiddingProductSchema
);
