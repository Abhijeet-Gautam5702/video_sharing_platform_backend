import Video from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import cleanDirectory from "../utils/cleanDirectory.js";
import uploadOnCloudinary from "../utils/fileUpload.js";

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
    const publishedVideos = await Video.findById(userId);

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
    const publishedVideo = await Video.findById(videoId);
    if (!publishedVideo) {
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

// Update a published video (title, description and thumbnail)

// Delete a published video

// Toggle the status of a video to published/unpublished

export { getAllVideos, getPublishedVideoById, publishVideo };
