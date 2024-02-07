import mongoose from "mongoose";
import Comment from "../models/comment.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get comments on the current video
const getVideoComments = asyncHandler(async (req, res) => {
    // Authorization: Check whether the user is authorized to hit this secured route

    // Get the video-ID from the URL params
    const videoId = req.params?.videoId;
    if (!videoId) {
        throw new apiError(422, "Video Id not provided");
    }

    // MongoDB Aggregation Pipeline
    // Search for all the "Comment" documents which have their `video` field set as video-ID
    const comments = await Comment.aggregate([
        // STAGE-1: Filter all "Comment" documents whose `video` field matches videoId
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        // STAGE-2: Get the comment-owner details
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"ownerDetails",
                pipeline:[
                    // STAGE-2.1: Project only specific details of comment-owner
                    {
                        $project:{
                            fullname:1,
                            username:1,
                            avatar:1,
                        }
                    }
                ]
            }
        }
    ]);
    // console.log(comments);

    // Send success response to the user
    res.json(new apiResponse(200, comments, "Comments fetched successfully"));
});

// Create a fresh comment on a video
const addComment = asyncHandler(async (req, res) => {
    // Authorization: Check whether the user is authorized to hit this secured route

    // Get the video-Id from URL params and user-Id from req.user
    const videoId = req.params?.videoId;
    const userId = req.user._id;
    const content = req.body?.content;
    if (!videoId) {
        throw new apiError(422, "Video Id not provided");
    }
    if (!content) {
        throw new apiError(422, "Content of the comment is required");
    }

    // Check if video with the given videoId exists

    // Create a new comment and add it to database
    const newComment = await Comment.create({
        owner: userId,
        content: content,
        video: new mongoose.Types.ObjectId(videoId),
    });
    if (!newComment) {
        throw new apiError(500, "New comment could not be added");
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, newComment, "Comment added successfully")
    );
});

// Update or Edit your comment
// Delete a comment

export { getVideoComments, addComment };
