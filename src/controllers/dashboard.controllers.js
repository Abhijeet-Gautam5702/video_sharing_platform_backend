import validateObjectId from "../utils/objectIdValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import mongoose from "mongoose";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res) => {
    // User Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            422,
            "Channel Stats could not be fetched | User-ID not recieved"
        );
    }

    // Get the channel-stats
    // Total views of all the videos
    // Number of subscribers
    // Number of channels/users you are subscribed to
    const channelStats = await User.aggregate([
        // Get the user document
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId),
            },
        },
        // Add additional field "subscribers" containing a list of subscribers of the user/channel
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        // Add additional field "subscribedTo" containing a list of users/channels, the current user has subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        // Add additional field "publishedVideos" containing a list of all videos whose owner is the current user
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "publishedVideos",
                pipeline: [
                    // Omit owner details
                    {
                        $project: {
                            owner: 0,
                        },
                    },
                ],
            },
        },
        // Add additional fields containing the subscriberCount, subscribedToCount, totalVideoViewCount
        {
            $addFields: {
                totalVideoViewCount: {
                    $sum: "$publishedVideos.views",
                },
                subscriberCount: {
                    $sum: "$subscribers",
                },
                subscribedToCount: {
                    $sum: "$subscribedTo",
                },
            },
        },
        // Project only certain fields
        {
            $project: {
                publishedVideos: 1,
                totalVideoViewCount: 1,
                subscribedToCount: 1,
                subscriberCount: 1,
            },
        },
    ]);
    if (!channelStats.length) {
        throw new apiError(
            404,
            "Channel Stats could not be fetched | Some unknown error occured at our end"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(
            200,
            channelStats[0],
            "Channel Stats fetched successfully"
        )
    );
});

// Get channel videos
const getChannelVideos = asyncHandler(async (req, res) => {
    // User Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Videos cannot be fetched | User-ID not recieved"
        );
    }

    // Get all the videos published by the user in the database
    const publishedVideos = await Video.find({ owner: userId }).select(
        "-owner"
    );
    if (!publishedVideos) {
        throw new apiError(404, "No videos found");
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(
            200,
            publishedVideos,
            "Published videos fetched successfully"
        )
    );
});

export { getChannelStats, getChannelVideos };
