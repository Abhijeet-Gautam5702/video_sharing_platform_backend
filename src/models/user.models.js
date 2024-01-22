// User Model

import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
            index: true, // Indexing (although expensive) makes searching very optimized
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            unique: true,
            trim: true,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        coverImage: {
            type: String, // Cloudinary URL
        },
        avatar: {
            type: String, // Cloudinary URL
            required: true,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        refreshToken: { type: String },
    },
    { timestamps: true }
);

/*
    PRE- Mongoose Middleware: This middleware runs "before" a certain mongoose event occurs (here, the save event)

    Here, we are checking if the password field is being saved/modified, then encrypt it first.

    NOTE-1: Arrow functions do not provide access to the context (basically the "this" keyword is invalid). Hence, use the regular function definition.

    NOTE-2: The function will be asynchronous because encryption is a time-consuming process.
*/
userSchema.pre("save", async function (next) {
    // Only if the password field is changed, encrypt the password else leave it
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
        next();
        return;
    }
    next(); // next() flag is invoked so that control passes over to the next middleware
});

/*
    Custom Mongoose Methods: Business Logic enclosed in a function/method related to a specific mongoose model
*/

// Mongoose Method: Password-Validation
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

//  Mongoose Method: Access-Token-Generator
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

// Mongoose Method: Refresh-Access-Token Generator
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

const User = mongoose.model("User", userSchema);

export default User;
