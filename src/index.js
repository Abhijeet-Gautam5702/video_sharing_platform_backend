// Imports
import connectDB from "./db/db.js";
import dotenv from "dotenv";

// NOTE: Congifure the dotenv package as soon as the entry file (here index.js) loads.
dotenv.config();

// Invoking the connectionDB function to connect to the MongoDB database.
connectDB();
