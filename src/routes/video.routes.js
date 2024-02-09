import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    getAllVideos,
    getPublishedVideoById,
    publishVideo,
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

export default videoRouter;
