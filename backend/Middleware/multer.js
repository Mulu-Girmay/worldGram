const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("../utils/cloudinary");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/others";

    if (file.mimetype.startsWith("image/")) folder = "uploads/images";
    else if (file.mimetype.startsWith("video/")) folder = "uploads/videos";
    else if (file.mimetype.includes("pdf") || file.mimetype.includes("doc"))
      folder = "uploads/documents";

    ensureDir(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "video/mp4",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const diskMulter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_FILE_BYTES || 20 * 1024 * 1024), // 20MB default
  },
});

const memoryMulter = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_MEMORY_FILE_BYTES || 1 * 1024 * 1024), // 1MB default in memory
  },
});


const useCloudinary = Boolean(process.env.USE_CLOUDINARY === "true" || process.env.CLOUDINARY_URL);

const MEMORY_THRESHOLD = Number(process.env.MEMORY_UPLOAD_LIMIT_BYTES || 1 * 1024 * 1024);

const uploadToCloudinaryFromPath = async (localPath) => {
  if (!useCloudinary) return null;
  return cloudinary.uploadFile(localPath);
};

const uploadToCloudinaryFromBuffer = async (buffer) => {
  if (!useCloudinary) return null;
  return cloudinary.uploadStream(buffer);
};

// Preserve API: export an object with `single` method so existing code using upload.single(...) continues to work.
module.exports = {
  single: (fieldName) => {
    return (req, res, next) => {
      // Decide which multer to use based on Content-Length header when available.
      const contentLength = Number(req.headers["content-length"] || 0);
      const chosen = contentLength > 0 && contentLength <= MEMORY_THRESHOLD ? memoryMulter.single(fieldName) : diskMulter.single(fieldName);

      chosen(req, res, async (err) => {
        if (err) return next(err);

        try {
          if (!req.file) return next();

          // If Cloudinary configured
          if (useCloudinary) {
            if (req.file.buffer) {
              const uploaded = await uploadToCloudinaryFromBuffer(req.file.buffer);
              if (uploaded && uploaded.secure_url) req.file.filename = uploaded.secure_url;
            } else if (req.file.path) {
              const uploaded = await uploadToCloudinaryFromPath(req.file.path);
              if (uploaded && uploaded.secure_url) req.file.filename = uploaded.secure_url;
            }
          }

          // cleanup local file when present and we uploaded remotely
          if (req.file.path && useCloudinary) {
            try {
              if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            } catch (_) {
              // ignore
            }
          }

          return next();
        } catch (e) {
          return next(e);
        }
      });
    };
  },
};
