import mongoose from "mongoose";
import Comment from "../models/comment.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Video from "../models/video.models.js";

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
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    // STAGE-2.1: Project only specific details of comment-owner
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
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

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    // Authorization: Check whether the user is authorized to hit this secured route

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Comment Deletion failed | User-ID not recieved"
        );
    }

    // Get videoId and commentId from the URL params
    const videoId = req.params?.videoId;
    const commentId = req.params?.commentId;
    if (!videoId) {
        throw new apiError(422, "Comment Deletion failed | Invalid Video-ID");
    }
    if (!commentId) {
        throw new apiError(422, "Comment Deletion failed | Invalid Comment-ID");
    }

    // Check if the user is either the creator of the comment or the owner of the video (Then only they are allowed to delete the comment)
    const isUserOwnerOfVideo = await Video.findOne({
        _id: commentId,
        owner: userId,
    });
    const isUserCreatorOfComment = await Comment.findOne({
        _id: commentId,
        owner: userId,
    });
    if (!isUserCreatorOfComment && !isUserOwnerOfVideo) {
        throw new apiError(
            400,
            "Comment Deletion failed | You cannot delete comments of other users"
        );
    }

    // Search for the desired "Comment" document and delete it from database
    const a = await Comment.deleteOne({
        video: videoId,
        owner: userId,
    });
    console.log(a);

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, {}, "Comment deleted successfully")
    );
});

// Update or Edit your comment
const editComment = asyncHandler(async (req, res) => {
    // Authorization: Check if the user is authorized to hit this secure route

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(400, "Cannot edit comment | User-ID not recieved");
    }

    // Get commentId from req.params and content of comment from body
    const commentId = req.params?.commentId;
    const content = req.body?.content;
    if (!commentId) {
        throw new apiError(422, "Cannot edit comment | Invalid Comment-ID");
    }
    if (!content?.trim()) {
        throw new apiError(
            422,
            "Cannot edit comment | Comment content cannot be empty"
        );
    }

    // Check if the user is the owner/creator of the comment
    const isUserCreatorOfComment = await Comment.findOne({
        _id: commentId,
        owner: userId,
    });
    if(!isUserCreatorOfComment){
        throw new apiError(
            400,
            "Cannot edit comment | You cannot edit comments of other users"
        )
    }

    // Find and update the desired comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content,
        },
        { new: true }
    );
    if (!updatedComment) {
        throw new apiError(
            500,
            "Cannot edit comment | Something went wrong from our end"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, updatedComment, "Comment edited successfully")
    );
});

export { getVideoComments, addComment, deleteComment, editComment };
