import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import { NotFoundError } from '../helpers/errorHandler.js';
import GroceryCategoryService from '../services/GroceryCategoryService.js';

export default class GroceryCategoryController {
    
    static async createCategory(request, response) {
        try {
            const {
                body: { name }
            } = request;
            const adminId = request.admin._id;
            const createCategory = await GroceryCategoryService.createCategory(adminId, name)
            return response.status(httpStatusCode.OK).send(createCategory)
        } catch(error) {
            return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
        }
    }

    static async updateCategory(request, response) {
        try {
            const {
                body: { name }
            } = request;
            const categoryId = request.params.id;
            const updateCategory = await GroceryCategoryService.updateCategory(categoryId, name)
            return response.status(httpStatusCode.OK).send(updateCategory)
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

    static async deleteCategory(request, response) {
        try {
            const categoryId = request.params.id;
            const deleteCategory = await GroceryCategoryService.deleteCategory(categoryId)
            return response.status(httpStatusCode.OK).send(deleteCategory)
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

    static async getCategory(request, response) {
        try {
            const categoryId = request.params.id;
            const getCategory = await GroceryCategoryService.getCategory(categoryId)
            return response.status(httpStatusCode.OK).send(getCategory)
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

    static async getCategories(request, response) {
        try {
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const isSelectOption = !(request.query.isSelectOption) ? false : true;
            const filterOption = {page: perPage, selectOption: isSelectOption}
            const getCategory = await GroceryCategoryService.getCategories(filterOption)
            return response.status(httpStatusCode.OK).send(getCategory)
        } catch(error) {
            return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
        }
    }

    static validateAdd(request) {
        const validateGrocerySchema = Joi.object({
            name: Joi.string().required().trim().messages({
                'string.base':'Grocery Category name must be a string',
                'any.required':'Grocery Category name is required'
            })
        });
        return validateGrocerySchema.validate(request.body, {abortEarly: false});
    }
}