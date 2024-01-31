import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';
import RolesService from '../services/RolesService.js';

export default class RolesController {
    
    static async createRole(request, response) {
        try {
            const {
                body: { name }
            } = request;

            const createRole = await RolesService.createRole(name)
            return response.status(httpStatusCode.OK).json(createRole)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async updateRole(request, response) {
        try {
            const {
                body: { name }
            } = request;

            const roleId = request.params.id
            
            const updateRole = await RolesService.updateRole(roleId, name)
            return response.status(httpStatusCode.OK).json(updateRole)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async getRole(request, response) {
        try {
            const roleId = request.params.id
            const getRole = await RolesService.getRole(roleId)
            return response.status(httpStatusCode.OK).json(getRole)
        }
        catch(error) {
            // Handle the specific error types
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
    
    static async getRoles(request, response) {
        try {roleId
            const getRoles = await RolesService.getRoles()
            return response.status(httpStatusCode.OK).json(getRoles)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
    
    static async deleteRole(request, response) {
        try {
            const roleId = request.params.id
            const deleteRole = await RolesService.deleteRole(roleId)
            return response.status(httpStatusCode.OK).json(deleteRole)
        }
        catch(error) {
            // Handle the specific error types
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


    /** Schema Validations **/    
    static validateRole(request) {
        const validateRoleSchema = Joi.object({
            name: Joi.string().min(3).trim().required().messages({
                'string.base':'Role name must be a string',
                'any.required':'Role name is required',
            })
        })
        return validateRoleSchema.validate(request.body, {abortEarly: false});
    }
}