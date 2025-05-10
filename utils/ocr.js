const axios = require("axios");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const extractTextFromImage = async (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const res = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
    {
      requests: [
        {
          image: { content: base64Image },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
        },
      ],
    }
  );

  return res.data.responses[0].fullTextAnnotation.text;
};

module.exports = { extractTextFromImage };
