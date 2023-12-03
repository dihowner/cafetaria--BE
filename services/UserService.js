import User, {validateUpdateUser, hashPassword, comparePassword} from "../models/user.js";
import { getAvailableBalance } from "../services/WalletService.js";

import httpStatusCode from "http-status-codes";

export const userStatistics = async (request, response) => {
    const user = await User.findById(request.params.userId);
    if (!user) return response.status(httpStatusCode.BAD_REQUEST).json({message: 'User could not be found'})
    const data = {
      wallet_balance: await getAvailableBalance(user._id),
      total_cart: Math.round(102 * Math.random()),
      total_order_progress: Math.round(109 * Math.random()),
      total_order_received: Math.round(105 * Math.random()),
    };
    return response.status(httpStatusCode.OK).json(data);
};

export const modifyPassword = async (request, response) => {
    try {
        const userId = request.user._id;
        const getUser = await User.findById(userId);
        let payload = request.body;
        const validatePayload = validateUpdateUser('update_password', payload);
    
        if(validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message})
    
        const checkCurrentPass = await comparePassword(payload.current_password, getUser.password);
    
        if(!checkCurrentPass) return response.status(httpStatusCode.BAD_REQUEST).json({message: `Invalid current password (${payload.current_password}) supplied`})
    
        const updateUser = await User.findByIdAndUpdate(userId, {
          $set: { password: await hashPassword(payload.new_password) }
        }, {new: true});

        if(updateUser) return response.status(httpStatusCode.OK).json({message: "Password modified successfully", updateUser});

        return response.status(httpStatusCode.BAD_REQUEST).json({message: 'Request failed. Please retry'})

    }
    catch(error) {
        return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message})
    }
};