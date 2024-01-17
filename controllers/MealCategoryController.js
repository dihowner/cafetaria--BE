import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import MealCategoryService from '../services/MealCategoryService.js';
import { NotFoundError } from '../helpers/errorHandler.js';

export default class MealCategoryController {
    static async createMealCategory(request, response) {
        try {
            const {
                body: { name }
            } = request;
            const mealId = request.params.mealId;
            
            const createCategory = await MealCategoryService.createCategory(mealId, name)
            return response.status(httpStatusCode.OK).json(createCategory);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async updateMealCategory(request, response) {
        try {
            const {
                body: { name }
            } = request;
            const categoryId = request.params.categoryId;
            const updateCategory = await MealCategoryService.updateCategory(categoryId, name)
            return response.status(httpStatusCode.OK).json(updateCategory);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getMealCategories(request, response) {
        try {
            const mealId = request.params.mealId;
            const getCategories = await MealCategoryService.getMealCategories(mealId)
            return response.status(httpStatusCode.OK).json(getCategories);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getCategory(request, response) {
        try {
            const categoryId = request.params.categoryId;
            const getCategory = await MealCategoryService.getCategory(categoryId)
            return response.status(httpStatusCode.OK).json(getCategory);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async deleteCategory(request, response) {
        try {
            const categoryId = request.params.categoryId;
            const deleteSubMeal = await MealCategoryService.deleteCategory(categoryId)
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
    
    static validateCategory(request) {
        const validateMealCategorySchema = Joi.object({
            name: Joi.string().min(3).trim().required().messages({
                'string.base':'Meal name must be a string',
                'any.required':'Meal name is required',
            })
        })
        return validateMealCategorySchema.validate(request.body, {abortEarly: false});
    }
}