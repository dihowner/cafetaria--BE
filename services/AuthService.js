import User, {validateCreateUser, validateLoginUser, validateUpdateUser, hashPassword, comparePassword} from "../models/user.js";
import ResetPassword, { validatePasswordReset, validateVerifyReset }  from "../models/reset_password.js";
import VerifyRegistration, { validateVerifyToken } from "../models/verify-reg.js";
import reformNumber from "../utility/number.js"
import jwt from "jsonwebtoken";
import { generateRandomNumber } from "../utility/util.js"
import { config } from "../utility/config.js"
import httpStatusCode from "http-status-codes";
import { smtpTransporter } from "../mailer/smtp.js";
import filesystem from "fs"
import mustache from "mustache"
import { errorLogger } from "../middleware/errorLogger.js";

let uniqueToken = generateRandomNumber(6);

// Get the current time
const currentTime = new Date();
const expiringTime = config.OTP_EXPIRY_TIME

export const createUser = async (request, response) => {
    filesystem.readFile("mailer/templates/verify-registration.html", "utf8", async(error, fileContent) => {
        if(error) return errorLogger(error, request, response, next)

        let payload = request.body;
        const validatePayload = validateCreateUser(payload);
        if (validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message});

        let emailAddress = payload.email;
        const isEmailExist = await User.findOne({email: emailAddress })
        if(isEmailExist) return response.status(httpStatusCode.BAD_REQUEST).json({message: `Email (${emailAddress}) already associated to a user`})

        let clientNumber = reformNumber(payload.mobile_number);
        if(clientNumber === false) return response.status(httpStatusCode.BAD_REQUEST)
                                            .json({message: `Mobile number (${payload.mobile_number}) provided is invalid. Mobile number should start with leading zero (0) or 234`})

        const isPhoneExist = await User.findOne({mobile_number: clientNumber })
        if(isPhoneExist) return response.status(httpStatusCode.BAD_REQUEST).json({message: `Mobile number (${clientNumber}) already associated to a user`})

        let userData = new User({
            name: payload.name,
            email: payload.email,
            password: await hashPassword(payload.password),
            mobile_number: reformNumber(payload.mobile_number),
            roles: payload.roles == undefined ? "user" : payload.roles
        })

        try {
            const createUser = await userData.save();
            if(!createUser) return response.status(httpStatusCode.BAD_REQUEST).json({message: "User creation failed. Please try again later."})
            
            const transporter = await smtpTransporter();
            const mailData = {
                customer_name: payload.name,
                token: uniqueToken,
                app_name: config.APP_NAME
            };

            // Save the verify token
            let verifyRegData = new VerifyRegistration({
                user_id: createUser._id,
                token: uniqueToken
            })
            await verifyRegData.save();

            const renderedHTML = mustache.render(fileContent, mailData);
            const mailOptions = {
                from: {
                    name: `${config.APP_NAME.toUpperCase()}`,
                    address: config.system_mail.no_reply
                },
                to: payload.email,     // Receiver's email address
                subject: `Verify your ${config.APP_NAME.toUpperCase()} Account`,
                html: renderedHTML
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return errorLogger(error, request, response, next)
                
                return response.status(httpStatusCode.OK).json({message: "Your registration was successful. Kindly verify your email address to proceed", data: {
                    name: payload.name,
                    email: payload.email
                }})
            }); 
        }
        catch(error) {
            return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
        }
    });
};

