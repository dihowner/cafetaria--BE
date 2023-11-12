import User from "../models/user.js";
import httpStatusCode from "http-status-codes";

export const userStatistics = async (request, response) => {
    const user = request.user;
    const getUser = await User.findById(user._id)
    const data = {
        "wallet_balance": 1029102 * Math.random(),
        "total_cart": Math.round(102 * Math.random()),
        "total_order_progress": Math.round(109 * Math.random()),
        "total_order_received": Math.round(105 * Math.random())
    }
    return response.status(httpStatusCode.OK).json(data)
}