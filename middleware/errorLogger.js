import winston from "winston"

export const errorLogger = (error, req, res) => {
    // Log the error using Winston or your preferred logging library
    winston.error(`Error occurred:  ${error}`, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
    });
};