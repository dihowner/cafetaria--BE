import User from "../models/user.js";
import { sendEmail } from "../helpers/sendEmail.js";
import { config } from "../utility/config.js";
import { BadRequestError } from "../helpers/errorHandler.js";

export default class BroadcastService {
    
    static async sendBroadcast(subject, message, receiverType = 'all') {
        try {
            let filterOption;
            switch(receiverType) {
                case 'all':
                    filterOption = {is_verified: 'activated'};
                break;
                
                case 'user':
                    filterOption = {is_verified: 'activated', roles: 'user'};
                break;
                
                case 'vendor':
                    filterOption = {is_verified: 'activated', roles: 'vendor'};
                break;
            }         

            const users = await User.find(filterOption);
            if (users.length > 0) {
                for await (const user of users) {
                    let mailParams = {
                        replyTo: config.system_mail.no_reply,
                        receiver: user.email,
                        subject: subject
                    }
                    await sendEmail({}, message, mailParams)
                }
                return {
                    message: `Message sent successfully to ${users.length} recipients`,
                    status: true
                }
            }
            throw new BadRequestError('No user found')
        } catch (error) {
            throw error;
        }
    }
}