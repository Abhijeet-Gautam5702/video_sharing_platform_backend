import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    getPlaylistById,
    getPlaylists,
    getVideosInPlaylist,
    removeVideoFromPlaylist,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";

const playlistRouter = Router();

// Secured Routes

playlistRouter
    .route("/create-playlist")
    .post(verifyJWT, multerUpload.none(), createPlaylist);

playlistRouter.route("/get-playlists").get(verifyJWT, getPlaylists);

playlistRouter
    .route("/add-video-to-playlist/:playlistId")
    .post(multerUpload.none(), verifyJWT, addVideoToPlaylist);

playlistRouter
    .route("/get-videos-in-playlist/:playlistId")
    .get(verifyJWT, getVideosInPlaylist);

playlistRouter
    .route("/get-playlist-by-id/:playlistId")
    .get(verifyJWT, getPlaylistById);

playlistRouter
    .route("/remove-video-from-playlist/:playlistId")
    .put(multerUpload.none(), verifyJWT, removeVideoFromPlaylist);

export default playlistRouter;
