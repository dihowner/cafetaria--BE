import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import VendorService from '../services/VendorService.js';
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';

export default class VendorController {
    static async getVendor(request, response) {
        try {
            const user = request.user; 
            const getVendor = await VendorService.getVendor(user)
            return response.status(httpStatusCode.OK).json(getVendor);
        } catch (error) { 
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async vendorStatistics(request, response) {
        try {
            const vendorStats = await VendorService.vendorStats(request.params.vendorId)
            return response.status(httpStatusCode.OK).json(vendorStats);
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async getVendorMeals(request, response) {
        try {
            const statusType = !(request.query.status) ? 'all' : request.query.status;
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {status: statusType, page: perPage}
            const vendorId = request.params.vendorId;
            const getVendorMeals = await VendorService.getVendorMeals(vendorId, filterOption)
            return response.status(httpStatusCode.OK).json(getVendorMeals);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async updateBusinessHour(request, response) {
        try {
            const vendorId = request.user.vendor;
            const businessHour = request.body;
            const updateBusinessHour = await VendorService.updateBusinessHour(vendorId, businessHour)
            return response.status(httpStatusCode.OK).json(updateBusinessHour)
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async getAllVendor(request, response) {
        try {
            const statusType = !(request.query.status) ? 'all' : request.query.status;
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {status: statusType, page: perPage}
            const getVendors = await VendorService.getAllVendor(filterOption)
            return response.status(httpStatusCode.OK).json(getVendors)
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static openingClosingTimeSchema = Joi.object({
        openingTime: Joi.string().required().trim().messages({
            'string.base':'Business opening hour must be a string',
            'string.empty':'Business opening hour cannot be empty',
            'any.required':'Business opening hour is required'
        }),
        closingTime: Joi.string().required().trim().messages({
            'string.base':'Business closing hour must be a string',
            'string.empty':'Business closing hour cannot be empty',
            'any.required':'Business closing hour is required'
        }),
    });

    static validateBusinessHourSchema(request) {

        const transformedBody = Object.keys(request.body).reduce((acc, key) => {
            acc[key.toLowerCase()] = request.body[key];
            return acc;
        }, {});

        const validateBusinessHourSchema = Joi.object({
            sunday: VendorController.openingClosingTimeSchema,
            monday: VendorController.openingClosingTimeSchema,
            tuesday: VendorController.openingClosingTimeSchema,
            wednesday: VendorController.openingClosingTimeSchema,
            thursday: VendorController.openingClosingTimeSchema,
            friday: VendorController.openingClosingTimeSchema,
            saturday: VendorController.openingClosingTimeSchema,
        }).keys();

        return validateBusinessHourSchema.validate(transformedBody, {abortEarly: false});
    }
}