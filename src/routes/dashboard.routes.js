import { Router } from "express";
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const dashboardRouter = Router();

// Secured Routes

dashboardRouter.route("/get-channel-stats").get(verifyJWT, getChannelStats);

dashboardRouter.route("/get-channel-videos").get(verifyJWT, getChannelVideos)

export default dashboardRouter;
