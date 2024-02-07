import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import uploadOnCloudinary from "../utils/fileUpload.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import cleanDirectory from "../utils/cleanDirectory.js";
import { generateAccessAndRefreshTokens } from "../utils/tokenGenerator.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/*
    COOKIES
    Small amount of client information stored by the website and sent in every request to improve user experiences such as saved-preferences, shopping-cart-details and seamless-user-authentication. Cookies are visible to all.

    COOKIE OPTIONS
    Attributes to ensure and enhance the security of the cookies
*/
const cookieOptions = {
    httpOnly: true, // ensures that the cookie is not modifiable by client-side
    secure: true, // ensures that the cookie is sent over secure HTTPS connections only
};

// CONTROLLER: User Registration
/*
    STEPS FOR USER REGISTRATION CONTROLLER

    - Get user details from the frontend (via body or headers)
    - Validation: Check if all required data is sent and data is not empty
    - Check if the user already exists (username and email are unique fields)
    - Validation: Check if the images, especially avatar (required field) are sent by client
    - Upload all images to cloudinary and obtain URL
    - Create a user object with all the necessary details using modelName.create()
    - Check if the user creation was successful
    - Remove password and refresh token fields from the response
    - Send response to the client

    NOTE: Since Multer ensures a local-upload of each static file sent by the client, it is necessary to delete them in case of any potential errors in the controller. So remember to clean the `public/temp` directory.
*/
const registerUser = asyncHandler(async (req, res) => {
    // STEP-1: Get user details from the frontend (via body or headers)
    const { username, fullname, email, password } = req.body;

    // STEP-2: Validation: Check if all required data is sent and data is not empty
    if (
        // returns true if any of the fields is either empty string or undefined
        // throw a custom apiError object defined in src/utils
        [username, fullname, email, password].some((field) => {
            return (field && field.trim() === "") || !field;
        })
    ) {
        cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder
        throw new apiError(400, "One or more fields are empty");
    }

    // STEP-3: Check if the user already exists (username and email are unique fields)
    /*
        NOTE: `$or` is a FilterQuery provided by Mongoose that finds entries in the database which contain any of the given paramaters (here, username or email)
    */
    const isUserExist = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (isUserExist) {
        cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder
        throw new apiError(
            409,
            "User with this email or username already exists"
        );
    }

    // STEP-4: Validation: Check if the images, especially avatar (required field) are sent by client
    /*
        NOTE: `req.files` is an object where fieldname is the key, and the value is array of files

        E.g. req.files.avatar[0] => First avatar file 
             req.files.avatar    => Array of Avatar files 
    */
    let avatarLocalPath = null;
    let coverImageLocalPath = null;
    if (req.files?.avatar) {
        avatarLocalPath = req.files["avatar"][0].path;
    }
    if (req.files?.cover) {
        coverImageLocalPath = req.files["cover"][0].path;
    }
    if (!avatarLocalPath) {
        cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder
        throw new apiError(400, "Avatar file is required");
    }

    // STEP-5: Upload all images to cloudinary and obtain URL
    const avatarUploaded = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarUploaded) {
        cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder
        throw new apiError(500, "Avatar file could not be uploaded");
    }
    // Upload Cover Image only if it is present locally (i.e. the client provided it)
    let coverImageUploaded = null;
    if (coverImageLocalPath) {
        coverImageUploaded = await uploadOnCloudinary(coverImageLocalPath);
    }

    // STEP-6: Create a user object with all the necessary details using modelName.create()
    const user = await User.create({
        username: username, // store username in lowercase in the Database
        email,
        password,
        fullname,
        avatar: avatarUploaded.url,
        coverImage: coverImageUploaded?.url || "", // OPTIONAL FIELD: if coverImage isn't provided, store empty string
    });

    // STEP-7: Remove password and refresh token fields from the response
    /*
        NOTE: Mongoose provides QUERY PROJECTION using the `.select()` to exclude certain fields ("-password -refreshToken") and then return the modified instance
    */
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // STEP-8: Check if the user creation was successful
    if (!createdUser) {
        cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder
        throw new apiError(500, "User could not be created");
    }

    // STEP-9: Send response to the client
    res.status(200).json(
        new apiResponse(200, createdUser, "User Registration Successful")
    );
});

