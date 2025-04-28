import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { Image, User } from "../models/User.db.js";
import { analyzeContent } from "../gemini/content_analyzer.js";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

async function storeImageInfo(userId, uploadResult) {
  try {
    const user = await User.findById(userId);

    // Return all users if no userId is provided
    if (!user) {
      console.log("User ID: ", userId);
    }

    if (!user) {
      return { error: "User not found!", id: userId };
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

    return { success: true, image: savedImage };
  } catch (e) {
    console.log("error : ", e);
    return { error: e.message };
  }
}

async function handleAnalyzeImage(req, res) {
  const userId = req.user.id;
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "No image URL provided" });
  }

  try {
    console.log("Analyzing image:", imageUrl);

    // Analyze the content with Gemini
    const { tags, description } = await analyzeContent(imageUrl);
    console.log("Analysis result:", { tags, description });

    // Create upload result object
    const uploadResult = {
      secure_url: imageUrl,
      url: imageUrl, // Add url field for frontend compatibility
      tags,
      description,
      _id: Date.now().toString(), // Generate an ID if not provided by database
      createdAt: new Date().toISOString(),
    };

    // Store image info in the database
    const result = await storeImageInfo(userId, uploadResult);
    console.log("Stored image result:", result);

    if (result.error) {
      console.error("Storage error:", result.error);
      return res.status(500).json({ error: result.error });
    }

    // Format response to match frontend expectations
    const response = {
      success: true,
      message: "Analyzed!",
      image: {
        _id: result.image._id || uploadResult._id,
        url: result.image.url || imageUrl,
        description: result.image.description || description,
        tags: result.image.tags || tags,
        createdAt: result.image.createdAt || uploadResult.createdAt,
      },
    };

    console.log("Sending response:", response);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ success: false, message: `Error occured: ${e}` });
  }
}

async function handleUploadImage(req, res) {
  // Get user ID from mongoose
  const userId = req.user.id;

  console.log("User Data:", userId);

  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  try {
    // Upload the file from disk to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      upload_preset: "Pond-App",
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    // Analyze the image with Gemini
    const { tags, description } = await analyzeContent(uploadResult.secure_url);
    console.log("Analysis result:", { tags, description });

    // Add analysis results to uploadResult
    uploadResult.tags = tags;
    uploadResult.description = description;

    // Store image info in the database
    const result = await storeImageInfo(userId, uploadResult);

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: "Uploaded and analyzed!",
      image: result.image,
    });
  } catch (error) {
    // Clean up temporary file in case of error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ success: false, message: `Error occurred: ${error.message}` });
  }
}

async function getCloudinaryPublicId(url) {
  // Extract the public_id from cloudinary URL
  // Format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{extension}
  const matches = url.match(/\/v\d+\/(.+?)\./);
  return matches ? matches[1] : null;
}

async function deleteImage(req, res) {
  const userId = req.user.id;
  const { imageId } = req.params;

  try {
    // Find the image
    const image = await Image.findById(imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found"
      });
    }

    // Check if user owns this image
    if (image.author.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this image"
      });
    }

    // Get Cloudinary public_id from the URL
    const publicId = getCloudinaryPublicId(image.url);
    if (!publicId) {
      return res.status(500).json({
        success: false,
        message: "Could not parse Cloudinary URL"
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Remove image reference from user
    await User.findByIdAndUpdate(userId, {
      $pull: { images: imageId }
    });

    // Delete from MongoDB
    await Image.findByIdAndDelete(imageId);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred: ${error.message}`
    });
  }
}

async function getUserImages(req, res) {
  const userId = req.user.id;

  try {
    // Find user and populate their images
    const user = await User.findById(userId).populate('images');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      images: user.images.map(img => ({
        _id: img._id,
        url: img.url,
        description: img.description || '',
        tags: img.tags || [],
        createdAt: img.createdAt,
      }))
    });
  } catch (error) {
    console.error("Error fetching user images:", error);
    return res.status(500).json({
      success: false,
      message: `Error occurred: ${error.message}`
    });
  }
}

export { handleUploadImage, handleAnalyzeImage, getUserImages, deleteImage };
