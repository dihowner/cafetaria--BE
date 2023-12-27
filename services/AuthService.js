import User from "../models/user.js";
import Vendors from "../models/vendor.js";
import ResetPassword from "../models/reset_password.js";
import VerifyRegistration from "../models/verify-reg.js";
import reformNumber from "../utility/number.js"
import { generateRandomNumber } from "../utility/util.js"
import { config } from "../utility/config.js"
import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import UserService from "./UserService.js";
import { readFile } from "../helpers/fileReader.js";
import { sendEmail } from "../helpers/sendEmail.js";

// Get the current time
const currentTime = new Date();
const expiringTime = config.OTP_EXPIRY_TIME
let uniqueToken;

export default class AuthService {

    static async createUser(name, email, mobile_number, password, roles, vendorProps) {
        try{
            const fileContent = await readFile("mailer/templates/verify-registration.html")
            
            const isEmailExist = await UserService.getOne({email: email })
            if(isEmailExist) throw new BadRequestError(`Email (${email}) already associated to a user`)
            let clientNumber = reformNumber(mobile_number);
            if(clientNumber === false) throw new BadRequestError(`Mobile number (${mobile_number}) provided is invalid. Mobile number should start with leading zero (0) or 234`)
            const isPhoneExist = await UserService.getOne({mobile_number: clientNumber })
            if(isPhoneExist) throw new BadRequestError(`Mobile number (${clientNumber}) already associated to a user`)

            const userRole = roles == undefined ? "user" : roles.toLowerCase()

            let userData = new User({
                name: name,
                email: email,
                password: await UserService.hashPassword(password),
                mobile_number: reformNumber(mobile_number),
                roles: userRole,
                transact_pin: userRole == 'vendor' ? '000000' : null
            })
            const createUser = await userData.save();
            if(!createUser) throw new BadRequestError("User creation failed. Please try again later.")

            if (createUser && userRole === 'vendor') {
                let vendorData = new Vendors({
                    user: createUser._id,
                    store_name: vendorProps.store_name,
                    isPhysicalStore: vendorProps.isPhysicalStore,
                    store_address: (vendorProps.isPhysicalStore) ? vendorProps.store_address : undefined
                });
                await vendorData.save();
            }

            uniqueToken = generateRandomNumber(6);

            // Save the verify token
            let verifyRegData = new VerifyRegistration({
                user_id: createUser._id,
                token: uniqueToken
            })
            await verifyRegData.save();
            
            // Send email...
            const mailParams = {
                replyTo: config.system_mail.no_reply,
                receiver: email,
                subject: `Verify your ${config.APP_NAME.toUpperCase()} Account`
            }

            const mailData = {
                customer_name: name,
                token: uniqueToken
            };
            await sendEmail(mailData, fileContent, mailParams)
            
            const user = createUser.toObject();
            delete user.password;
            delete user.transact_pin;

            return user
        }
        catch (error) {
            throw new BadRequestError(error.message);
        }
    }

    static async VerifyRegistration(verifyToken) {
        const fileContent = await readFile("mailer/templates/registration.html")

        const getToken = await VerifyRegistration.findOne({token: verifyToken})
        if (!getToken) throw new NotFoundError(`Verification code (${verifyToken}) could not be found or does not exist`);
        if (getToken.status != 'new') throw new BadRequestError(`Verification code (${verifyToken}) has already been used in activating your account. Kindly proceed to login`);

        // Let's verify the user with the token asap
        const updateUser = await UserService.updateUser(getToken.user_id, { is_verified: 'activated'})
        if (!updateUser) throw new BadRequestError('We could not activate your account at this time. Please try again later')

        // Update the verification token...
        await VerifyRegistration.findByIdAndUpdate(getToken._id, {
            $set: { status: 'used'}
        }, { new: true });

        // Send email...
        const mailData = {
            customer_name: updateUser.name,
            social_media_handle: config.SOCIAL_MEDIA_HANDLE
        };

        const mailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: updateUser.email,
            subject: `Welcome to ${config.APP_NAME.toUpperCase()}`
        }
        
