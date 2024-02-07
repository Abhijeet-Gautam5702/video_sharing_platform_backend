import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { addComment, getVideoComments } from "../controllers/comment.controllers.js";

const commentRouter = Router();

// SECURED ROUTES
commentRouter.route("/comments/:videoId").get(verifyJWT, getVideoComments);

commentRouter.route("/add-comment/:videoId").post(verifyJWT, addComment)

export { commentRouter };
