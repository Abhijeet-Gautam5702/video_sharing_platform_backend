// Comment model
// NOTE: Each comment will belong to one video and one owner only (See the explanation for this in `/src/models/subscription.models.js`)

import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
