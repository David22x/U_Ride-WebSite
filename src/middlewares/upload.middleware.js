const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const fileFilter = (_req, file, cb) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
