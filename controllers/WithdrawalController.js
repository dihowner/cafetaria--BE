import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import WithdrawalService from '../services/WithdrawalService.js';

export default class WithdrawalController {
    
    static async initiateWithdrawal(request, response) {
        try {
            const userId = request.user._id;
            const {
                body: { amount, transact_pin }
            } = request
            
            const withdraw = await WithdrawalService.initiateWithdrawal(userId, amount, transact_pin)
            return response.status(httpStatusCode.OK).json(withdraw)
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }
    
    static async getWithdrawalHistory(request, response) {
        try {
            const userId = request.user._id;
            const withdrawalHistory = await WithdrawalService.getWithdrawalHistory(userId)
            return response.status(httpStatusCode.OK).json(withdrawalHistory)
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }
    
    static async viewWithdrawalById(request, response) {
        try {
            const historyId = request.params.id;
            const viewHistory = await WithdrawalService.viewWithdrawalHistory(historyId)
            return response.status(httpStatusCode.OK).json(viewHistory)
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }

    static validateWithdrawal(request) {
        const validateWithdrawalSchema = Joi.object({
            amount: Joi.string().required().pattern(/^[0-9]+$/).messages({
                'string.base':'Amount must be a number',
                'any.required':'Amount is required',
                'string.pattern.base':'Only numeric value is allowed'
            }),
            transact_pin: Joi.string().required().min(6).max(6).pattern(/^[0-9]+$/).messages({
                'string.base':'Transaction pin must be a number',
                'any.required':'Transaction pin is required',
                'string.min':'Transaction pin must be 6 digits',
                'string.max':'Transaction pin cannot exceeds 6 digits',
                'string.pattern.base':'Only numeric value is allowed'
            })
        });
        return validateWithdrawalSchema.validate(request.body, {abortEarly: false});
    }

}