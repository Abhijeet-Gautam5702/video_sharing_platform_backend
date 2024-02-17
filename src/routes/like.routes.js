import { Router } from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
} from "../controllers/like.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const likeRouter = Router();

// Secured routes

likeRouter.route("/get-liked-videos").get(verifyJWT, getLikedVideos);

likeRouter
    .route("/toggle-comment-like/:commentId")
    .post(verifyJWT, toggleCommentLike);

likeRouter
    .route("/toggle-video-like/:videoId")
    .post(verifyJWT, toggleVideoLike);

export default likeRouter;
