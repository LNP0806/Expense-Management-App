const cloudinary = require("cloudinary").v2;

//Cấu hình thông số từ .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper chuyển đổi thông số file buffer từ RAM thành link URL trên Cloudinary
const uploadCloudinary = (fileBuffer, folderName = "expense-app") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Trả về link của ảnh
      },
    );
    // Ghi dữ liệu buffer vào stream để upload
    uploadStream.end(fileBuffer);
  });
};

module.exports = { uploadCloudinary };
