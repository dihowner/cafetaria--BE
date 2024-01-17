import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';
import GroceryService from '../services/GroceryService.js';

export default class GroceryCategory {
    
    static async createGrocery(request, response) {
        try {
            const groceryData = request.body;
            groceryData.image = request.file;
            const userId = request.user._id;
            const createGrocery = await GroceryService.createGrocery(userId, groceryData)
            return response.status(httpStatusCode.OK).json(createGrocery);
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

    static async updateGrocery(request, response) {
        try {
            const groceryId = request.params.groceryId;
            const groceryData = request.body;
            groceryData.image = request.file;
            const updateGrocery = await GroceryService.updateGrocery(groceryId, groceryData);
            return response.json(updateGrocery)
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

    static async updateAvailability(request, response) {
        try {
            const {
                body: { is_available }
            } = request;
            const groceryId = request.params.groceryId;

            const updateGrocery = await GroceryService.updateAvailability(groceryId, is_available)
            return response.status(httpStatusCode.OK).json(updateGrocery);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getGrocery(request, response) {
        try {
            const groceryId = request.params.groceryId;

            const getGrocery = await GroceryService.getGrocery(groceryId)
            return response.status(httpStatusCode.OK).json(getGrocery);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getAllGrocery(request, response) {
        try {
            const getGrocery = await GroceryService.getAllGrocery()
            return response.status(httpStatusCode.OK).json(getGrocery);
        } catch (error) {
            console.log(error);
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async deleteGrocery(request, response) {
        try {
            const {
                params: { groceryId }
            } = request;
            const userId = request.user._id;
            const deleteGrocery = await GroceryService.deleteGrocery(userId, groceryId)
            return response.status(httpStatusCode.OK).json(deleteGrocery);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static validateGrocery(request) {
        const validateGrocerySchema = Joi.object({
            name: Joi.string().min(3).trim().required().messages({
                'string.base':'Grocery name must be a string',
                'any.required':'Grocery name is required'
            }),
            is_available: Joi.boolean().required().messages({
                'boolean.base':'Grocery availability must be a boolean value',
                'boolean.empty':'Please indicate grocery availability for purchasing sake',
                'any.required':'Please indicate grocery availability for purchasing sake'
            }),
            martcategory: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
                'string.base':'Mart category name must be a string',
                'any.required':'Mart category name is required',
            }),
            unit_price: Joi.string().required().trim().pattern(/^[0-9]+$/).messages({
                'string.base':'Grocery price must be a numeric value',
                'any.required':'Grocery price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
        });
        return validateGrocerySchema.validate(request.body, {abortEarly: false});
    }

    static validateAvailability(request) {
        const validateGrocerySchema = Joi.object({
            is_available: Joi.boolean().messages({
                'boolean.base':'Grocery availability must be a boolean value',
                'boolean.empty':'Please indicate grocery availability for purchasing sake',
                'any.required':'Please indicate grocery availability for purchasing sake'
            })
        })
        return validateGrocerySchema.validate(request.body, {abortEarly: false});
    }

    static validateDeleteGrocery(request) {
        const validateGrocerySchema = Joi.object({
            groceryId: Joi.string().required().trim().messages({
                'string.base':'Grocery Id must be a string',
                'any.required':'Grocery Id is required'
            })
        })
        return validateGrocerySchema.validate(request.params, {abortEarly: false});
    }

}