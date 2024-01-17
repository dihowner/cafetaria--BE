import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import MealService from '../services/MealService.js';
import { NotFoundError } from '../helpers/errorHandler.js';

export default class MealController {
    static async createMeal(request, response) {
        try {
            const vendorId = request.user.vendor; // will use this to get the vendor id...
            const mealData = request.body;
            mealData.image = request.file;
            const createMeal = await MealService.createMeal(vendorId, mealData)
            return response.status(httpStatusCode.OK).json(createMeal);
        } catch (error) {
            return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
        }
    }

    static async deleteMeal(request, response) {
        try {
            const {
                params: { mealId }
            } = request;
            const vendorId = request.user.vendor;
            const deleteMeal = await MealService.deleteMeal(vendorId, mealId)
            return response.status(httpStatusCode.OK).json(deleteMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async getMeal(request, response) {
        try {
            const getMeal = await MealService.getMeal(request.params.mealId)
            return response.status(httpStatusCode.OK).json(getMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async updateMeal(request, response) {
        try {
            const mealId = request.params.mealId;
            const mealData = request.body;
            mealData.image = request.file;
            const updateMeal = await MealService.updateMeal(mealId, mealData)
            return response.status(httpStatusCode.OK).json(updateMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
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
            const mealId = request.params.mealId;

            const updateMeal = await MealService.updateAvailability(mealId, is_available)
            return response.status(httpStatusCode.OK).json(updateMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static validateAddMeal(request) {
        const validateMealSchema = Joi.object({
            name: Joi.string().min(3).trim().required().messages({
                'string.base':'Meal name must be a string',
                'any.required':'Meal name is required',
            }),
            description: Joi.string().min(3).trim().required().messages({
                'string.base':'Meal description must be a string',
                'any.required':'Meal description is required',
            }),
            is_available: Joi.boolean().required().messages({
                'boolean.base':'Meal availability must be a boolean value',
                'boolean.empty':'Please indicate meal availability for purchasing sake',
                'any.required':'Please indicate meal availability for purchasing sake'
            }),
            unit_price: Joi.string().required().trim().pattern(/^[0-9]+$/).messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            packaging: Joi.string().required().trim().messages({
                'string.base': 'Packaging must be an object',
                'any.required': 'Meal packaging is required',
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateUpdateMeal(request) {
        const validateMealSchema = Joi.object({
            name: Joi.string().min(3).trim().messages({
                'string.base':'Meal name must be a string',
                'any.required':'Meal name is required',
            }),
            description: Joi.string().min(3).trim().messages({
                'string.base':'Meal description must be a string',
                'any.required':'Meal description is required'
            }),
            is_available: Joi.boolean().messages({
                'boolean.base':'Meal availability must be a boolean value',
                'boolean.empty':'Please indicate meal availability for purchasing sake',
                'any.required':'Please indicate meal availability for purchasing sake'
            }),
            unit_price: Joi.string().pattern(/^[0-9]+$/).trim().messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            mealImage: Joi.string(),
            packaging: Joi.string().required().trim().messages({
                'string.base': 'Packaging must be an object',
                'any.required': 'Meal packaging is required',
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateAvailability(request) {
        const validateMealSchema = Joi.object({
            is_available: Joi.boolean().messages({
                'boolean.base':'Meal availability must be a boolean value',
                'boolean.empty':'Please indicate meal availability for purchasing sake',
                'any.required':'Please indicate meal availability for purchasing sake'
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateDeleteMeal(request) {
        const validateMealSchema = Joi.object({
            mealId: Joi.string().required().trim().messages({
                'string.base':'Meal Id must be a string',
                'any.required':'Meal Id is required'
            })
        })
        return validateMealSchema.validate(request.params, {abortEarly: false});
    }

}