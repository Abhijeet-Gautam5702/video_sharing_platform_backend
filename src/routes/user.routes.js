import { Router } from "express";
import {
    changeUserPassword,
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateUserAccountDetails,
    updateUserAccountImages,
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

userRouter.route("/change-password").put(verifyJWT, changeUserPassword);

userRouter.route("/get-current-user").get(verifyJWT, getCurrentUser);

userRouter
    .route("/update-account-details")
    .put(verifyJWT, updateUserAccountDetails);

userRouter.route("/update-account-images").put(
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
    verifyJWT,
    updateUserAccountImages
);



export default userRouter;
