import { Router } from "express";
import {} from "../controllers/like.controllers";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const likeRouter = Router();

// Secured routes

export default likeRouter;
