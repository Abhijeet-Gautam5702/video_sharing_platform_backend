// A wrapper function which executes async operations using try-catch & async-await syntax

/* 
NOTE: We will be interacting with async operations many times in the codebase. Instead of writing try-catch block and async-await functions again and again, we have created a wrapper function to avoid code redundancy.
*/

const asyncHandler = (callbackFn) => {
    return async (req, res, next) => {
        try {
            await callbackFn(req, res, next);
        } catch (err) {
            res.status(500).json({
                success: false,
                errorMessage: err.message,
            });
            throw err;
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
