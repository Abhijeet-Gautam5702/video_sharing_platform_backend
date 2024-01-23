import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.models.js";

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
*/
const registerUser = asyncHandler(async (req, res) => {
    const { username, fullname, email, password } = req.body;

    if (
        // returns true if any of the fields is either empty string or undefined
        // throw a custom apiError object defined in src/utils
        [username, fullname, email, password].some((field) => {
            return (field && field.trim() === "") || !field;
        })
    ) {
        throw new apiError(400, "One or more fields are empty");
    }

    const isUserExist = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (isUserExist) {
        throw new apiError(
            409,
            "User with this email or username already exists"
        );
    }
    // --------------------------------------------------------

    // Code for handling images PENDING

    // ---------------------------------------------------------

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        // avatar :pending
        // coverImage :pending
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new apiError(500, "User could not be created");
    }

    res.status(200).json(
        new apiResponse(200, createdUser, "User Registration Successful")
    );
});

export { registerUser };
