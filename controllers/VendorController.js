import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import VendorService from '../services/VendorService.js';

export default class VendorController {
    static async getVendor(request, response) {
        try {
            const vendorId = request.user.vendor; 
            const getVendor = await VendorService.getVendor(vendorId)
            return response.status(httpStatusCode.OK).json(getVendor);
        } catch (error) {
            console.log(error);
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
            return response.status(error.status).json({message: error.message});
        }
    }

    static async getVendorMeals(request, response) {
        try {
            const getVendorMeals = await VendorService.getVendorMeals(request.params.vendorId)
            return response.status(httpStatusCode.OK).json(getVendorMeals);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }
}