import httpStatusCode from 'http-status-codes'
import { NotFoundError } from '../helpers/errorHandler.js';
import OrderService from '../services/OrderService.js';

export default class OrderController {

    // User get their order histories
    static async orderHistories(request, response) {
        try {
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {page: perPage}
            const userId = request.user._id;
            const orderHistories = await OrderService.orderHistories(userId, filterOption)
            return response.status(httpStatusCode.OK).json(orderHistories)
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }
    
    // For Admin
    static async usersOrderHistories(request, response) {
        try {
            const type = !(request.query.type) ? 'all' : request.query.type;
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {type: type, page: perPage}
            const orderHistories = await OrderService.usersOrderHistories(filterOption)
            return response.status(httpStatusCode.OK).json(orderHistories)
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }
    
    // For Vendor
    static async vendorOrderHistories(request, response) {
        try {
            const type = !(request.query.type) ? 'all' : request.query.type;
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {type: type, page: perPage}
            const vendorId = request.user.vendor;
            const orderHistories = await OrderService.vendorOrderHistories(vendorId, filterOption)
            return response.status(httpStatusCode.OK).json(orderHistories)
        } catch (error) {
            console.log(error)
            return response.status(error.status).json({message: error.message});
        }
    }

    static async viewOrder(request, response) {
        try {
            const id = request.params.id; 
            const viewOrder = await OrderService.viewOrder(id)
            return response.status(httpStatusCode.OK).json(viewOrder)
        } catch (error) {
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({ message: error.message });
            } else {
                return response.status(error.status).json({message: error.message});
            }
        }
    }
    
}