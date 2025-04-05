import dotenv from "dotenv";
import connectDB from "./dbConnect/db.connection.js";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({
  path: "./.env",
});

const app = express();
const port = process.env.PORT || 8001;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

app.use(
  cors({
    origin: process.env.CORS_ORIGIN_ONE,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";
import biddingRouter from "./routes/bidding.route.js";
import messageRouter from "./routes/message.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/biddings", biddingRouter);
app.use("/api/v1/messages", messageRouter);

app.get("/env-check", (req, res) => {
  res.json({
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    },
  });
});

connectDB();
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`⚙️ Server is listening at port : ${port}`);
});
