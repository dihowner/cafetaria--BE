import jwt from "jsonwebtoken";
import httpStatusCode from "http-status-codes"
import { config } from "../utility/config.js"
import User from "../models/user.js"
import Vendors from "../models/vendor.js"
import { UnAuthorizedError } from "../helpers/errorHandler.js";
import Admins from "../models/admin.js";

export default class AuthMiddleWare {

	static async assignUser(req, decodedToken) {
		const userType = !(decodedToken.role) ? 'admin' : decodedToken.role;

		switch(userType) {
			case 'admin':
				const admin = await Admins.findById(decodedToken._id)
				if (!admin) {
					return {
						status: "error",
						code: httpStatusCode.BAD_REQUEST,
						message: "Invalid authorization token",
					}
				}
				req.admin = decodedToken
			break;

			case 'user':
			case 'vendor':
				const user = await User.findById(decodedToken._id)
				if (!user) {
					return {
						status: "error",
						code: httpStatusCode.BAD_REQUEST,
						message: "Invalid authorization token",
					}
				}
				
				req.user = decodedToken
				if(user.roles === 'vendor') {
					const vendor = await Vendors.findOne({user: user._id});
					req.user.vendor = vendor._id;
				}
			break;
		}
	}

	static async requireLoggedInUser (req, res, next) {
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
			await AuthMiddleWare.assignUser(req, decodedToken);
			next()
		}
		catch(error) {
			if (error.name === "TokenExpiredError") {
				return res.status(httpStatusCode.UNAUTHORIZED).json({
					status: "error",
					code: httpStatusCode.UNAUTHORIZED,
					message: "Authorization token expired",
				});
			} else if (error.name === "JsonWebTokenError") {
				return res.status(httpStatusCode.UNAUTHORIZED).json({
					status: "error",
					code: httpStatusCode.UNAUTHORIZED,
					message: "Invalid authorization token",
				});
			} else if (error.name === "MongoError" && error.code === 11000) {
				// MongoDB duplicate key error (example: unique index violation)
				return res.status(httpStatusCode.CONFLICT).json({
					status: "error",
					code: httpStatusCode.CONFLICT,
					message: "Duplicate key error. This resource already exists.",
				});
			} else if (error instanceof UnAuthorizedError) {
				return res.status(httpStatusCode.UNAUTHORIZED).json({
					status: "error",
					code: httpStatusCode.UNAUTHORIZED,
					message: "You are not authorized to access this resource",
				});
			} else {
				return res.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({
					status: "error",
					code: httpStatusCode.INTERNAL_SERVER_ERROR,
					message: "Internal server error",
				});
			}
		}
	}

	static authenticateUserType(userType) {
		return async (req, res, next) => {
			try {
				await this.requireLoggedInUser(req, res, (error) => {
					if (error) throw error;
					const role = !(req.user) ? 'admin' : req.user.role;
					if(role.toLowerCase() != userType.toLowerCase()) throw new UnAuthorizedError('')
					next();
				})
			}
			catch(error) {
				console.log(error);
			}
		}
	}
}