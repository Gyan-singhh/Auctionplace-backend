import { Message } from "../models/message.model.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { ApiError } from "../util/ApiError.js";
import { asyncHandler } from "../util/asyncHandler.js";

const createMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw new ApiError(400, "All fields are required.");
  }

  const newMessage = new Message({ name, email, subject, message });
  await newMessage.save();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newMessage,
        "Your message has been sent successfully."
      )
    );
});

const getMessages = asyncHandler(async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        messages,
        messages.length
          ? "Messages retrieved successfully."
          : "No messages found."
      )
    );
});

export { createMessage, getMessages };
