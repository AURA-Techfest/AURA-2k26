import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow images for ID cards and payment screenshots
    if (file.fieldname === "abstractPdf") {
      const fileName = file.originalname.toLowerCase();
      if (
        file.mimetype === "application/pdf" ||
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.mimetype === "application/msword" ||
        fileName.endsWith(".pdf") ||
        fileName.endsWith(".docx") ||
        fileName.endsWith(".doc")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Abstract document must be a PDF or DOCX file"));
      }
    } else if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed for ID cards and payment screenshots"));
    }
  },
});

export default upload;
