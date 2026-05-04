const cloudinary = require("cloudinary").v2;

const configureCloudinary = () => {
  const rawUrl = String(process.env.CLOUDINARY_URL || "").trim();
  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const apiKey = decodeURIComponent(parsed.username || "");
      const apiSecret = decodeURIComponent(parsed.password || "");
      const cloudName = decodeURIComponent(parsed.hostname || "");

      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });
        return;
      }
    } catch (error) {
      console.warn("Invalid CLOUDINARY_URL; falling back to explicit env vars.");
    }
  }

  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || "").trim();
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }
};

configureCloudinary();

const uploadFile = (filePath, options = {}) =>
  new Promise((resolve, reject) => {
    // default options: let cloudinary auto-detect resource type
    const opts = Object.assign({ resource_type: "auto" }, options || {});
    cloudinary.uploader.upload(filePath, opts, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
  });

const uploadStream = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const opts = Object.assign({ resource_type: "auto" }, options || {});
    const stream = cloudinary.uploader.upload_stream(opts, (err, result) => {
      if (err) return reject(err);
      return resolve(result);
    });
    stream.end(buffer);
  });

const getConfig = () => cloudinary.config();

module.exports = {
  uploadFile,
  uploadStream,
  getConfig,
  client: cloudinary,
};
