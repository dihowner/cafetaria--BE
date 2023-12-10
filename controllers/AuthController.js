import Joi from 'joi';
import AuthService from '../services/AuthService.js';
import httpStatusCode from 'http-status-codes'
import { errorLogger } from '../middleware/errorLogger.js';

const userRoles = ['user', 'vendor', 'admin'];

export default class AuthController {
    static async createUser(request, response) {
        try {
            const {
				body: {name, email, mobile_number, password, roles, store_name, isPhysicalStore, store_address },
			} = request;

            let vendorData = {
                store_name: store_name,
                isPhysicalStore: isPhysicalStore,
                store_address: (isPhysicalStore) ? store_address : undefined
            }

            await AuthService.createUser(name, email, mobile_number, password, roles, vendorData)
            return response.status(httpStatusCode.OK).json({message: "Your registration was successful. Kindly verify your email address to proceed", 
            data: {
                name: name,
                email: email,
                role: roles
            }})
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async verifyUserAccount(request, response) {
        try {
            const {
				body: {token },
			} = request;
            
            const updateUser = await AuthService.VerifyRegistration(token);
            return response.status(httpStatusCode.OK).json(updateUser)
        } catch (error) {
            errorLogger(error, request, response)
            return response.status(error.status).json({message: error.message});
        }
    }

    static async signIn(request, response) {
        try {
            const {
				body: { email, password, roles },
			} = request;

            const signIn = await AuthService.signIn(email, password, roles)
            return response.status(httpStatusCode.OK).json(signIn);

        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async passwordRequest(request, response) {
        try {
            const {
				body: { email },
			} = request;
            
            const initiateRequest = await AuthService.passwordRequest(email);
            return response.status(httpStatusCode.OK).json(initiateRequest)
        } catch (error) {
            errorLogger(error, request, response)
            return response.status(error.status).json({message: error.message});
        }
    }

    static async verifyResetPasswordToken(request, response) {
        try {
            const {
				body: { token },
			} = request;
            
            const verifyRequest = await AuthService.verifyResetPasswordToken(token);
            return response.status(httpStatusCode.OK).json(verifyRequest)
        } catch (error) {
            errorLogger(error, request, response)
            return response.status(error.status).json({message: error.message});
        }
    }

    static async changePassword(request, response) {
        try {
            // confirm_password is not needed because it has been validated already...
            const {
				body: { token, new_password },
			} = request;

            const processRequest = await AuthService.changePassword(token, new_password);
            return response.status(httpStatusCode.OK).json(processRequest)

        } catch (error) {
            errorLogger(error, request, response)
            return response.status(error.status).json({message: error.message});
        }
    }

    /** Schema Validations **/

    static regSchema = Joi.object({
        name: Joi.string().required().messages({
            'string.base':'Name must be a string',
            'string.empty':'Name cannot be empty',
            'any.required':'Name is required'
        }),
        email: Joi.string().required().messages({
            'string.base':'Email address must be a string',
            'string.empty':'Email address cannot be empty',
            'any.required':'Email address is required'
        }),
        password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'Password must be a string',
            'string.empty':'Password cannot be empty',
            'any.required':'Password is required'
        }),
        mobile_number: Joi.string().required().min(11).max(13).messages({
            'string.base':'Mobile number must be a number',
            'any.required':'Mobile number is required',
            'string.min':'Mobile number must be 11 digits',
            'string.max':'Mobile number cannot exceeds 13 digits'
        }),
        roles: Joi.string().messages({
            'string.base':'Please provide user role',
            'string.any':'Please provide user role'
        })
    });
    
    static vendorRegSchema = this.regSchema.keys({
        store_name: Joi.string().required().messages({
            'string.base':'Store name must be a string',
            'string.empty':'Store name cannot be empty',
            'any.required':'Store name is required'
        }),
        store_address: Joi.string().when('isPhysicalStore', {
            is: true,
            then: Joi.string().required().messages({
              'any.required': 'Store address is required when physical store is true.',
            }),
            otherwise: Joi.string(), // No validation if isPhysicalStore is false
        }),
        isPhysicalStore: Joi.boolean().required().messages({
            'boolean.base':'Physical store must be a boolean value',
            'boolean.empty':'Please indicate if you have a physical store or not',
            'any.required':'Please indicate if you have a physical store or not'
        })
    });
    
    static validateCreateUser(request) {
        let requestBody = request.body;
        let userRole = requestBody.roles;
        let userSchema;
    
        switch(userRole) {
            case 'user':
            case 'admin':
                userSchema = AuthController.regSchema;
            break;
    
            case 'vendor':
                userSchema = AuthController.vendorRegSchema;
            break;
        }
        return userSchema.validate(requestBody, {abortEarly: false});
    }

    static validateVerifyToken(request) {
        const verifySchema = Joi.object({
            token: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
                'string.base':'Verification token must be a string',
                'any.required':'Verification token is required',
                'string.length':'Verification token must be 6 digits',
                'string.pattern.base':'Only numeric digit is allowed'
            })
        })
        return verifySchema.validate(request.body, {abortEarly: false});
    }

    static validateLoginUser(request) {
        const userSchema = Joi.object({
            email: Joi.string().required().messages({
                'string.base':'Email address must be a string',
                'string.empty':'Email address cannot be empty',
                'any.required':'Email address is required'
            }),
            password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
                'string.base':'Password must be a string',
                'string.empty':'Password cannot be empty',
                'any.required':'Password is required'
            }),
            roles: Joi.string().valid(...userRoles).required()
        });
        return userSchema.validate(request.body, {abortEarly: false});
    }

    static validatePasswordRequest(request) {
        const PasswordResetSchema = Joi.object({
            email: Joi.string().required().messages({
                'string.base':'Email address must be a string',
                'string.empty':'Email address cannot be empty',
                'any.required':'Email address is required'
            })
        });
        return PasswordResetSchema.validate(request.body, {abortEarly: false});
    }
    
    static validateVerifyReset(request) {
        const VerifyResetSchema = Joi.object({
            token: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
                'string.base':'Verification token must be a string',
                'any.required':'Verification token is required',
                'string.length':'Verification token must be 6 digits',
                'string.pattern.base':'Only numeric digit is allowed'
            })
        });
        return VerifyResetSchema.validate(request.body, {abortEarly: false});
    }

}