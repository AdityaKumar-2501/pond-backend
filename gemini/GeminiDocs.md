# Gemini AI Integration Documentation

## Setup

### 1. Install Dependencies
```bash
npm install @google/genai dotenv
```

### 2. Environment Configuration
Create a `.env` file in your project root and add:
```
GEMINI_API_KEY=your_api_key_here
```

To get an API key:
1. Go to https://aistudio.google.com/app/apikey
2. Create or select a project
3. Enable the Gemini API
4. Generate an API key
5. Copy the key to your .env file

## Usage

### Basic Implementation
```javascript
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
```

### Content Analysis

Our implementation provides a unified content analyzer that can handle:
- Images (JPEG, PNG, GIF)
- Videos (MP4)
- Text files (TXT, MD, JS, etc.)

#### Example Usage:
```javascript
import { analyzeContent } from '../gemini/content_analyzer.js';

// Analyze any supported file
const { tags, description } = await analyzeContent('/path/to/file');
```

### Response Schema
The content analyzer enforces a structured response format:
```javascript
{
  tags: string[],       // Array of relevant tags
  description: string   // Detailed description of the content
}
```

## API Reference

### analyzeContent(filePath)
Analyzes a file and returns tags and description.

**Parameters:**
- `filePath` (string): Path to the file to analyze

**Returns:**
- Promise<Object>:
  - `tags` (string[]): Array of generated tags
  - `description` (string): Generated description

**Supported File Types:**
- Images: .jpg, .jpeg, .png, .gif
- Videos: .mp4
- Text: .txt, .md, .js, .html, .css

### Configuration Options
The content analyzer uses these configurations:

```javascript
const config = {
  responseMimeType: "application/json",
  responseSchema: {
    type: "object",
    properties: {
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Array of tags extracted from the content",
        nullable: false
      },
      description: {
        type: "string",
        description: "Detailed description of the content",
        nullable: false
      }
    },
    required: ["tags", "description"]
  }
};
```

## Testing

### Using the Test Endpoint
A test endpoint is available for quick testing without authentication:

```bash
# Test with image
curl -X POST -F "file=@/path/to/image.jpg" http://localhost:5001/api/test-upload

# Test with video
curl -X POST -F "file=@/path/to/video.mp4" http://localhost:5001/api/test-upload

# Test with text file
curl -X POST -F "file=@/path/to/text.txt" http://localhost:5001/api/test-upload
```

### Example Response
```json
{
  "success": true,
  "tags": ["nature", "landscape", "mountain", "sunset"],
  "description": "A scenic mountain landscape at sunset with snow-capped peaks and orange-tinted clouds",
  "filePath": "uploads/file-1234567890.jpg"
}
```

## Error Handling

The content analyzer includes robust error handling:

```javascript
try {
  const { tags, description } = await analyzeContent(filePath);
} catch (error) {
  console.error('Error analyzing content:', error);
  // Returns default values if analysis fails
  return { 
    tags: [], 
    description: "Failed to generate description." 
  };
}
```

## Best Practices

1. **File Size**: Keep uploaded files reasonably sized
2. **API Key Security**: Never expose your API key in client-side code
3. **Error Handling**: Always implement proper error handling
4. **Response Validation**: Verify that responses match the expected schema
5. **Content Types**: Check file types before processing

## Rate Limits

The Gemini API has rate limits based on your API key's quota. Monitor your usage through the Google Cloud Console.
