// Custom class to handle API-errors (extends the built-in Error class in NodeJS)
/*
    NOTE: `apiError` is a custom class extending the built-in `Error` class in NodeJS. So it has all the properties mentioned in the built-in `Error` class but can also have its own set os properties. For e.g., statusCode, errors & data are all custom properties of `apiError` class, whereas message is the property of the built-in NodeJS `Error` class (That is why we called super(message) to set the parent class message property)
*/
class apiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        // this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { apiError };
