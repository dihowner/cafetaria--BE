import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import MealService from '../services/MealService.js';

const mealCategories = ['Meal Pack', 'Others'];
const mealType = ['Meals', 'Groceries'];

export default class MealController {
    static async createMeal(request, response) {
        try {
            const vendorId = request.user.vendor; // will use this to get the vendor id...
            const mealData = request.body;
            mealData.image = request.file;
            const createMeal = await MealService.createMeal(vendorId, mealData)
            return response.status(httpStatusCode.OK).json(createMeal);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
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
            return response.status(error.status).json({message: error.message});
        }
    }
    
    static async getMeal(request, response) {
        try {
            const getMeal = await MealService.getMeal(request.params.mealId)
            return response.status(httpStatusCode.OK).json(getMeal);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
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
            return response.status(error.status).json({message: error.message});
        }
    }

    static validateAddMeal(request) {
        const validateMealSchema = Joi.object({
            name: Joi.string().min(3).required().messages({
                'string.base':'Meal name must be a string',
                'any.required':'Meal name is required',
                'string.length':'Meal name must be 6 digits'
            }),
            meal_type: Joi.string().valid(...mealType).required(),
            description: Joi.string().min(3).required().messages({
                'string.base':'Meal description must be a string',
                'any.required':'Meal description is required',
                'string.length':'Meal description must be 6 digits'
            }),
            meal_category: Joi.string().valid(...mealCategories).required(),
            is_available: Joi.boolean().required().messages({
                'boolean.base':'Meal availability must be a boolean value',
                'boolean.empty':'Please indicate meal availability for purchasing sake',
                'any.required':'Please indicate meal availability for purchasing sake'
            }),
            unit_price: Joi.string().required().pattern(/^[0-9]+$/).messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            packaging: Joi.string().required().messages({
                'string.base': 'Packaging must be an object',
                'any.required': 'Meal packaging is required',
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateUpdateMeal(request) {
        const validateMealSchema = Joi.object({
            name: Joi.string().min(3).messages({
                'string.base':'Meal name must be a string',
                'any.required':'Meal name is required',
                'string.length':'Meal name must be 6 digits'
            }),
            meal_type: Joi.string().valid(...mealType),
            description: Joi.string().min(3).messages({
                'string.base':'Meal description must be a string',
                'any.required':'Meal description is required',
                'string.length':'Meal description must be 6 digits'
            }),
            meal_category: Joi.string().valid(...mealCategories),
            is_available: Joi.boolean().messages({
                'boolean.base':'Meal availability must be a boolean value',
                'boolean.empty':'Please indicate meal availability for purchasing sake',
                'any.required':'Please indicate meal availability for purchasing sake'
            }),
            unit_price: Joi.string().pattern(/^[0-9]+$/).messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
            mealImage: Joi.string(),
            packaging: Joi.string().required().messages({
                'string.base': 'Packaging must be an object',
                'any.required': 'Meal packaging is required',
            })
        })
        return validateMealSchema.validate(request.body, {abortEarly: false});
    }

    static validateDeleteMeal(request) {
        const validateMealSchema = Joi.object({
            mealId: Joi.string().required().messages({
                'string.base':'Meal Id must be a string',
                'any.required':'Meal Id is required'
            })
        })
        return validateMealSchema.validate(request.params, {abortEarly: false});
    }

}