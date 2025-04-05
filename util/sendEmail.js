import nodemailer from "nodemailer";
import { asyncHandler } from "./asyncHandler.js";
import { ApiError } from "./ApiError.js";

export const sendEmail = asyncHandler(async (options) => {
  if (!options.email) {
    throw new ApiError(404, "No recipients defined");
  }
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASS,
    },
  });


  const mailOptions = {
    from: `Auction App <no-reply@yourdomain.com>`,
    to: options.email,
    subject: options.subject,
    text: `Seller: ${options.sellerName} (${options.sellerEmail})\n\n${options.text}`,
  };  

  const info = await transport.sendMail(mailOptions);
});
