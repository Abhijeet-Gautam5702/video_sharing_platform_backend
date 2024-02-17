import validateObjectId from "../utils/objectIdValidator.js";
import asyncHandler from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res) => {});

// Get channel videos
const getChannelVideos = asyncHandler(async (req, res) => {});

export { getChannelStats, getChannelVideos };
