import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.models.js";


// CONTROLLER: Get channel profile
const getChannelProfile = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get username of the channel from the request params
    /*
        NOTE: channelUsername => username of the channel you are visiting
              req.user._id    => username of the currently logged-in user
    */
    const channelUsername = req.params.username?.trim();
    if (!channelUsername) {
        throw new apiError(400, "Username is missing");
    }

    // Get the channel details (using MongoDB Aggregation Pipelines)
    const channel = await User.aggregate([
        // STAGE-1: Match the "User" documents and find the ones with their `username` field value same as channelUsername (lowercase to ensure case-insensitivity)
        {
            $match: {
                username: channelUsername?.toLowerCase(),
            },
        },
        // Result after Stage-1: A "User" document(s) with `username` as channelUsername

        // STAGE-2: OBTAIN THE SUBSCRIBERS OF CURRENT USER :: Look up for all the "Subscriber" documents and select the ones whose `channel` field matches with the `_id` of the current modified "User" document (obtained from Stage-1)
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        // Result after Stage-2: "User" document with an additional field named `subscribers` containing the list of all the documents where the `channel` field is same as the id of channelUsername document

        // STAGE-3: OBTAINING THE CHANNELS WHICH THE CURRENT USER HAS SUBSCRIBED TO :: Look up for all the "Subscriber" documents and select the ones whose `subscriber` field matches with the `_id` of the current modified "User" document (obtained from Stage-2)
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannels",
            },
        },
        // Result after Stage-3: "User" document with another additional field named `subscribedChannels` containing list of all the documents where the `subscriber` field is the same as the id of channelUsername document.

        // STAGE-4: ADD SOME MORE FIELDS
        {
            $addFields: {
                // Calculate the size of the `subscribers` field (added by aggregation pipeline in Stage-2) of the current modified "User" document
                subscribersCount: {
                    $size: "$subscribers",
                },
                // Calculate the size of the `subscribedChannels` field (added by aggregation pipeline in Stage-3) of the current modified "User" document
                subscribedChannelsCount: {
                    $size: "$subscribedChannels",
                },
                // Check if the currently logged-in user is present as a `subscriber` field in the list given by `subscribers` (added by aggregation pipeline in Stage-2)
                isLoggedInUserSubscribedToThisChannel: {
                    $cond: {
                        if: {
                            // Is the current user present as a subscriber in the subscribers list
                            $in: [req.user?._id, "$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        // Result after Stage-4: "User" document with three more fields denoting the number of subscribers, no. of channels subscribed to, and whether the user (currently logged in user) has subscribed to channelUsername or not.

        // STAGE-5: PROJECT ONLY SOME FIELDS :: Only keep these fields in the final document to be returned and remove the remaining.
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscribedChannelsCount: 1,
                isLoggedInUserSubscribedToThisChannel: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
        // Result after Stage-5: "User" document with only the above stated fields
    ]);

    if (!channel?.length) {
        throw new apiError(404, "Channel doesn't exist");
    }

    res.status(200).json(
        new apiResponse(200, channel[0], "Channel details fetched successfully")
    );
});

export {getChannelProfile}