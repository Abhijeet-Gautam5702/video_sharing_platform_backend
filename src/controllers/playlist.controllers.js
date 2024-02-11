import validateObjectId from "../utils/objectIdValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import Playlist from "../models/playlist.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

// Create a new playlist
const createPlaylist = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Playlist could not be created | User-ID not recieved"
        );
    }

    // Get title and description from req.body
    const title = req.body?.title;
    const description = req.body?.description;
    if (!title) {
        throw new apiError(
            422,
            "Playlist could not be created | Playlist title must be provided"
        );
    }

    // Check if a playlist with the same name already exists in the database
    const isPlaylistAlreadyExist = await Playlist.findOne({
        title: title.trim(),
    });
    if (isPlaylistAlreadyExist) {
        throw new apiError(
            400,
            "Playlist could not be created | Playlist with same name already exists"
        );
    }

    // Create a new playlist
    const newPlaylist = await Playlist.create({
        title: title.trim(),
        description: description?.trim() || "",
        owner: userId,
        videos: [],
    });
    if (!newPlaylist) {
        throw new apiError(
            500,
            "Playlist could not be created | Some unknown error occured from our end in creating the playlist in the database"
        );
    }

    // Send success response to the user with playlist data
    res.status(200).json(
        new apiResponse(200, newPlaylist, "Playlist created successfully")
    );
});

// Delete an entire playlist

// Update details of a playlist (Title and Description)

// Get all created playlists of the current logged-in user

// Get a playlist by its ID

// Get all videos in a playlist

// Add a video to a playlist

// Remove a video from a playlist

export { createPlaylist };