export const verifyUserAccount = async(request, response, next) => {
    filesystem.readFile("mailer/templates/registration.html", "utf8", async(error, fileContent) => {
        let payload = request.body;
        const validatePayload = validateVerifyToken(payload);
        if(validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message})
        let verifyToken = payload.token;

        const getToken = await VerifyRegistration.findOne({token: verifyToken})
        if (!getToken) return response.status(httpStatusCode.NOT_FOUND).json({message: `Verification code (${verifyToken}) could not be found or does not exist`});
        if (getToken.status != 'new') return response.status(httpStatusCode.BAD_REQUEST)
                                        .json({message: `Verification code (${verifyToken}) has already been used in activating your account. Kindly proceed to login`});
        
        try {
            // Let's verify the user with the token asap
            const verifyUser = await User.findByIdAndUpdate(getToken.user_id, {
                                    $set: { is_verified: 'activated'}
                                }, { new: true, select: 'name email' });
            if (!verifyUser) return errorLogger(verifyUser, request, response, next)
                                
            // Update the verification token...
            await VerifyRegistration.findByIdAndUpdate(getToken._id, {
                $set: { status: 'used'}
            }, { new: true });

            const mailData = {
                customer_name: verifyUser.name,
                app_name: config.APP_NAME,
                social_media_handle: config.SOCIAL_MEDIA_HANDLE
            };
            const renderedHTML = mustache.render(fileContent, mailData);

            const transporter = await smtpTransporter();
            const mailOptions = {
                from: {
                    name: `${config.APP_NAME.toUpperCase()}`,
                    address: config.system_mail.no_reply
                },
                to: verifyUser.email,     // Receiver's email address
                subject: `Welcome to ${config.APP_NAME.toUpperCase()}`,
                html: renderedHTML
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return errorLogger(error, request, response, next)
                
                return response.status(httpStatusCode.OK).json({message: "Your account has been verified. Kindly proceed to login", data: {
                    name: verifyUser.name,
                    email: verifyUser.email
                }})
            }); 
        }
        catch(error) {
            return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
        }
    });
}

export const loginUser = async(request, response) => {
    let payload = request.body;
    const validatePayload = validateLoginUser(payload);
    if(validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message})

    const user = await User.findOne({email: payload.email, roles: payload.roles})

    if(user) {
        const checkLoginPass = await comparePassword(payload.password, user.password);
        if(!checkLoginPass) return response.status(httpStatusCode.BAD_REQUEST).json({message: "Bad combination of email address or password"})

        if (user.is_verified == 'pending') return response.status(httpStatusCode.BAD_REQUEST)
                                                    .json({message: "Your account is pending activation. Kindly check your email inbox or spam folder."})
        if (user.is_verified == 'suspended') return response.status(httpStatusCode.BAD_REQUEST)
                                                .json({message: "Your account is currently suspended. Kindly reach out to our support to assist you activate your account"})
        
        // Generate Bearer Token
        const bearerToken = jwt.sign({
                _id: user._id,
                role: user.roles,
            },
            config.JWT_SECRET,
            { expiresIn: "24h" }
        )
        return response.status(httpStatusCode.OK).json({message: "Login successful", token: bearerToken, data: {
            name: user.name,
            email: user.email,
            role: user.roles
        }});
    }
    else {
        return response.status(httpStatusCode.BAD_REQUEST).json({message: "Bad combination of email address or password"})
    }
};

export const passwordRequest = async(request, response, next) => {
    filesystem.readFile("mailer/templates/forgotPassRequest.html", "utf8", async(error, fileContent) => {
        if(error) return errorLogger(error, request, response, next)

        let payload = request.body;
        const validatePayload = validatePasswordReset(payload);
        if (validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message});
        let emailAddress = payload.email
        const user = await User.findOne({email: emailAddress})
        if(!user) return response.status(httpStatusCode.BAD_REQUEST).json({message: `Email address (${emailAddress}) is not associated to any user`})
        const userId = user._id;
        
        // Does user has an existing token that is still valid...?
        const isNewReset = await ResetPassword.findOne({user_id: userId, status: 'new'})
        
        if(isNewReset) {
            // Convert the past time string to a Date object
            const pastTime = new Date(isNewReset.created_at);
            // Calculate the difference in milliseconds
            const timeDifferenceMs =  Math.floor((currentTime - pastTime) / (1000 * 60));
            if(timeDifferenceMs >= expiringTime) {
                await ResetPassword.findByIdAndUpdate(isNewReset._id, {
                    $set: {'status':'expired'}
                }, {new: true});
                
                saveNewToken(uniqueToken, userId)
            }
            else {
                uniqueToken = isNewReset.token;
            }
        } 
        else {
            saveNewToken(uniqueToken, userId)
        }

        const transporter = await smtpTransporter();
        const mailData = {
            customer_name: user.name,
            token: uniqueToken,
            app_name: config.APP_NAME
        };

        const renderedHTML = mustache.render(fileContent, mailData);
        const mailOptions = {
            from: {
                name: `${config.APP_NAME.toUpperCase()}`,
                address: config.system_mail.no_reply
            },
            to: user.email,     // Receiver's email address
            subject: `${config.APP_NAME.toUpperCase()} PASSWORD RESET REQUEST`,
            html: renderedHTML
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return errorLogger(error, request, response, next)
            return response.status(httpStatusCode.OK).json({message: "An email has been sent to your email address containing your reset password guideline. Thank You"});
        }); 
    });
}

