import httpStatusCode from 'http-status-codes'
import BroadcastService from "../services/BroadcastService.js";
import { BadRequestError } from '../helpers/errorHandler.js';

export default class BroadcastController {
    
    static async sendBroadcast(request, response) {
        try {
            const {
                body: {subject, message, receiver_type}
            } = request;
            
            const sendBroadcast = await BroadcastService.sendBroadcast(subject, message, receiver_type)
            return response.status(httpStatusCode.OK).json(sendBroadcast)
        } catch (error) {
            // Handle the specific error types
            if (error instanceof BadRequestError) {
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message });
            } else {
                // Handle errors
                return response.status(httpStatusCode.BAD_REQUEST).json({ message: error.message })
            }
        }
    }
}