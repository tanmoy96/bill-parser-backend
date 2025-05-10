const axios = require("axios");
require("dotenv").config();

const cleanJsonResponse = (content) => {
  // Remove markdown code block syntax if present
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  // Trim whitespace
  content = content.trim();
  return content;
};

const parseBillText = async (rawText) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  if (!rawText || typeof rawText !== "string") {
    throw new Error("Invalid input: rawText must be a non-empty string");
  }

  const systemPrompt = `You are a billing assistant. Extract and structure the following bill text into a JSON format.
Return ONLY a raw JSON object with no markdown formatting or additional text, containing these fields:
- companyName (string): Extract or infer the company name from the bill
- invoiceNo (string): Extract or generate a unique invoice number (if not present, generate one with format 'INV-YYYYMMDD-XXX')
- date (string): Extract the bill date (if not present, use current date)
- items (array of objects with):
  - name (string): item description
  - qty (number): quantity
  - rate (number): unit price
  - amount (number): total price for this item
- totalCalculated (number): sum of all item amounts
- originalTotal (number): total amount shown on bill
- isCorrect (boolean): whether originalTotal matches totalCalculated

Example format:
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
}`;

  const userPrompt = `Bill Text:\n${rawText}`;

  try {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.data?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI API");
    }

    const content = cleanJsonResponse(res.data.choices[0].message.content);

    try {
      return JSON.parse(content);
    } catch (parseError) {
      throw new Error(
        `Failed to parse OpenAI response as JSON: ${parseError.message}\nResponse content: ${content}`
      );
    }
  } catch (error) {
    if (error.response) {
      // OpenAI API error
      throw new Error(
        `OpenAI API error: ${
          error.response.data?.error?.message || error.message
        }`
      );
    }
    throw error;
  }
};

module.exports = { parseBillText };
