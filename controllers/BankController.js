import Joi from 'joi'
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

    static async verifyBankAccount(request, response) {
        try {
            const {
                body: {
                    bank_code, account_number
                }
            } = request;

            const verifyAccount = await BankService.verifyBankAccount(bank_code, account_number)
            return response.status(httpStatusCode.OK).json(verifyAccount);
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

    static validateBankAccount(request) {
        const validateBankSchema = Joi.object({
            account_number: Joi.string().pattern(/^[0-9]+$/).trim().min(10).max(10).messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed',
                'string.max':'Account number cannot exceeds 10 digits',
                'string.min':'Account number must be 10 digits',
            }),
            bank_code: Joi.string().pattern(/^[0-9]+$/).trim().messages({
                'string.base':'Meal price must be a numeric value',
                'any.required':'Meal price is required',
                'string.pattern.base':'Only numeric digit is allowed'
            }),
        })
        return validateBankSchema.validate(request.body, {abortEarly: false});
    }
}