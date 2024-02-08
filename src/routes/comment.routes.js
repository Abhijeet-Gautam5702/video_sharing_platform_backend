import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    addComment,
    deleteComment,
    editComment,
    getVideoComments,
} from "../controllers/comment.controllers.js";

const commentRouter = Router();

// SECURED ROUTES
commentRouter.route("/comments/:videoId").get(verifyJWT, getVideoComments);

commentRouter.route("/add-comment/:videoId").post(verifyJWT, addComment);

commentRouter
    .route("/delete-comment/:videoId/:commentId")
    .delete(verifyJWT, deleteComment);

commentRouter
    .route("/edit-comment/:commentId")
    .put(verifyJWT, editComment);

export { commentRouter };
