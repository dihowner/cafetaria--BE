import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import MartService from '../services/MartService.js';
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';

export default class MartController {
    
    static async createMart(request, response) {
        try {
            const martData = request.body;
            martData.image = request.file;
            const userId = request.user._id;
            const addMart = await MartService.createMart(userId, martData)
            return response.status(httpStatusCode.OK).json(addMart);
        } catch (error) {
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async updateMart(request, response) {
        try {
            const martData = request.body;
            martData.image = request.file;
            const martId = request.params.martId;
            const updateMart = await MartService.updateMart(martId, martData)
            return response.status(httpStatusCode.OK).json(updateMart);
        } catch (error) {
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
    
    static async getMart(request, response) {
        try {
            const martId = request.params.martId;
            const getMart = await MartService.getMart(martId)
            return response.status(httpStatusCode.OK).json(getMart);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static validateMart(request) {

        const isUpdate = request.method.toUpperCase() === 'PUT'

        const validateMartSchema = Joi.object({
            name: isUpdate ? Joi.string().trim().messages({
                'string.base':'Mart name must be a string',
                'any.required':'Mart name is required'
            }) : Joi.string().required().trim().messages({
                'string.base':'Mart name must be a string',
                'any.required':'Mart name is required'
            }),
            address: Joi.string().required().trim().messages({
                'string.base':'Mart address must be a string',
                'any.required':'Mart address is required'
            }),
            description: Joi.string().trim().messages({
                'string.base':'Meal description must be a string',
                'any.required':'Meal description is required'
            })
        });
        return validateMartSchema.validate(request.body, {abortEarly: false});
    }

}