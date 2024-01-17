import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import SubMealService from '../services/SubMealService.js';
import { NotFoundError } from '../helpers/errorHandler.js';

export default class SubMealController {
    static async createMeal(request, response) {
        try {
            const mealData = request.body;
            const mealId = request.params.mealId;
            const createMeal = await SubMealService.createMeal(mealId, mealData)
            return response.status(httpStatusCode.OK).json(createMeal);
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
            const mealData = request.body;
            const subMealId = request.params.subMealId;
            const updateMeal = await SubMealService.updateMeal(subMealId, mealData)
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

    static async getSubMeal(request, response) {
        try {
            const getSubMeal = await SubMealService.getSubMeal(request.params.subMealId)
            return response.status(httpStatusCode.OK).json(getSubMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async deleteSubMeal(request, response) {
        try {
            const deleteSubMeal = await SubMealService.deleteSubMeal(request.params.subMealId)
            return response.status(httpStatusCode.OK).json(deleteSubMeal);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getSubMealByMealId(request, response) {
        try {
            const mealId = request.params.mealId;
            const category = request.query.category;
            const getSubMeals = await SubMealService.getSubMealByMealId(mealId, category)
            return response.status(httpStatusCode.OK).json(getSubMeals);
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
            unit_price: Joi.string().trim().required().pattern(/^[0-9]+$/).messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            is_available: Joi.boolean().required().messages({
                'boolean.base':'Availability must be a boolean value',
                'boolean.empty':'Please indicate availability for purchasing sake',
                'any.required':'Please indicate availability for purchasing sake'
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
            unit_price: Joi.string().pattern(/^[0-9]+$/).trim().messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            category: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            is_available: Joi.boolean().messages({
                'boolean.base':'Availability must be a boolean value',
                'boolean.empty':'Please indicate availability for purchasing sake',
                'any.required':'Please indicate availability for purchasing sake'
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateDeleteMeal(request) {
        const validateMealSchema = Joi.object({
            subMealId: Joi.string().required().trim().messages({
                'string.base':'Sub Meal Id must be a string',
                'any.required':'Sub Meal Id is required'
            })
        })
        return validateMealSchema.validate(request.params, {abortEarly: false});
    }
}