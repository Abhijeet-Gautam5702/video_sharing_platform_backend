import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import validateObjectId from "../utils/objectIdValidator.js";

// Toggle video like
const toggleVideoLike = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user

    // Get videoId from req.params

    // Check if the videoId provided is valid or not

    // Check if the video exists in the database

    // Delete the "Like" document if it exists in the database

    // Create a new "Like" document if it doesn't exist

    // Send success response to the user
});

// Toggle comment like
const toggleCommentLike = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user

    // Get comemntId from req.params

    // Check if the commentId provided is valid or not

    // Check if the comment exists in the database

    // Delete the "Like" document if it exists in the database

    // Create a new "Like" document if it doesn't exist

    // Send success response to the user
});

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    // Authorization check by Auth Middleware

    // Get userId from req.user

    // Search all the "Like" documents and get those video-liked documents that have been liked by the current logged-in user

    // Send success response to the user
});

export { toggleCommentLike, toggleVideoLike, getLikedVideos };