export const verifyResetPasswordToken = async(request, response) => {
    let payload = request.body;
    const validatePayload = validateVerifyReset(payload);
    if (validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message});
    let resetToken = payload.token
    const getToken = await ResetPassword.findOne({token: resetToken, status: 'new'})
    if(!getToken) return response.status(httpStatusCode.NOT_FOUND).json({message: `Reset token (${resetToken}) could not be found or already used`})

    // Convert the past time string to a Date object
    const pastTime = new Date(getToken.created_at);
    const timeDifferenceMs =  Math.floor((currentTime - pastTime) / (1000 * 60));
    if(timeDifferenceMs >= expiringTime) {
        await ResetPassword.findByIdAndUpdate(getToken._id, {
            $set: { status: 'expired' }
        }, {new: true});

        return response.status(httpStatusCode.BAD_REQUEST)
                        .json({message: `Reset password (${resetToken}) token has expired. Kindly generate a new one.`})
    }

    return response.status(httpStatusCode.OK).json({message: 'Reset token is valid', data: {
        token_id: getToken._id,
        token: getToken.token,
        status: getToken.status,
        user_id: getToken.user_id
    }})
}

export const changePassword = async(request, response, next) => {
    filesystem.readFile("mailer/templates/success-resetpass.html", "utf8", async(error, fileContent) => {
        if(error) return errorLogger(error, request, response, next)

        let payload = request.body;
        const validatePayload = validateUpdateUser('password_reset', payload)
        if (validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message});
        let resetToken = payload.token
        const getToken = await ResetPassword.findOne({token: resetToken, status: 'new'})

        if(!getToken) return response.status(httpStatusCode.NOT_FOUND).json({message: `Reset token (${resetToken}) could not be found or already used`})

        try {
            const user = await User.findByIdAndUpdate(getToken.user_id, {
                $set: { password: await hashPassword(payload.new_password) }
            }, {new: true, select: ('name email')});
            if(!user) return response.status(httpStatusCode.BAD_REQUEST).json({message: "Error processing request. Please try again"})
            
            await ResetPassword.findByIdAndUpdate(getToken._id, {
                $set: { status: 'used' }
            }, {new: true});

            const transporter = await smtpTransporter();
            const mailData = {
                customer_name: user.name,
                app_name: config.APP_NAME
            };
    
            const renderedHTML = mustache.render(fileContent, mailData);
            const mailOptions = {
                from: {
                    name: `${config.APP_NAME.toUpperCase()}`,
                    address: config.system_mail.no_reply
                },
                to: user.email,     // Receiver's email address
                subject: `Password changed successfully`,
                html: renderedHTML
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) return errorLogger(error, request, response, next)
                return response.status(httpStatusCode.OK).json({message: "Success. Your password reset is successful. You can now login", data: {
                    name: user.name,
                    email: user.email,
                }});
            }); 
        }
        catch(error) {
            return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
        }
    });
}

const saveNewToken = async (uniqueToken, userId) => {
    let resetPassData = new ResetPassword({
        token: uniqueToken,
        user_id: userId,
        status: 'new'
    })
    try {
        const saveToken = await resetPassData.save();
        if(!saveToken) return response.status(httpStatusCode.BAD_REQUEST).json({message: "Reset password request failed. Please try again later."})
    }
    catch(error) {
        return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}