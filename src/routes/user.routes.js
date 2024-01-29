import { Router } from "express";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "../controllers/user.controllers.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router();

userRouter.route("/register").post(
    multerUpload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "cover",
            maxCount: 1,
        },
    ]),
    registerUser
);

userRouter.route("/login").post(multerUpload.none(), loginUser);

userRouter.route("/refresh-access-token").put(refreshAccessToken);

// SECURED ROUTES
userRouter.route("/logout").post(verifyJWT, logoutUser);

export default userRouter;
