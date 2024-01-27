// Imports
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import app from "./app.js";
import cleanDirectory from "./utils/cleanDirectory.js";

// NOTE: Congifure the dotenv package as soon as the entry file (here index.js) loads.
dotenv.config();

// Invoking the connectionDB function to connect to the MongoDB database.
// NOTE: An async-function returns a promise
connectDB()
    .then(async () => {
        // Express listener: Listens for any errors and executes a callback
        app.on("error", (err) => {
            console.log(`EXPRESS APP ERROR | ${err}`);
            throw err;
        });
        // Express listener: Listens to the port and executes a callback (optional)
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server running on Port: ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.log(`MONGO DB CONNECTION FAILED | ${err}`);
        throw err;
    });