// CONTROLLER: User Login
/*
    STEPS FOR USER LOGIN CONTROLLER

    - Get data from the client using headers or body
        - Either take email or username for login
    - Check for all the required data
    - Check if the user exists in the database
    - Validate the password
    - Create access and refresh tokens
    - Send secure cookies
    - Send success response to the user
*/
const loginUser = asyncHandler(async (req, res) => {
    // STEP-1: Get data from the client using headers or body
    const { email, username, password } = req.body;

    // STEP-2: Check for all the required data
    /*
        - Either Email or Username is required to login
        - Password must be given by the client
    */
    if (!(email || username)) {
        throw new apiError(
            400,
            "Either Email or username is required to login"
        );
    }
    if (!password) {
        throw new apiError(400, "Password field is required");
    }

    // STEP-3: Check if the user exists in the database (using either email or username)
    const user = await User.findOne({
        $or: [{ email }, { username }], // Query Projection
    });
    if (!user) {
        throw new apiError(
            404,
            "No user with the given credentials found in the database"
        );
    }

    // STEP-4: Validate the password
    /*
        NOTE: Custom Mongoose Methods are valid only on Mongoose documents (or instances of the Mongoose models) that we create and not the Mongoose models.
    */
    const isPasswordCorrect = await user.validatePassword(password);
    if (!isPasswordCorrect) {
        throw new apiError(401, "Incorrect user credentials");
    }

    // STEP-5: Create access and refresh tokens
    const tokens = await generateAccessAndRefreshTokens(user);
    const userAccessToken = tokens.accessToken;
    const userRefreshToken = tokens.refreshToken;
    // Add refresh token to the user document in the database
    await User.updateOne(
        {
            $or: [{ username }, { email }],
        },
        { refreshToken: userRefreshToken }
    );
    // Get the modified user object
    /*
        NOTE: We are not using the `user` document obtained earlier in the code (STEP-3) becuase we have done some updates/changes in the user-document and hence we need to obtain the modified document now.
    */
    const loggedInUser = await User.findOne({
        $or: [{ username }, { email }],
    }).select("-password -refreshToken");

    //STEP-6: Send cookies with the success response to the user
    res.status(200)
        .cookie("accessToken", userAccessToken, cookieOptions)
        .cookie("refreshToken", userRefreshToken, cookieOptions)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken: userRefreshToken,
                    accessToken: userAccessToken,
                },
                "User successfully logged in"
            )
        );
});

// CONTROLLER: User Logout
/*
    STEPS FOR USER LOGOUT CONTROLLER

    - Authenticate the user => then only allow them to login (Auth Middleware)
    - Obtain userId from `req.user` object injected by the verifyJWT middleware (See user.routes.js file)
    - Find the user by userId and remove its refresh-token
    - Clear cookies and send response to the user
*/
const logoutUser = asyncHandler(async (req, res) => {
    // Obtain userId from `req.user` object injected by the verifyJWT middleware (See user.routes.js file)
    const userId = req.user._id;

    // Find the user by userId and remove its refreshToken
    const user = await User.findOneAndUpdate(
        { _id: userId },
        {
            // `$unset` remove the field from the document
            $unset:{
                refreshToken:1,
            }
        },
        { new: true } // If set to true => returns the new modified user object
    );

    if (user.refreshToken) {
        throw new apiError(500, "Could not log out");
    }

    // Clear cookies and send response to the user
    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new apiResponse(200, {}, "User logged out successfully"));
});

