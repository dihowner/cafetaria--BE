import User, {validateCreateUser, hashPassword} from "../models/user.js";
import reformNumber from "../utility/number.js"

export const createUser = async (request, response) => {
    let payload = request.body;
    const validatePayload = validateCreateUser(payload);
    if (validatePayload.error) return response.status(400).json({message: validatePayload.error.details[0].message});

    let emailAddress = request.body.email;
    const isEmailExist = await User.findOne({email: emailAddress })
    if(isEmailExist) return response.status(400).json({message: `Email (${emailAddress}) already associated to a user`})

    let clientNumber = reformNumber(payload.mobile_number);

    if(clientNumber === false) return response.status(400).json({message: `Mobile number (${payload.mobile_number}) provided is invalid. Mobile number should start with leading zero (0) or 234`})

    let userData = new User({
        name: payload.name,
        email: payload.email,
        password: await hashPassword(payload.password),
        mobile_number: reformNumber(payload.mobile_number),
        roles: payload.roles == undefined ? 'user' : payload.roles
    })
    
    try {
        const createUser = await userData.save();
        return response.status(200).json({message: "User created successfully", data: createUser})
    }
    catch(error) {
        return response.status(500).json({message: error.message});
    }

};