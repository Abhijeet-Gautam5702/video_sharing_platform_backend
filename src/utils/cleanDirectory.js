// Utility function to clean the local assets stored temporarily in the `/public/temp` folder
import fs from "node:fs";
import path from "node:path";

function cleanDirectory(directoryPath) {
    fs.readdir(directoryPath, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            // Do not delete .gitkeep file
            if (file !== ".gitkeep") {
                fs.unlink(path.join(directoryPath, file), (err) => {
                    if (err) throw err;
                });
            }
        }
    });
}

export default cleanDirectory;
