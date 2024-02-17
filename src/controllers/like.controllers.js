import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import Like from "../models/like.models.js";
import Video from "../models/video.models.js";
import Comment from "../models/comment.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import validateObjectId from "../utils/objectIdValidator.js";
import mongoose from "mongoose";

// Toggle video like
const toggleVideoLike = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Video Like could not be toggled successfully | User-ID not received"
        );
    }

    // Get videoId from req.params
    const videoId = req.params?.videoId;
    if (!videoId) {
        throw new apiError(
            422,
            "Video Like could not be toggled successfully | Video-ID not received"
        );
    }
    if (!validateObjectId(videoId)) {
        throw new apiError(
            422,
            "Video Like could not be toggled successfully | Invalid Video-ID format"
        );
    }

    // Check if the video exists in the database
    const isVideoExists = await Video.findById(videoId);
    if (!isVideoExists) {
        throw new apiError(
            404,
            "Video Like could not be toggled successfully | Video with the given Video-ID doesn't exist"
        );
    }

    // Delete the "Like" document if it exists in the database
    try {
        let likeDocument = await Like.findOne({
            likedBy: userId,
            video: videoId,
        });
        if (likeDocument) {
            await Like.deleteOne({ likedBy: userId, video: videoId });
        }
        // Create a new "Like" document if it doesn't exist
        else {
            likeDocument = await Like.create({
                likedBy: userId,
                video: videoId,
            });
        }

        // Send success response to the user
        res.status(200).json(
            new apiResponse(
                200,
                {},
                "Video Like toggled successfully"
            )
        );
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message ||
                "Video Like could not be toggled successfully | Some unknown error occured at our end in the database query"
        );
    }
});

// Toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Comment Like could not be toggled successfully | User-ID not received"
        );
    }

    // Get commentId from req.params
    const commentId = req.params?.commentId;
    if (!commentId) {
        throw new apiError(
            422,
            "Comment Like could not be toggled successfully | Comment-ID not received"
        );
    }
    if (!validateObjectId(commentId)) {
        throw new apiError(
            422,
            "Comment Like could not be toggled successfully | Invalid Comment-ID format"
        );
    }

    // Check if the comment exists in the database
    const isCommentExists = await Comment.findById(commentId);
    if (!isCommentExists) {
        throw new apiError(
            404,
            "Comment Like could not be toggled successfully | Comment with the given Comment-ID doesn't exist"
        );
    }

    // Delete the "Like" document if it exists in the database
    try {
        let likeDocument = await Like.findOne({
            likedBy: userId,
            comment: commentId,
        });
        if (likeDocument) {
            await Like.deleteOne({ likedBy: userId, comment: commentId });
        }
        // Create a new "Like" document if it doesn't exist
        else {
            likeDocument = await Like.create({
                likedBy: userId,
                comment: commentId,
            });
        }

        // Send success response to the user
        res.status(200).json(
            new apiResponse(
                200,
                {},
                "Comment Like toggled successfully"
            )
        );
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message ||
                "Comment Like could not be toggled successfully | Some unknown error occured at our end in the database query"
        );
    }
});

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Liked Videos could not be fetched successfully | User-ID not received"
        );
    }

    // Search all the "Like" documents and get those video-liked documents that have been liked by the current logged-in user
    const likedVideos = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true,
                },
                likedBy: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullname: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $project: {
                            thumbnail: 1,
                            owner: 1,
                            title: 1,
                            videoFile: 1,
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                ],
            },
        },
        {
            $project: {
                video: 1,
            },
        },
        {
            $unwind: "$video",
        },
    ]);
    if (!likedVideos) {
        throw new apiError(
            500,
            "Liked Videos could not be fetched successfully | Some unknown error occured at our end"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
