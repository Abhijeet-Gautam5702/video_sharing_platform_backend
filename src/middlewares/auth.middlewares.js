/*
    AUTH MIDDLEWARE to verify the user (using the cookies)

    In order to create secured (or "gated" or "authenticated") routes, we need the user to provide certain set of credentials. The user will be allowed to access those routes only if the credentials match with those in the database.
*/
import User from "../models/user.models.js";
import { apiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(
    async (req, _ /* "res" is not used, so put "_" */, next) => {
        // Get access token of the user
        /*
            The accessToken can be present in either of the two places:-
            1. The cookies object (we get access to req.cookies from the cookie-Parser middleware)
            2. The header of the HTTP request

            NOTE: In website, the tokens are usually stored in cookies. But in case of mobile applications, we do not have access to cookies, so the client sends its tokens in the authorization header of the HTTP request.
        */
        const accessToken =
            req.cookies?.accessToken ||
            req.headers.authorization?.replace("Bearer ", ""); // JS replace() method: replace "Bearer " (if found in the given string) with ""

        if (!accessToken) {
            throw new apiError(401, "Unauthorized request");
        }

        // If the token is verified => The payload (data) is returned as a JS-Object
        const decodedTokenInfo = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_SECRET
        );

        // Get the user object from the database
        const user = await User.findById(decodedTokenInfo?._id).select(
            "-refreshToken -password "
        );
        if (!user) {
            throw new apiError(401, "Invalid Access Token");
        }

        // Create a `req.user` object in the HTTP request
        /*
            Middlewares give us the power to create a new object to the request which can then be used by the next middlewares or the controller

            For E.g.
            - cookie-Parser middleware gives us the req.cookies object
            - multer middleware gives us the req.body and req.files objects
            - express.json() middleware gives us the req.body object
        */
        req.user = user;

        next();
    }
);

export { verifyJWT };
