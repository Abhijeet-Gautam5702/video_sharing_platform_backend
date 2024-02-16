import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylists,
    getVideosInPlaylist,
    removeVideoFromPlaylist,
    updatePlaylistDetails,
} from "../controllers/playlist.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { multerUpload } from "../middlewares/multer.middlewares.js";

const playlistRouter = Router();

// Secured Routes

playlistRouter
    .route("/create-playlist")
    .post(verifyJWT, multerUpload.none(), createPlaylist);

playlistRouter
    .route("/delete-playlist/:playlistId")
    .delete(verifyJWT, deletePlaylist);

playlistRouter.route("/get-playlists").get(verifyJWT, getPlaylists);

playlistRouter
    .route("/update-playlist/:playlistId")
    .put(multerUpload.none(), verifyJWT, updatePlaylistDetails);

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