// CONTROLLER: Refresh the user access token
/*
    STEPS FOR REFRESH-ACCESS-TOKEN CONTROLLER

    - Get the refresh token of the user from the cookies
    - Check if the refresh token provided by the user is same as that present in the database
    - Generate new access and refresh tokens & send them to the cookies with the success-message response
*/
const refreshAccessToken = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get the refresh token of the user from the cookies
    /*
        NOTE: There could be a case where somebody sends the refresh token via the request body (In case of Mobile Applications where there is no concept of cookies). So we need to check for refresh tokens in both the places.

        (This was the same thing done in `auth.middlewares.js`)
    */
    const refreshTokenFromCookie =
        req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshTokenFromCookie) {
        throw new apiError(401, "Unauthorized Request");
    }

    // Check if the refresh token provided by the user is same as that present in the database
    const decodedInfoFromToken = jwt.verify(
        refreshTokenFromCookie,
        process.env.REFRESH_TOKEN_SECRET
    );
    const userId = decodedInfoFromToken._id;
    const user = await User.findById(userId);
    if (!user) {
        throw new apiError(404, "User doesn't exist");
    }
    if (user.refreshToken !== refreshTokenFromCookie) {
        throw new apiError(401, "Refresh token is expired");
    }

    // Generate new access and refresh tokens & send them to the cookies with the success-message response
    const newTokens = await generateAccessAndRefreshTokens(user);
    const newAccessToken = newTokens.accessToken;
    const newRefreshToken = newTokens.refreshToken;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            refreshToken: newRefreshToken,
        },
        { new: true }
    );
    if (!updatedUser) {
        throw new apiError(500, "Refresh Token could not be updated");
    }

    res.status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(
            new apiResponse(
                200,
                {
                    user: updatedUser,
                    accessToken: newAccessToken,
                },
                "User access token successfully refreshed"
            )
        );
});

// CONTROLLER: Change the password of the current logged-in user
/*
    STEPS FOR CHANGE-PASSWORD CONTROLLER

    - Authentication: Verify whether the user is authorized to hit this secured route
    - Get details from the user and 
        - Check if all the required details are provided
        - Check if the new password and old password are different
        - Check if the new password and the confirm-password are the same
    - Check if the old password is the correct one
    - Update the password and save
    - Send success response to the user
*/
const changeUserPassword = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get details from the user
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Check if all the required details are provided
    if (
        [oldPassword, newPassword, confirmPassword].some(
            (field) => !field || (field && field.trim() === "")
        )
    ) {
        throw new apiError(400, "One or more fields are empty");
    }

    // Check if the new password and old password are different
    if (newPassword?.trim() === oldPassword?.trim()) {
        throw new apiError(
            400,
            "The old and the new passwords must not be same"
        );
    }

    // Check if the new password and the confirm-password are the same
    if (newPassword?.trim() !== confirmPassword?.trim()) {
        throw new apiError(
            400,
            "The new password and the confirm-password field doesn't match"
        );
    }

    // Check if the old password is the correct one
    const userId = req.user._id;
    const user = await User.findById(userId);
    const isPasswordCorrect = await user.validatePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Old Password is incorrect");
    }

    // Update the password and save the document
    /*
        NOTE: Since we had already written a Mongoose Pre-Middleware for encrypting the password before saving, we need not worry about encrypting the new password again. Mongoose will take care of it automatically.
    */
    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); // Do not forget to save the document after making changes

    // Send success message to the user
    res.status(200).json(
        new apiResponse(200, {}, "User password changed successfully")
    );
});

// CONTROLLER: Get the current user (Usually used to display the currently logged user details)
const getCurrentUser = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    const user = req.user;

    res.status(200).json(
        new apiResponse(200, user, "User data fetched successfully")
    );
});

// CONTROLLER: Update user account details (textual data only)
const updateUserAccountDetails = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get necessary details from the user
    const { fullname, email } = req.body;

    // Update those fields which are non-empty and keep the empty fields unchanged in database
    const user = req.user;
    if (fullname?.trim()) {
        user.fullname = fullname;
    }
    if (email?.trim()) {
        user.email = email;
    }
    await user.save(); // Do not forget to save the document after making the changes

    // Send success response to the user
    res.status(200).json(
        new apiResponse(200, user, "User account details updated successfully")
    );
});

