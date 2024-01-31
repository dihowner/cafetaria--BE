import httpStatusCode from 'http-status-codes'
import UserService from '../services/UserService.js';

export default class AdminController {
    
    static async getUsers(request, response) {
        try {
            const statusType = !(request.query.status) ? 'all' : request.query.status;
            const perPage = !(request.query.page) ? 1 : parseInt(request.query.page);
            const filterOption = {status: statusType, page: perPage}
            const getUsers = await UserService.getAllUser(filterOption)
            return response.status(httpStatusCode.OK).json(getUsers)
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }
}