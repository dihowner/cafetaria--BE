import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';
import MartCategoryService from '../services/MartCategoryService.js';

export default class MartCategoryController {
    
    static async createCategory(request, response) {
        try {
            const {
                body: {name}
            } = request;
            const userId = request.user._id
            const martId = request.params.martId

            const createCategory = await MartCategoryService.createCategory(userId, martId, name)
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
    
    static async updateCategory(request, response) {
        try {
            const {
                body: {name}
            } = request;
            const categoryId = request.params.categoryId;
            const updateCategory = await MartCategoryService.updateCategory(categoryId, name)
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
    
    static async getMartCategories(request, response) {
        try {
            const martId = request.params.martId;
            const getMartCategories = await MartCategoryService.getMartCategories(martId)
            return response.status(httpStatusCode.OK).json(getMartCategories);
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
            const userId = request.user._id
            const categoryId = request.params.categoryId;
            const deleteCategory = await MartCategoryService.deleteCategory(userId, categoryId)
            return response.status(httpStatusCode.OK).json(deleteCategory);
        }
        catch (error) {
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

    static validateMart(request) {

        const isUpdate = request.method.toUpperCase() === 'PUT'

        const validateMartSchema = Joi.object({
            name: isUpdate ? Joi.string().trim().messages({
                'string.base':'Mart name must be a string',
                'any.required':'Mart name is required'
            }) : Joi.string().required().trim().messages({
                'string.base':'Mart name must be a string',
                'any.required':'Mart name is required'
            })
        });
        return validateMartSchema.validate(request.body, {abortEarly: false});
    }

}