import validateObjectId from "../utils/objectIdValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import Playlist from "../models/playlist.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

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

// Get all created playlists of the current logged-in user
const getPlaylists = asyncHandler(async (req, res) => {
    // Authorize user by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Playlists could not be fetched | User-ID not recieved"
        );
    }

    // Find all playlists with owner as the userId
    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
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
                            email: 1,
                            fullname: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
            },
        },
    ]);
    if (!playlists) {
        throw new apiError(
            500,
            "Playlists could not be fetched | Some unknown error occured at our end"
        );
    }

    // Send success response to the user with data
    res.status(200).json(
        new apiResponse(200, playlists, "Playlists fetched successfully")
    );
});

// Delete an entire playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Playlist could not be deleted successfully | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!validateObjectId(playlistId)) {
        throw new apiError(
            422,
            "Playlist could not be deleted successfully | Invalid Playlist-ID"
        );
    }
    if (!playlistId) {
        throw new apiError(
            422,
            "Playlist could not be deleted successfully | Playlist-ID not recieved"
        );
    }

    // Check if there exists a playlist with the given ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(
            404,
            "Playlist could not be deleted successfully | No playlist exists with the given ID"
        );
    }

    // Check if the user is authorized to make changes to the playlist
    const isUserOwnerOfPlaylist =
        playlist.owner.toString() === userId.toString();
    if (!isUserOwnerOfPlaylist) {
        throw new apiError(
            400,
            "Playlist could not be deleted successfully | Only the owner of the playlist can add videos to it"
        );
    }

    // Delete the playlist from the database
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletedPlaylist) {
        throw new apiError(
            500,
            "Playlist could not be deleted successfully | Some unknown error occured at our end"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, {}, "Playlist deleted successfully")
    );
});

// Update details of a playlist (Title and Description)
const updatePlaylistDetails = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Playlist could not be deleted successfully | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!validateObjectId(playlistId)) {
        throw new apiError(
            422,
            "Playlist details could not be updated successfully | Invalid Playlist-ID"
        );
    }
    if (!playlistId) {
        throw new apiError(
            422,
            "Playlist details could not be updated successfully | Playlist-ID not recieved"
        );
    }

    // Get playlist details to be updated from the request body
    const { title, description } = req.body;
    if (!title && !description) {
        throw new apiError(
            422,
            "Playlist details could not be updated successfully | At least one of the fields must be provided"
        );
    }

    // Check if there exists a playlist with the given ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(
            404,
            "Playlist details could not be updated successfully | No playlist exists with the given ID"
        );
    }

    // Check if the user is authorized to make changes to the playlist
    const isUserOwnerOfPlaylist =
        playlist.owner.toString() === userId.toString();
    if (!isUserOwnerOfPlaylist) {
        throw new apiError(
            400,
            "Playlist details could not be updated successfully | Only the owner of the playlist can add videos to it"
        );
    }

    // Make changes to the playlist
    playlist.title = title || playlist.title;
    playlist.description = description || playlist.description;
    await playlist.save();

    // Send success response to the user with updated playlist data
    res.status(200).json(
        new apiResponse(
            200,
            {
                _id: playlist._id,
                title: playlist.title,
                description: playlist.description,
            },
            "Playlist details updated successfully"
        )
    );
});

// Get a playlist by its ID
const getPlaylistById = asyncHandler(async (req, res) => {
    // Authorize user by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Playlist could not be fetched successfully | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!validateObjectId(playlistId)) {
        throw new apiError(
            422,
            "Playlist could not be fetched successfully | Invalid Playlist-ID"
        );
    }
    if (!playlistId) {
        throw new apiError(
            422,
            "Playlist could not be fetched successfully | Playlist-ID not recieved"
        );
    }

    // Check if there exists a playlist with the given ID
    const isPlaylistExists = await Playlist.findById(playlistId);
    if (!isPlaylistExists) {
        throw new apiError(
            404,
            "Playlist could not be fetched successfully | No playlist exists with the given ID"
        );
    }

    // Add Video and Owner details to the playlist (MongoDB aggregation pipeline)
    const playlist = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
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
                            email: 1,
                            fullname: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            createdAt: 0,
                            updatedAt: 0,
                        },
                    },
                ],
            },
        },
    ]);
    if (!playlist) {
        throw new apiError(
            500,
            "Playlists could not be fetched | Some unknown error occured at our end"
        );
    }

    // Send success response to the user with data
    res.status(200).json(
        new apiResponse(200, playlist, "Playlist fetched successfully")
    );
});

