import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import * as fs from "node:fs";
import * as dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
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

async function analyzeContent(imageSource) {
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment.");
    }

    const ai = new GoogleGenAI({ apiKey });
    let contents = [];
    
    if (imageSource.startsWith('http')) {
      console.log('Analyzing image from URL:', imageSource);
      try {
        // Fetch the image data from URL
        const response = await fetch(imageSource);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        
        const buffer = await response.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        
        contents = [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
          { text: "Describe this image and generate relevant tags." },
        ];
        
        console.log('Image data prepared for analysis');
      } catch (error) {
        console.error('Error preparing image for analysis:', error);
        throw error;
      }
    } else {
      // Handle local file path
      const mimeType = getMimeType(imageSource);
      console.log(`Analyzing ${imageSource} with mime type ${mimeType}`);

      if (mimeType.startsWith("image/")) {
        const base64ImageData = await fs.promises.readFile(imageSource, {
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
        const files = [await ai.files.upload({ file: imageSource })];
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
        const textData = await fs.promises.readFile(imageSource, {
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
    console.error(`Error analyzing ${imageSource}:`, error);
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
    case "js":
      return "text/javascript";
    case "md":
      return "text/markdown";
    case "html":
      return "text/html";
    case "css":
      return "text/css";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export { analyzeContent };
