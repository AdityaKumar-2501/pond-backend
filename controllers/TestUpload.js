import { analyzeContent } from '../gemini/content_analyzer.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

async function testUpload(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        console.log("Analyzing file:", req.file.path);
        
        // Analyze the content using Gemini
        const { tags, description } = await analyzeContent(req.file.path);
        
        return res.status(200).json({
            success: true,
            tags,
            description,
            filePath: req.file.path
        });
    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

export { testUpload, upload };