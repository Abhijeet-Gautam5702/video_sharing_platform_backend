import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: false,
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            required: false,
        },
    },
    { timestamps: true }
);

const Like = mongoose.model("Like", likeSchema);

export default Like;
