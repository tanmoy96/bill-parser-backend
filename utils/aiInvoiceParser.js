const fs = require("fs");
const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const cleanJsonResponse = (content) => {
  return content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

const parseInvoiceFromImage = async (imagePath) => {
  if (!fs.existsSync(imagePath)) {
    throw new Error("Image file not found");
  }

  const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `This is an image of a handwritten invoice. Extract the following fields in raw JSON (no markdown):
{
  "companyName": "string",
  "invoiceNo": "string",
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "string", "qty": number, "rate": number, "amount": number }
  ],
  "totalCalculated": number,
  "originalTotal": number,
  "isCorrect": boolean
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

  const rawContent = response.choices[0].message.content;
  const cleanContent = cleanJsonResponse(rawContent);

  try {
    return JSON.parse(cleanContent);
  } catch (err) {
    console.error("Failed to parse JSON from response:", cleanContent);
    throw err;
  }
};

module.exports = { parseInvoiceFromImage };
