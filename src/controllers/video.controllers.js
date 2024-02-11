import Video from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cleanDirectory from "../utils/cleanDirectory.js";
import uploadOnCloudinary from "../utils/fileUpload.js";
import mongoose, { isValidObjectId } from "mongoose";

// Get all videos created by the user
const getAllVideos = asyncHandler(async (req, res) => {
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

// Get a published video by its ID
const getPublishedVideoById = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Video could not be fetched | User-ID not recieved"
        );
    }

    // Get videoId from request params
    const videoId = req.params?.videoId;
    if (!videoId) {
        throw new apiError(
            422,
            "Video could not be fetched | Video-ID not recieved"
        );
    }

    // Search for the desired video
    const publishedVideo = await Video.aggregate([
        // STAGE-1: Match all "Video" documents whose `_id` field matches with videoId (We'll get only one such document)
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId),
            },
        },
        // STAGE-2: Lookup for the "User" documents (in the "users" database) with their `_id` same as the `owner` field in the modified "Video" document(s) from Stage-2
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    // STAGE-2.1: Project only the following fields in the `owner` field of each document
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                            fullname: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        // STAGE-3: Unwind the `owner` field (which is an array) into an object
        {
            $unwind: "$owner",
        },
    ]);
    if (!publishedVideo.length) {
        throw new apiError(
            404,
            "Video could not be fetched | Video with the given ID not found"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, publishedVideo, "Video fetched successfully")
    );
});

// Publish a new video
const publishVideo = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    try {
        // Get userId from req.user
        const userId = req.user?._id;
        if (!userId) {
            throw new apiError(
                500,
                "Video could not be published | User-ID not recieved"
            );
        }

        // Get title and description from req.body
        const { title, description } = req.body;
        if (!title && !description) {
            throw new apiError(
                422,
                "Video could not be published | One or more required fields are not provided"
            );
        }

        // Get temporary local paths of Video-thumbnail and Video-file
        let videoThumbnailLocalPath = null;
        if (req.files?.thumbnail) {
            videoThumbnailLocalPath = req.files?.thumbnail[0]?.path;
        }
        // console.log(videoThumbnailLocalPath);

        let videoFileLocalPath = null;
        if (req.files?.videoFile) {
            videoFileLocalPath = req.files?.videoFile[0]?.path;
        }
        // console.log(videoFileLocalPath);

        if (!videoThumbnailLocalPath) {
            throw new apiError(
                422,
                "Video could not be published | Video Thumbnail must be provided"
            );
        }

        if (!videoFileLocalPath) {
            throw new apiError(
                422,
                "Video could not be published | Video File must be provided"
            );
        }

        // Upload on Cloudinary and get the public URL
        const videoThumbnailUploaded = await uploadOnCloudinary(
            videoThumbnailLocalPath
        );
        const videoFileUploaded = await uploadOnCloudinary(videoFileLocalPath);

        if (!videoThumbnailUploaded?.url) {
            throw new apiError(
                500,
                "Video could not be published | Video Thumbnail could not be uploaded to the CDN"
            );
        }
        if (!videoFileUploaded?.url) {
            throw new apiError(
                500,
                "Video could not be published | Video File could not be uploaded to the CDN"
            );
        }
        // console.log(videoThumbnailUploaded?.url);
        // console.log(videoFileUploaded?.url);

        // Create a new "Video" document in the database
        const newVideo = await Video.create({
            title,
            description,
            owner: userId,
            videoFile: videoFileUploaded?.url,
            thumbnail: videoThumbnailUploaded?.url,
        });

        // Send success response to the user with the uploaded video-details
        res.status(200).json(
            new apiResponse(200, newVideo, "New video published successfully")
        );
    } catch (error) {
        throw new apiError(error.statusCode || 500, error.message);
    } finally {
        cleanDirectory("./public/temp");
    }
});

// Update a video (title & description)
const updateVideoDetails = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get relevant video details from req.body
    const { title, description } = req.body;
    if (!title && !description) {
        throw new apiError(
            422,
            "Could not update video | At least one of the required fields must be provided"
        );
    }

    // Get the userId from req.user
    const userId = req.user?._id;
    if (!userId) {
        throw new apiError(
            500,
            "Could not update video | User-ID not recieved"
        );
    }

    // Get the videoId from req.params
    const videoId = req.params?.videoId;
    if (!videoId) {
        throw new apiError(
            422,
            "Could not update video | Video-ID not provided"
        );
    }

    // Check if the video exists in the database
    const video = await Video.findById(videoId);
    if (!video) {
        throw new apiError(
            404,
            "Could not update video | Invalid Video-ID provided | Video doesn't exist or it may be deleted"
        );
    }

    // Check if the user is authorized to change the details of the video
    const isUserOwnerOfTheVideo =
        video.owner?.toString() === userId?.toString();
    if (!isUserOwnerOfTheVideo) {
        throw new apiError(
            400,
            "Could not update video | Unauthorized request | Only video owner can change details of the video"
        );
    }

    // Update the details of the video
    video.title = title?.trim() || video.title;
    video.description = description?.trim() || video.description;
    await video.save();

    // Send success response to the user with the updated video data
    res.status(200).json(
        new apiResponse(200, video, "Video details updated successfully")
    );
});

