import { Router } from "express";
import { getChannelProfile } from "../controllers/channel.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const channelRouter = Router();

channelRouter.route("/:username").get(verifyJWT, getChannelProfile)

export default channelRouter;