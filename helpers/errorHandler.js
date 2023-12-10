import httpStatusCode from "http-status-codes";

export class BadRequestError {
    constructor(message) {
        this.message = message;
        this.status = httpStatusCode.BAD_REQUEST;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class InternalError {
    constructor(message = '') {
        this.message = message && message.trim() !== '' ? message : "Oops! Something went wrong on our end. Please try again later or contact support.";
        this.status = httpStatusCode.INTERNAL_SERVER_ERROR;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class NotFoundError {
    constructor(message = '') {
        this.message = message && message.trim() !== '' ? message : "Whoopps! You've missed road. Resource could not be found";
        this.status = httpStatusCode.NOT_FOUND;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class UnAuthorizedError {
    constructor(message = '') {
        this.message = message && message.trim() !== '' ? message : "Unauthorized user.";
        this.status = httpStatusCode.UNAUTHORIZED;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}