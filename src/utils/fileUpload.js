/*
    FILE-UPLOAD UTILITY
    - Obtain the file from the client and store it locally in the server (using Multer)
    - Upload the locally stored file to third-party service (here, Cloudinary)

    NOTE: This is a standard 2-step mechanism followed in most production level backend projects. We can also skip this 2-step process and directly upload files to Cloudinary using Multer.
*/

import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME } from "../constants.js";

// cloudinary.config({
//     cloud_name: CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
// });
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: "558651113423662",
    api_secret: "5BfFPsfwbNtfteXvCbBWsd7mHZc",
});

async function uploadOnCloudinary(localFilePath) {
    try {
        // If file doesn't exist locally, return null
        if (!localFilePath) {
            console.log("Local file path not provided");
            return null;
        }
        // If file exists, upload it on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log(`File uploaded successfully | URL: ${response.url}`);
        return response;
    } catch (error) {
        console.log(error)
        // uncomment this after testing is done
        // fs.unlinkSync(localFilePath); // unlink/delete the locally-stored file as the cloudinary-upload failed
        return null;
    }
}

export default uploadOnCloudinary;