        await sendEmail(mailData, fileContent, mailParams)
        return {
            message: 'Your account has been verified. Kindly proceed to login',
            data: updateUser
        }
    }
    
    static async signIn(email, password, userRole) {
        const user = await UserService.getOne({email: email, roles: userRole});
        if(user) {
            const checkLoginPass = await UserService.comparePassword(password, user.password);
            if(!checkLoginPass) throw new BadRequestError("Bad combination of email address or password")
            if (user.is_verified == 'pending') throw new BadRequestError("Your account is pending activation. Kindly check your email inbox or spam folder.")
            if (user.is_verified == 'suspended') throw new BadRequestError("Your account is currently suspended. Kindly reach out to our support to assist you activate your account")
            const bearerToken = await UserService.generateAuthToken(user)
            
            return {
                message: "Login successful",
                token: bearerToken, 
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.roles
                }
            }
        }        
        throw new BadRequestError('Bad combination of email address or password');
    }

    static async passwordRequest(emailAddress) {
        const fileContent = await readFile("mailer/templates/forgotPassRequest.html")

        const user = await UserService.getOne({email: emailAddress})
        if(!user) throw new BadRequestError(`Email address (${emailAddress}) is not associated to any user`)
        const userId = user._id;
        
        // Does user has an existing token that is still valid...?
        const isNewReset = await ResetPassword.findOne({user_id: userId, status: 'new'})
        if(isNewReset) {
            // Convert the past time string to a Date object
            const pastTime = new Date(isNewReset.created_at);
            // Calculate the difference in milliseconds
            const timeDifferenceMs =  Math.floor((currentTime - pastTime) / (1000 * 60));
            if(timeDifferenceMs >= expiringTime) {
                uniqueToken = generateRandomNumber(6)
                await ResetPassword.findByIdAndUpdate(isNewReset._id, { $set: {'status':'expired'} }, {new: true});
                await this.saveNewToken(uniqueToken, userId)
            }
            else {
                uniqueToken = isNewReset.token;
            }
        }
        else {
            uniqueToken = generateRandomNumber(6)
            await this.saveNewToken(uniqueToken, userId)
        }

        // Send email...
        const mailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: emailAddress,
            subject: `${config.APP_NAME.toUpperCase()} PASSWORD RESET REQUEST`
        }
        const mailData = {
            customer_name: user.name,
            token: uniqueToken,
            token_expiring_time: expiringTime
        };
        await sendEmail(mailData, fileContent, mailParams)

        return {
            message: "An email has been sent to your email address containing your reset password guideline. Thank You",
            data: {
                id: userId,
                name: user.name,
                email: emailAddress
            }
        }
    }

    static async verifyResetPasswordToken(resetToken) {
        const getToken = await ResetPassword.findOne({token: resetToken, status: 'new'})
        if(!getToken) throw new NotFoundError(`Reset token (${resetToken}) could not be found or already used`)
        
        // Convert the past time string to a Date object
        const pastTime = new Date(getToken.created_at);
        const timeDifferenceMs =  Math.floor((currentTime - pastTime) / (1000 * 60));
        if(timeDifferenceMs >= expiringTime) {
            await ResetPassword.findByIdAndUpdate(getToken._id, { $set: { status: 'expired' } }, {new: true});
            throw new BadRequestError(`Reset password (${resetToken}) token has expired. Kindly generate a new one.`)
        }
        return {
            message: 'Verification successful. Token is still valid',
            data: {
                token_id: getToken._id,
                token: getToken.token,
                status: getToken.status,
                user_id: getToken.user_id
            }
        }
    }

    static async changePassword(resetToken, password) {
        const fileContent = await readFile("mailer/templates/success-resetpass.html")

        const getToken = await ResetPassword.findOne({token: resetToken, status: 'new'})
        if(!getToken) throw new NotFoundError(`Reset token (${resetToken}) could not be found or already used`)
        const user = await UserService.updateUser(getToken.user_id, { password: await UserService.hashPassword(password) });
        if(!user) throw new BadRequestError("Error processing request. Please try again")
        await ResetPassword.findByIdAndUpdate(getToken._id, { $set: { status: 'used' } }, {new: true});
        // Send email...
        const mailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: user.email,
            subject: `Password changed successfully`
        }
        const mailData = {
            customer_name: user.name
        };
        await sendEmail(mailData, fileContent, mailParams)
        return {
            message: "Success. Your password reset is successful. You can now login",
            data: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        }
    }

    static async saveNewToken (uniqueToken, userId) {
        try {
            let resetPassData = new ResetPassword({
                token: uniqueToken,
                user_id: userId,
                status: 'new'
            })
            const saveToken = await resetPassData.save();
            if(!saveToken) return false;
            return true;
        }
        catch(error) {
            return false;
        }
    }
}