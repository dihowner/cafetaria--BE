import httpStatusCode from 'http-status-codes'
import BankService from '../services/BankService.js';

export default class BankController {
    static async fetchAllBanks(request, response) {
        try {
            const fetchBanks = await BankService.fetchAllBanks()
            return response.status(httpStatusCode.OK).json(fetchBanks);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }

    static async fetchPayoutBanks(request, response) {
        try {
            const fetchBanks = await BankService.fetchPayoutBanks()
            return response.status(httpStatusCode.OK).json(fetchBanks);
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        }
    }
}