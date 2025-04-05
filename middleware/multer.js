import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const uniqueId = uuidv4();
    const timestamp = Date.now();
    const originalName = file.originalname;

    const ext = path.extname(originalName);

    const cleanName = originalName
      .replace(ext, "")
      .replace(/[^\w-]/g, "_")
      .toLowerCase();

    const finalName = `${timestamp}_${uniqueId.slice(0, 8)}_${cleanName.slice(
      0,
      32
    )}${ext}`;

    cb(null, finalName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});
