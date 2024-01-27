import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controllers.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";

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

export default userRouter;
