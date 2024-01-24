import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// MIDDLEWARES

/* 
    `cors() Middleware: Ensure that specific URLs/clients are able to interact with backend
*/
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

/*
    `express.json()` Middleware: Used to take JSON inputs from request body
*/
app.use(
    express.json({
        limit: "16kb",
    })
);

/*
    `express.urlencoded()` Middleware: Used to take inputs from URL-encoded payloads
*/
app.use(
    express.urlencoded({
        extended: true,
        limit: "16kb",
    })
);

/*
    `express.static()` Middleware: Used to store static assets/files like PDFs, images, icons etc.
*/
app.use(express.static("public")); // "public" is the name of the folder

/*
    `cookieParser()` Middleware: Used to store secure cookie which only the Server can read
*/
app.use(cookieParser());

// IMPORT ROUTES
import userRouter from "./routes/user.routes.js";

// Routes Declaration
app.use("/api/v1/users", userRouter);

export default app;
