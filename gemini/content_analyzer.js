import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import * as fs from "node:fs";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY; // Ensure you have set the environment variable
const modelName = "gemini-2.0-flash";

const config = {
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      tags: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of tags extracted from the content",
        nullable: false,
      },
      description: {
        type: "string",
        description: "Detailed description of the content",
        nullable: false,
      },
    },
    required: ["tags", "description"],
  },
};

async function analyzeContent(filePath) {
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const mimeType = getMimeType(filePath);
    console.log(`Analyzing ${filePath} with mime type ${mimeType}`);

    let contents = [];

    if (mimeType.startsWith("image/")) {
      const base64ImageData = await fs.promises.readFile(filePath, {
        encoding: "base64",
      });
      contents = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64ImageData,
          },
        },
        { text: "Describe this image." },
      ];
    } else if (mimeType.startsWith("video/")) {
      const files = [await ai.files.upload({ file: filePath })];

      contents = [
        {
          text: "Describe this video.",
          parts: [
            {
              fileData: {
                fileUri: files[0].uri,
                mimeType: files[0].mimeType,
              },
            },
          ],
        },
      ];
    } else if (mimeType.startsWith("text/")) {
      const textData = await fs.promises.readFile(filePath, {
        encoding: "utf-8",
      });

      contents = [
        {
          text: `Describe this ${mimeType} file: ${textData.replace(
            /\n/g,
            "\\n"
          )}. Return Array<string> tags and a description.`,
        },
      ];
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

    const result = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: config,
    });

    console.log("Result:", result);
    console.log("Result Text:", result.text);

    const JSON_Data = JSON.parse(result.text);

    const tags = JSON_Data.tags || [];
    const description = JSON_Data.description || "No description available.";
    if (tags.length === 0) {
      console.warn("No tags found in the response.");
    }
    if (!description) {
      console.warn("No description found in the response.");
    }

    return { tags, description };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error);
    return { tags: [], description: "Failed to generate description." };
  }
}

function getMimeType(filePath) {
  const fileExtension = filePath.split(".").pop().toLowerCase();
  switch (fileExtension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "mp4":
      return "video/mp4";
    case "txt":
      return "text/plain";
    case "js": // Added JavaScript file type
      return "text/javascript";
    case "md": // Added Markdown file type
      return "text/markdown";
    case "html":
      return "text/html";
    case "css":
      return "text/css";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream"; // generic binary type
  }
}

function extractTags(responseText) {
  // Implement logic to extract tags from the response text
  // This might involve using regular expressions or other parsing techniques
  // Example: splitting the response by commas
  return [];
}

function extractDescription(responseText) {
  // Implement logic to extract the description from the response text
  // This might involve using regular expressions or other parsing techniques
  // Example: taking the first sentence of the response
  return responseText;
}

// Example usage (for testing):
async function main() {
  const filePath = process.argv[2]; // Get file path from command line arguments
  if (!filePath) {
    console.error("Please provide a file path as a command line argument.");
    return;
  }

  const { tags, description } = await analyzeContent(filePath);
  console.log("Tags:", tags);
  console.log("Description:", description);
}

main();
