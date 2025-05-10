const Excel = require("exceljs");
const path = require("path");

const generateExcel = async (data) => {
  const workbook = new Excel.Workbook();
  const sheet = workbook.addWorksheet("Bill");

  // Add company details
  sheet.mergeCells("A1:D1");
  const companyNameCell = sheet.getCell("A1");
  companyNameCell.value = data.companyName;
  companyNameCell.font = { bold: true, size: 14 };
  companyNameCell.alignment = { horizontal: "center" };

  // Add invoice details
  sheet.mergeCells("A2:B2");
  sheet.mergeCells("C2:D2");
  const invoiceNoCell = sheet.getCell("A2");
  const dateCell = sheet.getCell("C2");
  invoiceNoCell.value = `Invoice No: ${data.invoiceNo}`;
  dateCell.value = `Date: ${data.date}`;
  invoiceNoCell.font = { bold: true };
  dateCell.font = { bold: true };
  dateCell.alignment = { horizontal: "right" };

  // Add empty row for spacing
  sheet.addRow([]);

  // Set up columns
  sheet.columns = [
    { header: "Item", key: "name", width: 30 },
    { header: "Qty", key: "qty", width: 10 },
    { header: "Rate", key: "rate", width: 15 },
    { header: "Amount", key: "amount", width: 15 },
  ];

  // Style the headers
  const headerRow = sheet.getRow(4);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };

  // Add items with number formatting
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

  // Add empty row for spacing
  sheet.addRow([]);

  // Add totals with formatting
  const totalRows = [
    ["", "", "Original Total", data.originalTotal],
    ["", "", "Calculated Total", data.totalCalculated],
    ["", "", "Correct?", data.isCorrect ? "Yes" : "No"],
  ];

  totalRows.forEach((rowData) => {
    const row = sheet.addRow(rowData);
    row.getCell(3).font = { bold: true };
    if (rowData[3] !== "Yes" && rowData[3] !== "No") {
      row.getCell(4).numFmt = "0.00";
    }
    row.getCell(4).alignment = { horizontal: "right" };
  });

  // Add borders to the content
  const lastRow = sheet.rowCount;
  const contentRange = `A4:D${lastRow}`;
  sheet.getCell(`C${lastRow - 2}`).font = { bold: true };
  sheet.getCell(`C${lastRow - 1}`).font = { bold: true };
  sheet.getCell(`C${lastRow}`).font = { bold: true };

  // Apply borders to the content area
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber >= 4 && rowNumber <= lastRow) {
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

  const filePath = `uploads/${Date.now()}_bill.xlsx`;
  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

module.exports = { generateExcel };
