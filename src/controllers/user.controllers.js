import asyncHandler from "../utils/asyncHandler.js";

// CONTROLLER: User Registration
const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Hello World",
    });
});

export { registerUser };
