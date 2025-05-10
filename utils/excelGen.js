const ExcelJS = require("exceljs");
const path = require("path");

const generateExcel = async (data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoice");

  // Set up columns first
  sheet.columns = [
    { header: "Item", key: "name", width: 30 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Rate", key: "rate", width: 15 },
    { header: "Amount", key: "amount", width: 15 },
  ];

  // Style the headers
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };

  // Add company and invoice details after headers
  sheet.insertRow(1, ["Company Name:", data.companyName || ""]);
  sheet.insertRow(2, ["Invoice No:", data.invoiceNo || ""]);
  sheet.insertRow(3, ["Date:", data.date || ""]);
  sheet.insertRow(4, []); // empty row

  // Add item rows
  data.items.forEach((item) => {
    const row = sheet.addRow(item);
    // Format numbers to 2 decimal places
    row.getCell("rate").numFmt = "0.00";
    row.getCell("amount").numFmt = "0.00";
    // Center qty column
    row.getCell("qty").alignment = { horizontal: "center" };
    // Right align numbers
    row.getCell("rate").alignment = { horizontal: "right" };
    row.getCell("amount").alignment = { horizontal: "right" };
  });

  // Add totals
  sheet.addRow([]);
  sheet.addRow(["", "", "Original Total", data.originalTotal]);
  sheet.addRow(["", "", "Calculated Total", data.totalCalculated]);
  sheet.addRow(["", "", "Correct?", data.isCorrect ? "Yes" : "No"]);

  // Style the totals
  const lastRow = sheet.rowCount;
  for (let i = lastRow - 3; i <= lastRow; i++) {
    const row = sheet.getRow(i);
    row.getCell(3).font = { bold: true };
    if (i < lastRow) {
      row.getCell(4).numFmt = "0.00";
    }
    row.getCell(4).alignment = { horizontal: "right" };
  }

  // Add borders to the content
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber >= 5) {
      // Start from after the header
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    }
  });

  // Save Excel
  const filePath = `uploads/${Date.now()}_invoice.xlsx`;
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

module.exports = { generateExcel };
