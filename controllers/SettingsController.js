import Joi from 'joi'
import httpStatusCode from 'http-status-codes'
import SettingsService from '../services/SettingsService.js';

export default class SettingsController {
    static async setCartSettings(request, response) {
        try {
            const {
                body : { name, value }
            } = request;
            const updateSettings = await SettingsService.setCartSettings(name, value)
            return response.status(httpStatusCode.OK).json(updateSettings);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async createSettings(request, response) {
        try {
            const createSettings = await SettingsService.createSettings()
            return response.status(httpStatusCode.OK).json(createSettings);
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }

    

    static validateSettings(request) {
        const updateSettingsSchema = Joi.object({
            name: Joi.string().required().trim().messages({
                'string.base':'Name value field must be a string',
                'string.empty':'Name value cannot be empty',
                'any.required':'Name value is required'
            }),
            value: Joi.string().trim().messages({
                'string.base':'Settings value must be a string',
                'string.empty':'Settings value cannot be empty'
            })
        });    
        return updateSettingsSchema.validate(request.body, {abortEarly: false});
    }

}