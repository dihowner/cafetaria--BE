import WalletService from "./WalletService.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import { config } from "../utility/config.js"
import User from "../models/user.js";
import { BadRequestError, UnAuthorizedError } from "../helpers/errorHandler.js";

export default class UserService {
    static model = User;
    static async generateAuthToken(user) {
        return jwt.sign({
                _id: user._id,
                role: user.roles,
            },
            config.JWT_SECRET, { expiresIn: "24h" }
        );
    }

    static async userStatistics(userId) {
        const user = await this.getOne({_id: userId, roles: 'user'})
        if (!user) throw new UnAuthorizedError()
        return {
          wallet_balance: await WalletService.getAvailableBalance(userId),
          total_cart: Math.round(102 * Math.random()),
          total_order_progress: Math.round(109 * Math.random()),
          total_order_received: Math.round(105 * Math.random()),
        }
    };

    static async modifyPassword(userId, currentPassword, newPassword) {
        const user  = await this.getOne({_id: userId})
        if (!user) throw new UnAuthorizedError()
        const isValidCurrentPassword = await this.comparePassword(currentPassword, user.password)
        if (!isValidCurrentPassword) throw new BadRequestError('Invalid current password supplied')
        const updatePassword = await this.updateUser(userId, { password: await this.hashPassword(newPassword) });
        if (!updatePassword) throw new BadRequestError("Password could not be updated. Please try again later")
        return {
            message: "Password reset was successful",
            data: updatePassword
        }
    }
    
    static async getOne(filterQuery) {
        const user = await this.model.findOne(filterQuery)
        return user || null;
    }

    static async updateUser(userId, updateData, filterQuery = 'name email') {
        const updateUser = await this.model.findByIdAndUpdate(userId, { $set: updateData }, { new: true, select: filterQuery });
        if(!updateUser) return false;
        return updateUser;
    }
    
    static async comparePassword(password, savedHashed) {
        return await bcrypt.compare(password, savedHashed)
    }

    static async hashPassword(password) {
        const salt = await bcrypt.genSalt(10)
        return await bcrypt.hash(password, salt)
    }

}