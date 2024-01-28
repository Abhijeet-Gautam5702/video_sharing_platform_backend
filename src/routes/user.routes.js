import { Router } from "express";
import {
    loginUser,
    logoutUser,
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

// SECURED ROUTES
userRouter.route("/logout").post(verifyJWT, logoutUser);

export default userRouter;
