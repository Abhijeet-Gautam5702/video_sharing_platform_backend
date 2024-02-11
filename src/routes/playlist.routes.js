import { Router } from "express";
import { createPlaylist } from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";

const playlistRouter = Router();

// Secured Routes

playlistRouter
    .route("/create-playlist")
    .post(verifyJWT, multerUpload.none(), createPlaylist);

export default playlistRouter;
