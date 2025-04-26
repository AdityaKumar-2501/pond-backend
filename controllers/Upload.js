import { v2 as cloudinary } from 'cloudinary';
import { Image, User } from '../models/User.db.js';
import { analyzeContent } from '../gemini/content_analyzer.js';

async function storeImageInfo(userId, uploadResult){

    try{
        const user = await User.findById(userId);
        if(!user){
            return {error: "User not found!"};
        }

        const newImage = new Image({
            author: userId,
            url: uploadResult.secure_url,
            tags: uploadResult.tags || [],
            description: uploadResult.description || "",
            aditionalInfo: uploadResult.aditionalInfo || "",
        });

        const savedImage = await newImage.save();

        user.images.push(savedImage._id);
        await user.save();

        return {success: true, image: savedImage};
    }
    catch(e){
        console.log("error : ", e);
        return {error: e.message};
    }
}

async function handleUploadImage(req, res) {
    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET,
    });

    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    console.log(req.file);

    try {
        // First analyze the content with Gemini
        const { tags, description } = await analyzeContent(req.file.path);
        
        const folderName = `users/${userId}`;
    
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: folderName,
        });

        // Add Gemini-generated tags and description to upload result
        uploadResult.tags = tags;
        uploadResult.description = description;
        
        // Store image info in the database
        const result = await storeImageInfo(userId, uploadResult);

        if (result.error) {
            return res.status(500).json({ error: result.error });
        }

        return res.status(200).json({
            success: true,  
            message: "Uploaded!",
            image: result.image,
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({success: false, message:`Error occured: ${e}`});
    }  
}

export { handleUploadImage };
