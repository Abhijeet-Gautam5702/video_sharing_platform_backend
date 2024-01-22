import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

const userRouter = Router();

userRouter.route("/register").get(registerUser);

export default userRouter;
