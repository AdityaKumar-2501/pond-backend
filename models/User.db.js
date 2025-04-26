import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        url: {
            type: String,
            required: true,
        },
        tags: [
            {
                type: String,
            },
        ],
        description: {
            type: String,
        },
        aditionalInfo: {
            type: String,
        },
    },
    { timestamps: true }
);

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    images: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Image",
        },
    ],
});

const Image = mongoose.model("Image", imageSchema);
const User = mongoose.model("User", userSchema);

export {User, Image};
