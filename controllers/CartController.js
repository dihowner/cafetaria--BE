import httpStatusCode from 'http-status-codes'
import CartService from '../services/CartService.js';

export default class CartController {
    static async createCart(request, response) {
        try {
            const {
                body : { cartId, meal_id, submeal_id, packaging, quantity }
            } = request;
            const createCart = await CartService.createCart(cartId, meal_id, submeal_id, packaging, quantity)
            return response.status(httpStatusCode.OK).json(createCart);
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }

    static async deleteCart(request, response) {
        try {
            const cartId = request.params.cartId
            const mealSubMealId = request.params.mealSubMealId
            const deleteCart = await CartService.deleteCart(cartId, mealSubMealId)
            return response.status(httpStatusCode.OK).json(deleteCart);
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }

    static async getCart(request, response) {
        try {
            const cartId = request.params.cartId
            const getCart = await CartService.getCart(cartId)
            return response.status(httpStatusCode.OK).json(getCart);
        } catch (error) {
            console.log(error);
            return response.status(error.status).json({message: error.message});
        }
    }


    // static validateBankAccount(request) {
    //     const validateBankSchema = Joi.object({
    //         account_number: Joi.string().pattern(/^[0-9]+$/).trim().min(10).max(10).messages({
    //             'string.base':'Meal price must be a numeric value',
    //             'any.required':'Meal price is required',
    //             'string.pattern.base':'Only numeric digit is allowed',
    //             'string.max':'Account number cannot exceeds 10 digits',
    //             'string.min':'Account number must be 10 digits',
    //         }),
    //         bank_code: Joi.string().pattern(/^[0-9]+$/).trim().messages({
    //             'string.base':'Meal price must be a numeric value',
    //             'any.required':'Meal price is required',
    //             'string.pattern.base':'Only numeric digit is allowed'
    //         }),
    //     })
    //     return validateBankSchema.validate(request.body, {abortEarly: false});
    // }
}