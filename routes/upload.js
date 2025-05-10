const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { generatePDF } = require("../utils/pdfGen");
const { generateExcel } = require("../utils/excelGen");
const { parseInvoiceFromImage } = require("../utils/aiInvoiceParser");

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Store generated files info
const generatedFiles = new Map();

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const imagePath = req.file.path;
    console.log("Uploaded image path:", imagePath); // Debug log

    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({ error: "Uploaded image not found" });
    }

    const parsedBill = await parseInvoiceFromImage(imagePath);

    // Step 3: Generate PDF and Excel
    const pdfPath = await generatePDF(parsedBill);
    const excelPath = await generateExcel(parsedBill);

    // Store file paths with a unique ID
    const fileId = Date.now().toString();
    generatedFiles.set(fileId, {
      pdfPath,
      excelPath,
      timestamp: Date.now(),
    });

    // Clean up old files (older than 1 hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [id, data] of generatedFiles.entries()) {
      if (data.timestamp < oneHourAgo) {
        try {
          fs.unlinkSync(data.pdfPath);
          fs.unlinkSync(data.excelPath);
          generatedFiles.delete(id);
        } catch (err) {
          console.error("Error cleaning up old files:", err);
        }
      }
    }

    res.json({
      parsedBill,
      fileId,
      pdfUrl: `/api/pdf/${fileId}`,
      excelUrl: `/api/excel/${fileId}`,
      originalImageUrl: `/uploads/${path.basename(imagePath)}`,
    });

    // Clean up the uploaded image after processing
    try {
      fs.unlinkSync(imagePath);
    } catch (err) {
      console.error("Error cleaning up uploaded image:", err);
    }
  } catch (err) {
    console.error("Error processing upload:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve PDF file
router.get("/pdf/:fileId", (req, res) => {
  const fileData = generatedFiles.get(req.params.fileId);
  if (!fileData) {
    return res.status(404).json({ error: "File not found" });
  }

  const filePath = fileData.pdfPath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=bill.pdf`);
  res.sendFile(path.resolve(filePath));
});

// Serve Excel file
router.get("/excel/:fileId", (req, res) => {
  const fileData = generatedFiles.get(req.params.fileId);
  if (!fileData) {
    return res.status(404).json({ error: "File not found" });
  }

  const filePath = fileData.excelPath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=bill.xlsx`);
  res.sendFile(path.resolve(filePath));
});

module.exports = router;