// Get all videos in a playlist
const getVideosInPlaylist = asyncHandler(async (req, res) => {
    // Authorize user by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Videos could not be fetched from the playlist | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!playlistId) {
        throw new apiError(
            422,
            "Videos could not be fetched from the playlist | Playlist-ID not recieved"
        );
    }

    // Check if there exists a playlist with the given ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(
            404,
            "Videos could not be fetched from the playlist | No playlist exists with the given ID"
        );
    }

    // Get all videos in the playlist
    const videosInPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
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
                                        email: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                ],
            },
        },
    ]);
    if (!videosInPlaylist.length) {
        throw new apiError(
            500,
            "Videos could not be fetched from the playlist | Some unknown error occured at our end"
        );
    }

    // Send success response to the user with data
    res.status(200).json(
        new apiResponse(
            200,
            videosInPlaylist[0].videos,
            "Videos from the playlist fetched successfully"
        )
    );
});

// Add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // Authorize user by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Video could not be added to the playlist | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!playlistId) {
        throw new apiError(
            422,
            "Video could not be added to the playlist | Playlist-ID not recieved"
        );
    }

    // Get the video-ID
    const videoId = req.body?.videoId;
    if (!videoId) {
        throw new apiError(
            422,
            "Video could not be added to the playlist | Video-ID not recieved"
        );
    }

    // Check if there exists a playlist with the given ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(
            404,
            "Video could not be added to the playlist | No playlist exists with the given ID"
        );
    }

    // Check if the user is authorized to make changes to the playlist
    const isUserOwnerOfPlaylist =
        playlist.owner.toString() === userId.toString();
    if (!isUserOwnerOfPlaylist) {
        throw new apiError(
            400,
            "Video could not be added to the playlist | Only the owner of the playlist can add videos to it"
        );
    }

    // Add video to the playlist
    playlist.videos.push(videoId);
    await playlist.save();

    // Send success response to the user with data
    res.status(200).json(
        new apiResponse(200, {}, "Video added to the playlist successfully")
    );
});

// Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // Authorize user by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Video could not be deleted from the playlist | User-ID not recieved"
        );
    }

    // Get the playlist-ID
    const playlistId = req.params?.playlistId;
    if (!playlistId) {
        throw new apiError(
            422,
            "Video could not be deleted from the playlist | Playlist-ID not recieved"
        );
    }

    // Check if there exists a playlist with the given ID
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new apiError(
            404,
            "Video could not be deleted from the playlist | No playlist exists with the given ID"
        );
    }

    // Get the video-ID
    const videoId = req.body?.videoId;
    if (!videoId) {
        throw new apiError(
            422,
            "Video could not be deleted from the playlist | Video-ID not recieved"
        );
    }

    // Check if the user is authorized to make changes to the playlist
    const isUserOwnerOfPlaylist =
        playlist.owner.toString() === userId.toString();
    if (!isUserOwnerOfPlaylist) {
        throw new apiError(
            400,
            "Video could not be deleted from the playlist | Only the owner of the playlist can remove videos from it"
        );
    }

    // Remove the video from the playlist
    let vid = playlist.videos;
    vid = vid.filter((video) => !video.equals(videoId));
    playlist.videos = vid;
    await playlist.save();

    // Send response to the user
    res.status(200).json(
        new apiResponse(200, {}, "Video successfully removed from the playlist")
    );
});

export {
    createPlaylist,
    deletePlaylist,
    updatePlaylistDetails,
    getPlaylists,
    addVideoToPlaylist,
    getVideosInPlaylist,
    getPlaylistById,
    removeVideoFromPlaylist,
};
