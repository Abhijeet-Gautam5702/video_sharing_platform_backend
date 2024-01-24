// A wrapper function which executes async operations using try-catch & async-await syntax

/* 
NOTE-1: We will be interacting with async operations many times in the codebase. Instead of writing try-catch block and async-await functions again and again, we have created a wrapper function to avoid code redundancy.

NOTE-2: Always throw errors in try-catch blocks
*/

const asyncHandler = (callbackFn) => {
    return async (req, res, next) => {
        try {
            await callbackFn(req, res, next);
        } catch (err) {
            res.status(err.statusCode).json({
                success: false,
                errorMessage: err.message,
            });
            // throw err; // IMPORTANT:  The backend will stop forever once any error is found in any API-route
        }
    };
};

export default asyncHandler;

/*
    PROMISIFIED VERSION OF THE SAME ASYNC-HANDLER

    const asyncHandler = (callback) => {
        return (req, res, next) => {
            return Promise.resolve(callback(req, res, next)).catch((err) =>
                console.log(err)
            );
        };
    };

*/
