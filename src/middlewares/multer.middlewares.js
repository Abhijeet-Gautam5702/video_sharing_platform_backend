/*
    MULTER FILE-HANDLING MIDDLEWARE

    - We will store the files in the DISK-STORAGE locally and temporarily using Multer. 
    - This middleware will be used whenever there is a file-handling situation in the controllers business logic
    
    NOTE: This is a middleware, hence it must be used before a controller. Hence it should be given as a middleware argument when writing the routes of the backend.
*/

import multer from "multer";

/*
    STORAGE CONFIGURATION FOR MULTER

    - `storage` variable is the storage configuration object for Multer. It specifies where the files (given by the client) should be stored locally.
    - We have chosen to store the files in the DiskStorage (to tackle heavy-size file uploads). However, Multer provides other storage configurations as well (like MemoryStorage). 

    req : contains JSON data only
    file : contains the files 
*/
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, "./public/temp");
    },
    filename: function (req, file, callback) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        callback(null, file.fieldname + "-" + uniqueSuffix);
    },
});

const multerUpload = multer({ storage: storage }); // this function acts as the middleware method

export { multerUpload };
