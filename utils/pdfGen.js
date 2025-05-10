const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Helper function to create table
const createTable = (
  doc,
  headers,
  rows,
  startX,
  startY,
  rowHeight,
  colWidths
) => {
  let currentY = startY;

  // Draw headers
  doc.font("Helvetica-Bold");
  headers.forEach((header, i) => {
    doc.text(
      header,
      startX + (i > 0 ? colWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0),
      currentY,
      {
        width: colWidths[i],
        align: i === 0 ? "left" : "right",
      }
    );
  });

  // Draw header line
  currentY += rowHeight;
  doc
    .moveTo(startX, currentY)
    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), currentY)
    .stroke();
  currentY += 6;

  // Draw rows
  doc.font("Helvetica");
  rows.forEach((row) => {
    row.forEach((cell, i) => {
      doc.text(
        cell.toString(),
        startX + (i > 0 ? colWidths.slice(0, i).reduce((a, b) => a + b, 0) : 0),
        currentY,
        {
          width: colWidths[i],
          align: i === 0 ? "left" : "right",
        }
      );
    });
    currentY += rowHeight;
  });

  // Draw bottom line
  doc
    .moveTo(startX, currentY)
    .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), currentY)
    .stroke();

  return currentY;
};

const formatCurrency = (amount) => {
  return parseFloat(amount).toFixed(2);
};

const generatePDF = (data) => {
  // Create document
  const doc = new PDFDocument({
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  const filePath = `uploads/${Date.now()}_bill.pdf`;
  doc.pipe(fs.createWriteStream(filePath));

  // Add letterhead
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .text(data.companyName, { align: "center" });

  doc.moveDown(0.5);

  // Add decorative line
  doc.lineWidth(2).moveTo(50, 100).lineTo(550, 100).stroke();

  // Add invoice details
  doc.fontSize(14).font("Helvetica");

  // Create a table-like structure for invoice details
  doc.text(`Invoice No: ${data.invoiceNo}`, 50, 120);
  doc.text(`Date: ${data.date}`, 400, 120, { align: "right" });

  doc.moveDown(2);

  // Create table headers and rows
  const headers = ["Item Description", "Qty", "Rate", "Amount"];
  const colWidths = [250, 70, 85, 85];

  const rows = data.items.map((item) => [
    item.name,
    item.qty.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount),
  ]);

  // Draw table
  let finalY = createTable(doc, headers, rows, 50, doc.y, 25, colWidths);

  // Add totals section
  doc.moveDown(4);
  const totalSection = finalY + 40;

  // Add summary box
  // doc.rect(350, totalSection, 200, 80).lineWidth(1).stroke();
  doc.moveDown(2);

  // Add total information
  doc.font("Helvetica-Bold").fontSize(14);

  doc.text("Sub Total:", 370, totalSection + 10);
  doc.text(`GST ${data.gst}%:`, 370, totalSection + 30);
  doc.text(`Total:`, 370, totalSection + 50);

  // Add values aligned to the right
  doc
    .font("Helvetica")
    .text(formatCurrency(data.subTotal), 450, totalSection + 10, {
      align: "right",
      width: 80,
    })
    .text(formatCurrency(data.gstAmount), 450, totalSection + 30, {
      align: "right",
      width: 80,
    })
    .text(
      formatCurrency(data.subTotal + data.gstAmount),
      450,
      totalSection + 50,
      {
        align: "right",
        width: 80,
      }
    );

  doc.end();
  return filePath;
};

module.exports = { generatePDF };
