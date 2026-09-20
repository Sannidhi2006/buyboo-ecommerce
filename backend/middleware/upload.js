const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { errorResponse } = require('../utils/responseHandler');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Generate safe, unpredictable filename: img-<timestamp>-<random-hex>.<safe-ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const safeName = `img-${Date.now()}-${randomSuffix}${safeExt}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Middleware wrapper to catch Multer errors and return clean API error responses
 * @param {string} fieldName - Form data field name (e.g. 'image')
 */
const handleImageUpload = (fieldName = 'image') => {
  const multerSingle = upload.single(fieldName);

  return (req, res, next) => {
    multerSingle(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return errorResponse(res, 'File too large. Maximum image size is 5MB.', 400);
        }
        if (err.code === 'INVALID_FILE_TYPE') {
          return errorResponse(res, err.message, 400);
        }
        return errorResponse(res, `Image upload error: ${err.message}`, 400);
      }
      next();
    });
  };
};

module.exports = {
  upload,
  handleImageUpload,
};
