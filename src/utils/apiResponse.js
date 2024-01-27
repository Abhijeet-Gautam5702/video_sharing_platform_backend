class apiResponse {
    constructor(statusCode, data, message) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}

export { apiResponse };
