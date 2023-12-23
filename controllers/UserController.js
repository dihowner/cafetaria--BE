import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import UserService from '../services/UserService.js';
import { UnAuthorizedError } from '../helpers/errorHandler.js';

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
                // Handle other errors or rethrow them
                // throw new BadRequestError('Something went wrong');
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
                // Handle other errors or rethrow them
                // throw new BadRequestError('Something went wrong');
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
                // Handle other errors or rethrow them
                // throw new BadRequestError('Something went wrong');
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
        current_password: Joi.string().required().min(5).custom(UserController.checkOldNewPass, 'different').pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'Current password must be a string',
            'string.empty':'Current password cannot be empty',
            'any.required':'Current password is required',
            'any.forbidden': 'Current password must not be the same with new password'
        }),
        new_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'New password must be a string',
            'string.empty':'New password cannot be empty',
            'any.required':'New password is required'
        }),
        confirm_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).valid(Joi.ref('new_password')).messages({
            'string.base':'Confirm password must be a string',
            'string.empty':'Confirm password cannot be empty',
            'any.required':'Confirm password is required',
            'any.only':'Passwords do not match'
        })
    });
    
    static updatePasswordResetSchema = Joi.object({
        token: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
            'string.base':'Verification token must be a string',
            'any.required':'Verification token is required',
            'string.length':'Verification token must be 6 digits',
            'string.pattern.base':'Only numeric digit is allowed'
        }),
        new_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'New password must be a string',
            'string.empty':'New password cannot be empty',
            'any.required':'New password is required'
        }),
        confirm_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).valid(Joi.ref('new_password')).messages({
            'string.base':'Confirm password must be a string',
            'string.empty':'Confirm password cannot be empty',
            'any.required':'Confirm password is required',
            'any.only':'Passwords do not match'
        })
    });

    static updateProfileSchema = Joi.object({
        name: Joi.string(),
        mobile_number: Joi.string().min(11).max(13),
        store_name: Joi.string(),
        store_address: Joi.string().when('isPhysicalStore', {
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