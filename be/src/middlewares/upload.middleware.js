const multer = require("multer");

// Lưu file vào RAM, không lưu vào ổ cứng cảu server
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Kiểm tra file có phải là ảnh không (image/jpeg, image/png,...)
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format (jpeg, png,...)"), false);
  }
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, //Giới hạn kích thước file tối đa 5MB
});

module.exports = uploadMiddleware;
