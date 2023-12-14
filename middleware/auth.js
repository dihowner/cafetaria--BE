import jwt from "jsonwebtoken";
import httpStatusCode from "http-status-codes"
import { config } from "../utility/config.js"
import User from "../models/user.js"

const requireLoggedInUser = async (req, res, next) => {
    try {
		const authHeader = req.headers["authorization"]

        const token = authHeader && authHeader.replace(/^Bearer\s+/, "")
		if (!token) {
			return res.status(httpStatusCode.UNAUTHORIZED).json({
				status: "error",
				code: httpStatusCode.UNAUTHORIZED,
				message: "Access denied. No auth token provided",
			})
		}

		const decodedToken = jwt.verify(token, config.JWT_SECRET)

        const user = await User.findById(decodedToken._id)
		if (!user) {
			return res.status(httpStatusCode.BAD_REQUEST).json({
				status: "error",
				code: httpStatusCode.BAD_REQUEST,
				message: "Invalid authorization token",
			})
		}
        req.user = decodedToken
        next()
    }
    catch(error) {
        if (error.name === "TokenExpiredError") {
			return res.status(httpStatusCode.BAD_REQUEST).json({
				status: "error",
				code: httpStatusCode.BAD_REQUEST,
				message: "Authorization token expired",
			})
		}

		return res.status(httpStatusCode.UNAUTHORIZED).json({
			status: "error",
			code: 401,
			message: "Failed to authenticate token",
		})
    }
}

export { requireLoggedInUser }