// CONTROLLER: Update user account images (Cover Image and Avatar Image)
const updateUserAccountImages = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get the user from the req.user object injected by the Auth-midlleware
    const user = req.user;

    // Get the local file paths of cover-image and avatar
    let avatarLocalPath = null;
    if (req.files?.avatar) {
        avatarLocalPath = req.files?.avatar[0]?.path;
    }

    let coverImageLocalPath = null;
    if (req.files?.cover) {
        coverImageLocalPath = req.files?.cover[0]?.path;
    }

    // Upload the images on Cloudinary and get their public URLs
    let avatarUploaded = null;
    let coverImageUploaded = null;
    if (avatarLocalPath) {
        avatarUploaded = await uploadOnCloudinary(avatarLocalPath);
    }
    if (coverImageLocalPath) {
        coverImageUploaded = await uploadOnCloudinary(coverImageLocalPath);
    }

    user.avatar = avatarUploaded?.url || user.avatar;
    user.coverImage = coverImageUploaded?.url || user.coverImage;
    await user.save();

    cleanDirectory("./public/temp"); // clean the temporarily stored static assets in `temp` folder

    // Send success response to the user
    res.status(200).json(
        new apiResponse(
            200,
            user,
            "User avatar and cover-image successfully updated"
        )
    );
});

// CONTROLLER: Get user watch history
const getUserWatchHistory = asyncHandler(async (req, res) => {
    // Authentication: Verify whether the user is authorized to hit this secured route

    // Get the "User" document with its Watch History
    const user = await User.aggregate([
        // STAGE-1: Match all "User" documents and find the one with `_id` same as that of the given `_id`
        {
            $match: {
                // IMPORTANT NOTE: Mongoose handles the conversion under the hoods and give us the user-ID in string format, but the actual user-ID stored in MongoDB database is of the type ObjectId. Since the aggregation pipelines are not handled by Mongoose, so we need to convert it to the desired format.
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        // STAGE-2: From the currently modified "User" document, take the localField as the video-IDs given in the `watchHistory` field and lookup for them in the "Video" documents. Call the resultant field as `watchHistory`.
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                // SUB-PIPELINE: Each "Video" document has an `owner` field that is itself User-ID. We need the owner details of that video as well. So we setup another 'nested' pipeline within this lookup before returning to STAGE-2 of the original pipeline.
                pipeline: [
                    // STAGE-2.1: Lookup for the `owner` field in the current "Video" document and match it with the `_id` in "User" documents.
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // ANOTHER SUB-PIPELINE: We do not want to get all the details of the owner, but only a few (e.g., username, fullname and avatar). So we setup another pipeline and project the fields into the `owner` field accordingly, before returning to STAGE-2.1
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullname: 1,
                                    },
                                },
                            ],
                        },
                    },
                    // STAGE-2.2: Stage-2.1 returns an array of objects in the `owner` field, with the 1st value (0th index) as our desired owner object. We would like to convert that array to a single object for convinience.
                    {
                        $addFields: {
                            // The newly created field is also named `owner` so that it overrrides the `owner` field (which is actually an array of objects)
                            owner: {
                                $first: "$owner", // grab the first element of the `owner` field array
                            },
                        },
                    },
                    // STAGE-2.3: Only project certain fields of the "Video" documents before returning to STAGE-2
                    {
                        $project: {
                            videoFile: 1,
                            owner: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                        },
                    },
                ],
            },
        },
        // STAGE-3: Only get certain fields in the final "User" document
        {
            $project: {
                username: 1,
                fullname: 1,
                email: 1,
                watchHistory: 1,
            },
        },
    ]);
    if (!user.length) {
        throw new apiError(404, "User not found in the database");
    }

    // Send success response along with data to the user
    res.status(200).json(
        new apiResponse(200, user[0], "User watch history successfully fetched")
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserAccountDetails,
    updateUserAccountImages,
    getUserWatchHistory,
};
