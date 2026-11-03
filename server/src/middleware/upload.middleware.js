import multer from "multer";

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_DOC_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/octet-stream",
]);

const ALLOWED_DOC_EXTENSIONS = [".pdf", ".docx", ".doc"];
const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const fileFilter = (req, file, cb) => {
  const originalName = (file.originalname || "").toLowerCase();

  if (file.fieldname === "abstractPdf") {
    const isDocMime = ALLOWED_DOC_MIMES.has(file.mimetype);
    const isDocExt = ALLOWED_DOC_EXTENSIONS.some((ext) => originalName.endsWith(ext));

    if (isDocMime || isDocExt) {
      return cb(null, true);
    }
    return cb(
      new Error(
        "Invalid file format for Abstract Idea. Please upload a valid PDF or DOCX file."
      )
    );
  }

  // ID Cards and payment screenshots
  const isImageMime =
    file.mimetype.startsWith("image/") || ALLOWED_IMAGE_MIMES.has(file.mimetype);
  const isImageExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    originalName.endsWith(ext)
  );

  if (isImageMime || isImageExt) {
    return cb(null, true);
  }

  return cb(
    new Error(
      `Invalid file format for ${file.fieldname}. Please upload a valid image file (JPG/PNG/WEBP).`
    )
  );
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB maximum allowed across files
  },
  fileFilter,
});

export const uploadRegistrationFiles = upload.fields([
  { name: "teamLeaderIdCard", maxCount: 1 },
  { name: "member1IdCard", maxCount: 1 },
  { name: "member2IdCard", maxCount: 1 },
  { name: "member3IdCard", maxCount: 1 },
  { name: "abstractPdf", maxCount: 1 },
  { name: "paymentScreenshot", maxCount: 1 },
]);

// Single payment screenshot upload for RSVP (max 5 MB)
const rsvpUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max for payment screenshot
  },
  fileFilter,
});

export const uploadRsvpScreenshot = rsvpUpload.single("paymentScreenshot");

export default upload;
