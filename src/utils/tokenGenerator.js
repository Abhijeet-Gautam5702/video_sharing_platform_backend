// Utility to generate access and refresh tokens

import { apiError } from "./apiError.js";

async function generateAccessAndRefreshTokens(user) {
    try {
        const refreshToken = await user.generateRefreshToken();
        const accessToken = await user.generateAccessToken();
        const tokens = { refreshToken, accessToken };
        return tokens;
    } catch (error) {
        throw new apiError(500, "Tokens could not be generated from our end");
    }
}

export { generateAccessAndRefreshTokens };
