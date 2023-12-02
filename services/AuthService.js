import User, {validateCreateUser, validateLoginUser, hashPassword, comparePassword} from "../models/user.js";
import reformNumber from "../utility/number.js"
import jwt from "jsonwebtoken";
import { config } from "../utility/config.js"
import httpStatusCode from "http-status-codes";
// import { smtpTransporter } from '../mailer/smtp.js';
import { smtpTransporter } from '../mailer/smtp.js';

export const createUser = async (request, response) => {
    let payload = request.body;
    const validatePayload = validateCreateUser(payload);
    if (validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message});

    let emailAddress = request.body.email;
    const isEmailExist = await User.findOne({email: emailAddress })
    if(isEmailExist) return response.status(httpStatusCode.BAD_REQUEST).json({message: `Email (${emailAddress}) already associated to a user`})

    let clientNumber = reformNumber(payload.mobile_number);
    if(clientNumber === false) return response.status(httpStatusCode.BAD_REQUEST)
                                        .json({message: `Mobile number (${payload.mobile_number}) provided is invalid. Mobile number should start with leading zero (0) or 234`})

    let userData = new User({
        name: payload.name,
        email: payload.email,
        password: await hashPassword(payload.password),
        mobile_number: reformNumber(payload.mobile_number),
        roles: payload.roles == undefined ? 'user' : payload.roles
    })
    
    try {
        const createUser = await userData.save();
        return response.status(httpStatusCode.OK).json({message: "User created successfully", data: createUser})
    }
    catch(error) {
        return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
};

export const loginUser = async(request, response) => {
    let payload = request.body;
    const validatePayload = validateLoginUser(payload);
    if(validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validatePayload.error.details[0].message})

    const user = await User.findOne({email: payload.email, roles: payload.roles})

    if(user) {
        const checkLoginPass = await comparePassword(payload.password, user.password);
        if(!checkLoginPass) return response.status(httpStatusCode.BAD_REQUEST).json({message: "Bad combination of email address or password"})
            
        const token = jwt.sign({
                _id: user._id,
                role: user.roles,
            },
            config.JWT_SECRET,
            { expiresIn: "24h" }
        )
        return response.status(httpStatusCode.OK).json({message: "Login successful", token: token, user });
    }
    else {
        return response.status(httpStatusCode.BAD_REQUEST).json({message: "Bad combination of email address or password"})
    }

};

export const passwordRequest = async(request, response) => {

    const mailOptions = {
        from: {
            name: `${config.APP_NAME.toUpperCase()}`,
            address: config.system_mail.no_reply
        },
        to: 'oluwatayoadeyemi@yahoo.com',     // Receiver's email address
        subject: `${config.APP_NAME.toUpperCase()} PASSWORD RESET REQUEST`,
        text: 'Hello, this is a test email sent from Node.js!' // Email body
    };

    const transporter = await smtpTransporter();

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error:', error.message);
            return ;
        }
        console.log('Email sent:', info.response);
    });

    return response.status(httpStatusCode.BAD_REQUEST).json({message: 'Well received'});
}