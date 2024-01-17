import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

/*
NOTE: Always use try-catch blocks and async-await structures while working with databases.
*/

async function connectDB() {
    try {
        // DB connection request returns an object
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_DB_URI}/${DB_NAME}`
        );
        /* 
        Connection Host shows the complete URL on which the DB is hosted. 
        This is because there are different database connections for dev, prod and testing.
        By logging connection-host, we get to know what database we are connected to.
        */
        console.log(
            `\n MongoDB connected. Connection Host: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error}`);
        process.exit(1); // Node feature: Exit the process with code-1
    }
}

export default connectDB;
