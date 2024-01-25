import jwt from "jsonwebtoken";
import WalletService from "./WalletService.js";
import bcrypt from 'bcrypt'
import { config } from "../utility/config.js"
import User from "../models/user.js";
import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import reformNumber from "../utility/number.js"
import Vendors from "../models/vendor.js";
import VendorService from "./VendorService.js";
import BankService from "./BankService.js";
import WithdrawalService from "./WithdrawalService.js";
import {uploadToCloudinary} from '../utility/util.js'

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
        const fileContent = await readFile("mailer/templates/success-resetpass.html")
        
        const user = await this.getOne({_id: userId})
        if (!user) throw new UnAuthorizedError()
        const isValidCurrentPassword = await this.comparePassword(currentPassword, user.password)
        if (!isValidCurrentPassword) throw new BadRequestError('Invalid current password supplied')
        const updatePassword = await this.updateUser(userId, { password: await this.hashPassword(newPassword) });
        if (!updatePassword) throw new BadRequestError("Password could not be updated. Please try again later")

        // Send email...
        const mailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: user.email,
            subject: `Password changed successfully`
        }
        const mailData = {
            customer_name: user.name
        };
        await sendEmail(mailData, fileContent, mailParams)
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
                    let filePath = storeImage.path;
                    const uploadLocalCloud = await uploadToCloudinary(filePath, 'uploads/stores/');
                    vendorData.store_image = uploadLocalCloud
                } else {
                    vendorData.store_image = vendor.store_image            
                }
                updateVendor = await Vendors.findByIdAndUpdate(vendor._id, { $set: vendorData }, {new: true, select: 'store_name store_address isPhysicalStore'})
            }

            const updateUserProfile = await this.updateUser(userId, updateUserData)

            if (!updateUserProfile) throw new BadRequestError('Error updating profile')
            
            return {
                _id: updateUserProfile._id,
                name: updateUserProfile.name,
                email: updateUserProfile.email,
                vendor: user.roles == 'vendor' ? updateVendor : {} 
            }
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

    static async getUser(userId) {
        try {
            let user = await this.getOne({_id: userId})
            if (!user) throw new NotFoundError(`User Id (${userId}) not found`)

            user = user.toObject(); 
            if (user.roles.toLowerCase() == 'vendor') {
                const vendorInfo = await Vendors.findOne({user: userId})
                const vendorData = vendorInfo.toObject();
                delete vendorData.user;   
                user.vendor = vendorData
            } 
            delete user.password;
            delete user.transact_pin;
            return user;
        } catch (error) {
            throw error;
        }
    }

    static async setUpBankAccount(userId, userData) {
        try {
            const fileContent = await readFile("mailer/templates/bankupdate.html")

            const {
                account_number, transact_pin, bank_code, account_name
            } = userData

            const user = await this.getOne({_id: userId, 'roles': 'vendor'})
            if (!user) throw new UnAuthorizedError()

            const isPendingWithdrawal = await WithdrawalService.getOne({user: userId, status: 'pending'})
            if (isPendingWithdrawal) throw new BadRequestError('You currently have an ongoing withdrawal request')

            const isAccountNumberExist = await this.getOne({_id: {$ne: userId}, 'bank.accountNumber': account_number});
            if (isAccountNumberExist) throw new BadRequestError(`Account number (${account_number}) supplied already belong to another user`)
            
            if (user.transact_pin != transact_pin) throw new BadRequestError(`Incorrect transaction pin (${transact_pin}) supplied`)

            const getBank = await BankService.getOne({'bank_code': bank_code});
            if (!getBank) throw new NotFoundError(`Invalid bank code (${bank_code}) supplied`)
    
            // Prepare the user update data...
            const updateData = {
                accountName: account_name,
                accountNumber: account_number,
                bankName: getBank.bank_name,
                bankId: bank_code,
            }
            
            const updateBank = await this.updateUser(userId, {bank: updateData}, 'name email bank');
            if (!updateBank) throw new BadRequestError('Error setting up banking information')
            
            // Send email...
            const mailParams = {
                replyTo: config.system_mail.no_reply,
                receiver: user.email,
                subject: `Profile Update - Bank Account Setup`
            }

            const mailData = {
                customer_name: name
            };
            await sendEmail(mailData, fileContent, mailParams)
            
            return {
                message: 'Bank updated successfully',
                data: updateBank
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