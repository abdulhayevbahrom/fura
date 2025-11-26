const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const response = require("../utils/response");
const { v4: uuidv4 } = require("uuid");

// Factory to create upload handlers for different routes
function createImageUploadHandler(props) {
  const { subfolder, resize } = props;
  return async (req, res, next) => {
    const uploadDir = path.join(__dirname, "../uploads");
    const targetDir = path.join(uploadDir);

    // Ensure directories exist
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

    const file = req.file || null; // Bitta rasmni olish

    try {
      if (!file) {
        return next();
        // return response.warning(res, "Rasm yuklash uchun fayl tanlang.");
      }

      if (!file.mimetype.startsWith("image/")) {
        throw new Error("INVALID_TYPE");
      }

      const format = file.mimetype.split("/").pop();
      const fileName = `${uuidv4()}.${format}`;
      const filePath = path.join(targetDir, fileName);

      // Rasmni qayta ishlash va saqlash
      await sharp(file.buffer)
        .resize(resize.width, resize.height)
        .toFile(filePath);

      req.body.image = fileName; // Rasm nomini saqlash

      return next();
    } catch (err) {
      if (err.message === "INVALID_TYPE") {
        return response.warning(res, "Faqat rasmlar yuklash mumkin.");
      }

      console.error(`Error in image parser (${subfolder}):`, err);
      return response.error(res, "Rasm yuklashda xatolik yuz berdi.");
    }
  };
}

const avatarUpload = createImageUploadHandler({
  subfolder: "avatar",
  resize: { width: 320, height: 320 },
});

// Main middleware
module.exports = (req, res, next) => {
  if (req.originalUrl.includes("/api/cars/create")) {
    return avatarUpload(req, res, next);
  }
  return next();
};
