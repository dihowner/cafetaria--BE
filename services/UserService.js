import WalletService from "./WalletService.js";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'
import { config } from "../utility/config.js"
import User from "../models/user.js";
import { BadRequestError, UnAuthorizedError } from "../helpers/errorHandler.js";
import reformNumber from "../utility/number.js"
import Vendors from "../models/vendor.js";
import VendorService from "./VendorService.js";

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
        const user = await this.getOne({_id: userId})
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
    
    static async updateProfile(userId, userProperties) {
        try {
            const user = await this.getOne({_id: userId, roles: {$in:['user', 'vendor']}})
            if (!user) throw new UnAuthorizedError();
            
            const {
                name, mobile_number, store_name, isPhysicalStore, store_address, storeImage
            } = userProperties;

            const reformattedMobileNumber = mobile_number !== undefined ? reformNumber(mobile_number) : user.mobile_number;
            // const reformattedMobileNumber = (mobile_number);
            // does email belongs to another user
            const isMobileExist = await this.getOne({_id: {$ne: userId}, mobile_number: reformattedMobileNumber})
            if (isMobileExist) throw new BadRequestError(`Mobile number (${reformattedMobileNumber}) already belongs to another user`)
            
            const updateUserData = {
                name: name ?? user.name, 
                mobile_number: reformattedMobileNumber ?? user.mobile_number
            }
            let updateVendor;
            if (user.roles == 'vendor') {
                // store name belongs to another store ?
                const isStoreNameExist = await VendorService.getOne({user: {$ne: userId}, store_name: store_name});
                if (isStoreNameExist) throw new BadRequestError(`Store name (${store_name}) already in use by another vendor`)
                // find vendor based on user id
                const vendor = await VendorService.getOne({user: userId});
                // Assign store name here for vendor...
                const vendorData = {
                    store_name: store_name ?? vendor.store_name,
                    isPhysicalStore: isPhysicalStore ?? vendor.isPhysicalStore,
                    store_address: (isPhysicalStore) ? store_address : vendor.store_address
                }
                
                if (storeImage) {
                    let imagePath = storeImage.path;
                    vendorData.store_image = imagePath
                } else {
                    vendorData.store_image = vendor.store_image            
                }
                updateVendor = await Vendors.findByIdAndUpdate(vendor._id, { $set: vendorData }, {new: true, select: 'store_name store_address isPhysicalStore'})
            }
            
            const updateUserProfile = await this.updateUser(userId, updateUserData)

            if (!updateUserProfile) throw new BadRequestError('Error updating profile')
            const response = {
                _id: updateUserProfile._id,
                name: updateUserProfile.name,
                email: updateUserProfile.email,
                vendor: user.roles == 'vendor' ? updateVendor : {} 
            };
        
            return response;
        } catch (error) {
            throw error;
        }
    }

    static async modifyTxPin(userId, userData) {
        try {
            const  { current_pin, new_pin } = userData;

            const user = await this.getOne({_id: userId, roles: 'vendor'})
            if (!user) throw new UnAuthorizedError()
            let userCurrentPin = user.transact_pin
            if (userCurrentPin == null) {
                userCurrentPin = '000000';
            }

            if (userCurrentPin != current_pin) throw new BadRequestError(`Incorrect current transaction pin (${current_pin}) supplied`)
        
            const updatePin = await this.updateUser(userId, {transact_pin: new_pin});
            if (!updatePin) throw new BadRequestError('Error updating transaction pin')
            return {
                message: 'Transaction pin changed successfully',
                data: updatePin
            }
        } catch (error) {
            throw error;
        }
    }

    static async getOne(filterQuery) {
        const user = await this.model.findOne(filterQuery)
        return user || false;
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