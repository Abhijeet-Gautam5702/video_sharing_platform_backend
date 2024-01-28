import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import uploadOnCloudinary from "../utils/fileUpload.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/user.models.js";
import cleanDirectory from "../utils/cleanDirectory.js";
import { generateAccessAndRefreshTokens } from "../utils/tokenGenerator.js";

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
    if (req.files["avatar"]) {
        avatarLocalPath = req.files["avatar"][0].path;
    }
    if (req.files["cover"]) {
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

    //STEP-6: Send cookies
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

    //STEP-7: Send success response to the user
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
const logoutUser = asyncHandler(async (req, res) => {
    // Obtain userId from `req.user` object injected by the verifyJWT middleware (See user.routes.js file)
    const userId = req.user._id;

    // Find the user by userId and remove its refreshToken
    const user = await User.findOneAndUpdate(
        { _id: userId },
        {
            refreshToken: "",
        },
        { new: true } // If set to true => returns the new modified user object
    );

    if (user.refreshToken) {
        throw new apiError(500, "Could not log out");
    }

    // Clear cookies and send response to the user
    const cookieOptions = {
        httpOnly: true, // ensures that the cookie is not modifiable by client-side
        secure: true, // ensures that the cookie is sent over secure HTTPS connections only
    };

    res.status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new apiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
