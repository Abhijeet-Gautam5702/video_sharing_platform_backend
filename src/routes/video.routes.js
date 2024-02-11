import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    deleteVideo,
    getAllVideos,
    getPublishedVideoById,
    publishVideo,
    toggleVideoPublishStatus,
    updateVideoDetails,
    updateVideoThumbnail,
} from "../controllers/video.controllers.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";

const videoRouter = Router();

// Secured Routes

videoRouter.route("/get-videos").get(verifyJWT, getAllVideos);

videoRouter
    .route("/get-video-by-id/:videoId")
    .get(verifyJWT, getPublishedVideoById);

videoRouter.route("/publish-video").post(
    verifyJWT,
    multerUpload.fields([
        {
            name: "thumbnail",
            maxCount: 1,
        },
        {
            name: "videoFile",
            maxCount: 1,
        },
    ]),
    publishVideo
);

videoRouter
    .route("/update-video-details/:videoId")
    .patch(multerUpload.none(), verifyJWT, updateVideoDetails);

videoRouter
    .route("/update-video-thumbnail/:videoId")
    .patch(multerUpload.single("thumbnail"), verifyJWT, updateVideoThumbnail);

videoRouter.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);

videoRouter
    .route("/toggle-video-publish-status/:videoId")
    .patch(verifyJWT, toggleVideoPublishStatus);

export default videoRouter;