// Update the thumbnail of a video
const updateVideoThumbnail = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    try {
        // Get the thumbnail file from req.file
        const videoThumbnail = req.file;
        if (!videoThumbnail) {
            throw new apiError(
                422,
                "Could not update thumbnail | Video-Thumbnail not recieved"
            );
        }

        // Get the userId from req.user
        const userId = req.user?._id;
        if (!userId) {
            throw new apiError(
                500,
                "Could not update thumbnail | User-ID not recieved"
            );
        }

        // Get the videoId from req.params
        const videoId = req.params?.videoId;
        if (!videoId) {
            throw new apiError(
                422,
                "Could not update thumbnail | Video-ID not recieved"
            );
        }

        // Check if the video exists
        const video = await Video.findById(videoId);
        if (!video) {
            throw new apiError(
                404,
                "Could not update thumbnail | Video does not exist or it may be deleted"
            );
        }

        // Check if the user is authorized to makes changes to the video
        const isUserOwnerOfTheVideo =
            video.owner.toString() === userId.toString();
        if (!isUserOwnerOfTheVideo) {
            throw new apiError(
                400,
                "Could not update thumbnail | Only the owner of the video can make changes to the video"
            );
        }

        // Get the local path of the video-thumbnail
        const videoThumbnailLocalPath = videoThumbnail.path;
        // Upload the video-thumbnail to Cloudinary
        const videoThumbnailUploaded = await uploadOnCloudinary(
            videoThumbnailLocalPath
        );
        if (!videoThumbnailUploaded) {
            throw new apiError(
                500,
                "Could not update thumbnail | Video-Thumbnail image could not uploaded on Cloudinary from our end"
            );
        }
        // Update the `thumbnail` field of the "Video" document with the new public URL
        video.thumbnail = videoThumbnailUploaded.url || video.thumbnail;
        await video.save();

        // Send success response to the user with new video data
        res.status(200).json(
            new apiResponse(200, video, "Video thumbnail updated successfully")
        );
    } catch (error) {
        throw new apiError(
            error.statusCode || 500,
            error.message || "Some unknown error occured from our end"
        );
    } finally {
        // In any case, clean the "./public/temp" directory
        cleanDirectory("./public/temp");
    }
});

// Delete a published video
const deleteVideo = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get the userId and videoId
    const userId = req.user?._id;
    const videoId = req.params?.videoId;
    if (!userId) {
        throw new apiError(
            500,
            "Could not delete video | User-ID not recieved"
        );
    }
    if (!videoId) {
        throw new apiError(
            422,
            "Could not delete video | Video-ID not provided"
        );
    }

    // Check if the video exists in the database
    const video = await Video.findById(videoId);
    if (!video) {
        throw new apiError(
            404,
            "Could not delete video | Invalid Video-ID provided | Video doesn't exist or it may be deleted"
        );
    }

    // Check if the user is authorized to change the details of the video
    const isUserOwnerOfTheVideo =
        video.owner?.toString() === userId?.toString();
    if (!isUserOwnerOfTheVideo) {
        throw new apiError(
            400,
            "Could not delete video | Unauthorized request | Only video owner can change details of the video"
        );
    }

    // Delete the video
    const deleteVideo = await Video.findByIdAndDelete(videoId);
    if (!deleteVideo) {
        throw new apiError(
            500,
            "Video deletion unsuccessful | Some unknown error occured from our end"
        );
    }

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, {}, "Video deleted successfully")
    );
});

// Toggle the status of a video to published/unpublished
const toggleVideoPublishStatus = asyncHandler(async (req, res) => {
    // Authorization check by Auth middleware

    // Get the userId and videoId
    const userId = req.user?._id;
    const videoId = req.params?.videoId;
    if (!userId) {
        throw new apiError(
            500,
            "Could not toggle video publish status | User-ID not recieved"
        );
    }
    if (!videoId) {
        throw new apiError(
            422,
            "Could not toggle video publish status | Video-ID not provided"
        );
    }

    // Check if the video exists in the database
    const video = await Video.findById(videoId);
    if (!video) {
        throw new apiError(
            404,
            "Could not toggle video publish status | Invalid Video-ID provided | Video doesn't exist or it may be deleted"
        );
    }

    // Check if the user is authorized to change the details of the video
    const isUserOwnerOfTheVideo =
        video.owner?.toString() === userId?.toString();
    if (!isUserOwnerOfTheVideo) {
        throw new apiError(
            400,
            "Could not toggle video publish status | Unauthorized request | Only video owner can change details of the video"
        );
    }

    // Change the publish status of the video
    video.isPublished = !video.isPublished;
    await video.save();

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, {}, "Video publish-status changed successfully")
    );
});

export {
    getAllVideos,
    getPublishedVideoById,
    publishVideo,
    updateVideoDetails,
    deleteVideo,
    toggleVideoPublishStatus,
    updateVideoThumbnail,
};
