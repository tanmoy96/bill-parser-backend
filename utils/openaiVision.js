const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const extractTextFromImage = async (imagePath) => {
  const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract items, price, total, and check if sum is correct. Return JSON format like: Example format:
{
  "companyName": "Sample Store",
  "invoiceNo": "INV-20240315-001",
  "date": "2024-03-15",
  "items": [
    {
      "name": "Item name",
      "qty": 1,
      "rate": 10.00,
      "amount": 10.00
    }
  ],
  "totalCalculated": 10.00,
  "originalTotal": 10.00,
  "isCorrect": true
}`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1000,
  });

  const result = response.choices[0]?.message?.content;
  return result;
};

module.exports = { extractTextFromImage };
