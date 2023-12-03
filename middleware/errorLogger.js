import winston from "winston"
import httpStatusCode from "http-status-codes";

export const errorLogger = (error, req, res, next) => {
    // Log the error using Winston or your preferred logging library
    winston.error('Error occurred: ', error);

    // Additional logging, if needed (e.g., request details)
    winston.error('Request details:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
    });

    // Respond to the client with an error message
    return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
        message: "Oops! Something went wrong on our end. Please try again later or contact support.",
    });

};