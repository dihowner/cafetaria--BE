import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import VendorService from '../services/VendorService.js';

export default class VendorController {
    static async getVendor(request, response) {
        try {
            const getVendor = await VendorService.getOne({_id: request.params.vendorId})
            return response.status(httpStatusCode.OK).json(getVendor);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
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
}