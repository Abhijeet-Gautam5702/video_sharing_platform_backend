// Utility to check whether a given ObjectId is a valid Mongoose ObjectId or not

import mongoose, { isObjectIdOrHexString } from "mongoose";

function validateObjectId(id) {
    return isObjectIdOrHexString(id);
}

export default validateObjectId;
