import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import UserService from '../services/UserService.js';
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';

const userRoles = ['user', 'vendor', 'admin'];

export default class UserController {
    
    static async modifyPassword(request, response) {
        try {
            const {
                body: { current_password, new_password }
            } = request
            const user = request.user;
            const updatePassword = await UserService.modifyPassword(user._id, current_password, new_password)
            return response.json(updatePassword)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    } 

    static async userStatistics(request , response) {
        try {
            const userStatistics = await UserService.userStatistics(request.params.userId)
            return response.json(userStatistics)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async updateProfile(request , response) {
        try {
            const userData = request.body;
            userData.storeImage = request.file;
            const user = request.user;
            const updateProfile = await UserService.updateProfile(user._id, userData)
            return response.status(httpStatusCode.OK).json(updateProfile)
        } catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async modifyTxPin(request , response) {
        try {
            const userData = request.body;
            
            const user = request.user;
            const updateTxPin = await UserService.modifyTxPin(user._id, userData)
            return response.status(httpStatusCode.OK).json(updateTxPin)
            
        } catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getUser(request , response) {
        try {
            const userId = request.user._id
            const getUser = await UserService.getUser(userId)
            return response.status(httpStatusCode.OK).json(getUser)
        } catch(error) {
            // Handle the specific error types
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async setUpBankAccount(request , response) {
        try {
            const userData = request.body;
            const user = request.user;
            const updateTxPin = await UserService.setUpBankAccount(user._id, userData)
            return response.status(httpStatusCode.OK).json(updateTxPin)
            
        } catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    /** Schema Validations **/    

    static checkOldNewPass = (value, helpers) => {
        // const getAllPayload = JSON.stringify(helpers.state.ancestors);
        const getAllPayload = helpers.state.ancestors[0];
        if(value === getAllPayload.new_password) return helpers.error('password.different');
        return value
    }

    static updatePasswordSchema = Joi.object({
        current_password: Joi.string().required().min(5).trim().custom(UserController.checkOldNewPass, 'different').pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'Current password must be a string',
            'string.empty':'Current password cannot be empty',
            'any.required':'Current password is required',
            'any.forbidden': 'Current password must not be the same with new password'
        }),
        new_password: Joi.string().required().min(5).trim().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'New password must be a string',
            'string.empty':'New password cannot be empty',
            'any.required':'New password is required'
        }),
        confirm_password: Joi.string().required().min(5).trim().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).valid(Joi.ref('new_password')).messages({
            'string.base':'Confirm password must be a string',
            'string.empty':'Confirm password cannot be empty',
            'any.required':'Confirm password is required',
            'any.only':'Passwords do not match'
        })
    });
    
    static updatePasswordResetSchema = Joi.object({
        token: Joi.string().length(6).pattern(/^[0-9]+$/).trim().required().messages({
            'string.base':'Verification token must be a string',
            'any.required':'Verification token is required',
            'string.length':'Verification token must be 6 digits',
            'string.pattern.base':'Only numeric digit is allowed'
        }),
        new_password: Joi.string().required().min(5).trim().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'New password must be a string',
            'string.empty':'New password cannot be empty',
            'any.required':'New password is required'
        }),
        confirm_password: Joi.string().required().min(5).trim().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).valid(Joi.ref('new_password')).messages({
            'string.base':'Confirm password must be a string',
            'string.empty':'Confirm password cannot be empty',
            'any.required':'Confirm password is required',
            'any.only':'Passwords do not match'
        })
    });

    static updateProfileSchema = Joi.object({
        name: Joi.string().trim(),
        mobile_number: Joi.string().min(11).max(13).trim(),
        store_name: Joi.string().trim(),
        store_address: Joi.string().trim().when('isPhysicalStore', {
            is: true,
            then: Joi.string().required().messages({
              'any.required': 'Store address is required when physical store is true.',
            }),
            otherwise: Joi.string(), // No validation if isPhysicalStore is false
        }),
        isPhysicalStore: Joi.boolean().messages({
            'boolean.base':'Physical store must be a boolean value',
            'boolean.empty':'Please indicate if you have a physical store or not',
            'any.required':'Please indicate if you have a physical store or not'
        }),
        storeImage: Joi.string()
    })

    static updateTxPinSchema = Joi.object({
        current_pin: Joi.string().required().pattern(/^[0-9]+$/).min(6).max(6).messages({
            'string.base':'Current pin must be a number',
            'any.required':'Current pin is required',
            'string.min':'Current pin must be 6 digits',
            'string.max':'Current pin cannot exceeds 6 digits',
            'string.pattern.base':'Only numeric value is allowed'
        }),
        new_pin: Joi.string().required().min(6).max(6).invalid('000000').pattern(/^[0-9]+$/).messages({
            'string.base':'New pin must be a number',
            'any.required':'New pin is required',
            'string.min':'New pin must be 6 digits',
            'string.max':'New pin cannot exceeds 6 digits',
            'any.invalid': 'New pin cannot be "000000"',
            'string.pattern.base':'Only numeric value is allowed'
        }),
        confirm_pin: Joi.string().required().min(6).max(6).valid(Joi.ref('new_pin')).pattern(/^[0-9]+$/).messages({
            'string.base':'Confirm pin must be a number',
            'any.required':'Confirm pin is required',
            'string.min':'Confirm pin must be 6 digits',
            'string.max':'Confirm pin cannot exceeds 6 digits',
            'any.only':'Passwords do not match',
            'string.pattern.base':'Only numeric value is allowed'
        }),
    })

    static updateBankSchema = Joi.object({
        bank_code: Joi.string().required().trim().pattern(/^[0-9]+$/).messages({
            'string.base':'Bank code must be a number',
            'any.required':'Bank is required',
            'string.pattern.base':'Bank code must contain numeric values only'
        }),
        account_number: Joi.string().required().trim().pattern(/^[0-9]+$/).min(10).max(10).messages({
            'string.base':'Account number must be a number',
            'any.required':'Account number is required',
            'string.min':'Account number must be 10 digits',
            'string.max':'Account number cannot exceeds 10 digits',
            'string.pattern.base':'Only numeric value is allowed'
        }),
        account_name: Joi.string().required().trim().messages({
            'any.required':'Account name is required',
            'string.base':'Account name must be a string',
            'string.empty':'Account name cannot be empty'
        }),
        transact_pin: Joi.string().required().trim().min(6).max(6).pattern(/^[0-9]+$/).invalid('000000').messages({
            'string.base':'Transaction pin must be a number',
            'any.required':'Transaction pin is required',
            'string.min':'Transaction pin must be 6 digits',
            'string.max':'Transaction pin cannot exceeds 6 digits',
            'string.pattern.base':'Only numeric value is allowed',
            'any.invalid': 'Transaction pin cannot be "000000". Kindly set your transaction pin if you are yet to do so',
        })
    })

    static validateUpdateUser(request) {
        let payload = request.body;
        let updateSchema;
        let activity = payload.activity;

        switch(activity) {
            case 'update_password':
                updateSchema = UserController.updatePasswordSchema;
            break;
            case 'update_profile':
                updateSchema = UserController.updateProfileSchema;
            break;
            case 'update_tx_pin':
                updateSchema = UserController.updateTxPinSchema;
            break;
            case 'update_bank':
                updateSchema = UserController.updateBankSchema;
            break;
            case 'password_reset':
                updateSchema = UserController.updatePasswordResetSchema;
            break;
        }
        delete payload.activity
        return updateSchema.validate(payload, {abortEarly: false, messages: {
            'password.different': 'New password must be different from the current password',
        }});
    }
}