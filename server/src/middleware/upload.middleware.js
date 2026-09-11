import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const ALLOWED_DOC_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
  "application/x-pdf",
];

const ALLOWED_DOC_EXTS = [".pdf", ".doc", ".docx"];

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    if (file.fieldname === "abstractPdf") {
      const isDocMime = ALLOWED_DOC_MIMES.includes(mime);
      const isDocExt = ALLOWED_DOC_EXTS.includes(ext);

      if (isDocMime || isDocExt) {
        return cb(null, true);
      }
      return cb(
        new Error(
          "Invalid file type for abstract document. Only PDF, DOC, and DOCX files are allowed."
        )
      );
    }

    // ID cards, payment screenshots, and default image fields
    const isImageMime = ALLOWED_IMAGE_MIMES.includes(mime) || mime.startsWith("image/");
    const isImageExt = ALLOWED_IMAGE_EXTS.includes(ext);

    if (isImageMime || isImageExt) {
      return cb(null, true);
    }

    return cb(
      new Error(
        `Invalid file type for ${file.fieldname}. Only JPG, PNG, and WebP image files are allowed.`
      )
    );
  },
});

export default upload;