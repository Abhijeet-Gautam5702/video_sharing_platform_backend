# Video Sharing Platform Backend

This project contains backend API-endpoints for a complex and fully-functional video sharing platform, built using Node/Express for writing backend code and MongoDB/Mongoose for database utilities. This project also leverages the power of third-party services such as Cloudinary for image and file uploads.

The code for this project is written keeping in mind the best-practices related to JavaScript and backend development in general.

Moreover, complex and production-grade concepts such as MongoDB Aggregation Pipelines have been incorporated at all places in the code wherever required.

This backend code can facilitate beginner to intermediate developers to create an independent, fully-functional and production-grade web application similar to the like of Youtube and other video sharing platforms.

## Salient Features

This backend provides almost all the features that a complex and fully functioning video sharing platform consists. Below mentioned are a few of the many features of this project.

- Secure and error-proof code using modern JS code principles like async-await and try-catch
- Modular and structured code obeying the industry best-practices
- Heavily commented code explaining each line of code
- MongoDB Aggregation Pipelines for complex database queries
- Secured Authentication (using JWTs)
- Authentication via browser cookies
- Mongoose custom methods and middlewares
- Password Hashing (using Bcrypt)
- Seamless Image and File uploads (using Cloudinary and Multer)

## Installation and Testing

- Ensure that you have Node installed in your machine locally (if not, [install from here](https://nodejs.org/en)) by running the following command  

```bash
node
```

- Clone the repository by running the following command

```bash
git clone https://github.com/Abhijeet-Gautam5702/video_sharing_platform_backend.git
```

- Install the dependencies

```bash
npm install
```

- Create your own MongoDB instance from the [official website](https://www.mongodb.com/).

- Taking the `.env.example` file as reference, create a new `.env` file in the root directory and populate it with required sensitive information like API-Keys, JWT-secrets etc.

- Use [Postman](https://web.postman.co/) (recommended) or any other API-testing tool to test the endpoints.

## API-Routes and Testing

The POSTMAN API-Collection is provided in the root-directory for testing all the below mentioned API-endpoints.

**SERVER** : `http://localhost:<PORT>/api/v1`

### User Routes

This project contains one of the most comprehensive code and API-endpoints for user related backend endpoints.

<span style="color:green;">**GET**</span> : `<SERVER>/users/get-current-user`

<span style="color:green;">**GET**</span> : `<SERVER>/users/user-watch-history`

<span style="color:yellow;">**POST**</span> : `<SERVER>/users/register`

**BODY (form-data)**

```bash
username:
fullname:
email:
password:
avatar:
cover:
```

<span style="color:yellow;">**POST**</span> : `<SERVER>/users/login`

**BODY (form-data)**

```bash
username:
email:
password:
```

<span style="color:yellow;">**POST**</span> : `<SERVER>/users/logout`

<span style="color:cyan;">**PUT**</span> : `<SERVER>/users/refresh-access-token`

<span style="color:cyan;">**PUT**</span> : `<SERVER>/users/change-password`

**BODY (raw JSON)**

```javascript
{
  oldPassword: ,
  newPassword: ,
  confirmPassword: 
}
```

<span style="color:cyan;">**PUT**</span> : `<SERVER>/users/update-account-details`

**BODY (raw JSON)**

```javascript
{
  fullname: ,
  email:
}
```

<span style="color:cyan;">**PUT**</span> : `<SERVER>/users/update-account-images`

**BODY (form-data)**

```bash
avatar:
cover:
```

---

### Video Routes

<span style="color:green;">**GET**</span> : `<SERVER>/videos/get-videos`

<span style="color:green;">**GET**</span> : `<SERVER>/videos/get-video-by-id/:videoId`

<span style="color:yellow;">**POST**</span> : `<SERVER>/videos/publish-video`

**BODY (form-data)**

```bash
title:
description:
thumbnail:
videoFile:
```

<span style="color:red;">**DELETE**</span> : `<SERVER>/videos/delete-video/:videoId`

<span style="color:cyan;">**PATCH**</span> : `<SERVER>/videos/update-video-details/:videoId`

**BODY (form-data)**

```bash
title:
description:
```

<span style="color:cyan;">**PATCH**</span> : `<SERVER>/videos/toggle-video-publish-status/:videoId`

<span style="color:cyan;">**PATCH**</span> : `<SERVER>/videos/update-video-thumbnail/:videoId`

**BODY (form-data)**

```bash
thumbnail:
```

---

### Comment Routes

<span style="color:green;">**GET**</span> : `<SERVER>/comments/comments/:videoId`

<span style="color:yellow;">**POST**</span> : `<SERVER>/comments/add-comment/:videoId`

**BODY (raw JSON)**

```javascript
{
  content: "comment content here"
}
```

<span style="color:red;">**DELETE**</span> : `<SERVER>/comments/delete-comment/:commentId`

<span style="color:cyan;">**PUT**</span> : `<SERVER>/comments/edit-comment/:commentId`

**BODY (raw JSON)**

```javascript
{
  content: "updated comment content here"
}
```

---

### Like

<span style="color:green;">**GET**</span> : `<SERVER>/likes/get-liked-videos`

<span style="color:yellow;">**POST**</span> : `<SERVER>/likes/toggle-video-like/:videoId`

<span style="color:yellow;">**POST**</span> : `<SERVER>/likes/toggle-comment-like/:videoId`

---

### Channel Routes

<span style="color:green;">**GET**</span> : `<SERVER>/channels/get-channel-details/:channelUsername`

---

### Dashboard Routes

<span style="color:green;">**GET**</span> : `<SERVER>/dashboard/get-channel-videos`

<span style="color:green;">**GET**</span> : `<SERVER>/dashboard/get-channel-stats`

---

### Playlist Routes

<span style="color:green;">**GET**</span> : `<SERVER>/playlists/get-playlists`

<span style="color:green;">**GET**</span> : `<SERVER>/playlists/get-videos-in-playlist/:playlistId`

<span style="color:green;">**GET**</span> : `<SERVER>/playlists/get-playlist-by-id/:playlistId`

<span style="color:yellow;">**POST**</span> : `<SERVER>/playlists/create-playlist`

**BODY (form-data)**

```bash
title:
description:
```

<span style="color:yellow;">**POST**</span> : `<SERVER>/playlists/add-video-to-playlist/:playlistId`

**BODY (form-data)**

```bash
videoId:
```

<span style="color:red;">**DELETE**</span> : `<SERVER>/playlists/delete-playlist/:playlistId`

<span style="color:cyan;">**PUT**</span> : `<SERVER>/playlists/remove-video-from-playlist/:playlistId`

**BODY (form-data)**

```bash
videoId:
```

<span style="color:cyan;">**PUT**</span> : `<SERVER>/playlists/update-playlist/:playlistId`

**BODY (form-data)**

```bash
title:
description:
```

## Dependencies and Packages

- [NodeJS](https://nodejs.org/en)
- [ExpressJS](https://expressjs.com/)
- [JWT (JSON Web Tokens)](https://www.npmjs.com/package/jsonwebtoken)
- [MongoDB](https://www.mongodb.com/)
- [Mongoose](https://mongoosejs.com/)
- [Multer](https://www.npmjs.com/package/multer)
- [Bcrypt](https://www.npmjs.com/package/bcrypt)
- [Cloudinary](https://cloudinary.com/)
- [Dotenv](https://www.npmjs.com/package/dotenv)
- [Cors](https://www.npmjs.com/package/cors)
- [Cookie Parser](https://www.npmjs.com/package/cookie-parser)
