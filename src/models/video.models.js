// Video Model

import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String, // cloudinary URL
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String, // cloudinary URL
            required: true,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        views: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Mongoose Method: Increment video views
videoSchema.methods.incrementViews = async function () {
    this.views = this.views + 1;
    await this.save();
};

const Video = mongoose.model("Video", videoSchema);

export default Video;
