import Joi from 'joi';
import httpStatusCode from 'http-status-codes'
import CartService from '../services/CartService.js';
import { NotFoundError, UnAuthorizedError } from '../helpers/errorHandler.js';

const paymentMethod = ['card', 'bank_transfer']

export default class CartController {
    static async createCart(request, response) {
        console.log('body', request.body)
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
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({message: error.message});
            } else {
                return response.status(error.status).json({message: error.message});
            }
        }
    }
    
    static async checkOutCart(request, response) {
        try {
            const userId = request.user._id;
            const cartData = request.body;
            const checkout = await CartService.checkOutCart(userId, cartData)
            return response.status(httpStatusCode.OK).json(checkout);
        } catch (error) {
            console.log(error);
            if (error instanceof NotFoundError) {
                return response.status(httpStatusCode.NOT_FOUND).json({message: error.message});
            } else {
                return response.status(error.status).json({message: error.message});
            }
        }
    }

    static async verifyCartPayment(request , response) {
        try {
            let paymentData = request.query;
            const verifyCartPayment = await CartService.verifyCartPayment(paymentData)
            return response.status(200).send(verifyCartPayment)
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
    static validateCheckOut(request) {
        const checkoutSchema = Joi.object({
            cartId: Joi.string().required().trim().messages({
                'any.required':'Cart ID is required',
                'string.base':'Cart ID must be a string',
                'string.empty':'Cart ID cannot be empty',
            }),
            deliveryInfo: Joi.object({
                name: Joi.string().required().trim().messages({
                    'any.required': 'Delivery name is required',
                    'string.base':'Delivery name be a string',
                }),
                address: Joi.string().required().trim().messages({
                    'any.required':'Delivery address is required',
                    'string.base':'Delivery address must be a string',
                }),
                phone: Joi.string().required().trim().messages({
                    'any.required':'Delivery phone number is required',
                    'string.base':'Delivery phone number must be a number',
                })
            }).required().messages({
                'any.required':'Delivery information is required'
            }),
            payment_method: Joi.string().valid(...paymentMethod).required()
        });
        return checkoutSchema.validate(request.body, {abortEarly: false});
    }
}