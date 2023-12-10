import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import { UnAuthorizedError } from '../helpers/errorHandler.js';
import WalletService from '../services/WalletService.js';

export default class WalletController {

    static async fundWallet(request , response) {
        try {
            const {
                body: { amount }
            } = request;
            const initiateWallet = await WalletService.fundWallet(request.user, amount)
            return response.status(httpStatusCode.OK).json(initiateWallet)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle other errors or rethrow them
                // throw new BadRequestError('Something went wrong');
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }

    static async verifyPayment(request , response) {
        try {
            let responseQuery = request.query;
            const paymentObject = {txId: responseQuery.transaction_id, tx_channel: 'flutterwave'};

            const finalizePayment = await WalletService.updateWalletIn(responseQuery.tx_ref, responseQuery.status, paymentObject)
            return response.send(finalizePayment)
        }
        catch(error) {
            // Handle the specific error types
            if (error instanceof UnAuthorizedError) {
                return response.status(httpStatusCode.UNAUTHORIZED).json({ message: error.message });
            } else {
                // Handle other errors or rethrow them
                // throw new BadRequestError('Something went wrong');
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }



    /** Schema Validations **/    
    static validateFundingRequest(request) {
        const walletInSchema = Joi.object({
            amount: Joi.number().required().min(1).messages({
                'any.required':'Amount is required',
                'any.min':'Funding amount must be greater than zero'
            })
        });
    
        return walletInSchema.validate(request.body, {abortEarly: false});
    }

    static validateWalletUpdate(request) {
        const updateWalletSchema = Joi.object({
            status: Joi.string().required().messages({
                'string.base':'Transaction status must be a string',
                'string.empty':'Transaction status cannot be empty',
                'any.required':'Transaction status is required'
            }),
            tx_ref: Joi.string().messages({
                'string.base':'Transaction reference must be a string',
                'string.empty':'Transaction reference cannot be empty'
            }),
            transaction_id: Joi.string().messages({
                'string.base':'Transaction reference must be a string',
                'string.empty':'Transaction reference cannot be empty'
            })
        });    
        return updateWalletSchema.validate(request.query, {abortEarly: false});
    }
}