import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Joi from 'joi';

const userRoles = ['user', 'vendor', 'admin'];

export const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    mobile_number: {
        type: Number,
        required: true
    },
    roles: {
        type: String,
        enum: userRoles,
        required: true
    }
})

const User = mongoose.model('User', userSchema);

export function validateCreateUser(request) {
    const userSchema = Joi.object({
        name: Joi.string().required().messages({
            'string.base':'Name must be a string',
            'string.empty':'Name cannot be empty',
            'any.required':'Name is required'
        }),
        email: Joi.string().required().messages({
            'string.base':'Email address must be a string',
            'string.empty':'Email address cannot be empty',
            'any.required':'Email address is required'
        }),
        password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
            'string.base':'Password must be a string',
            'string.empty':'Password cannot be empty',
            'any.required':'Password is required'
        }),
        mobile_number: Joi.string().required().min(11).max(13).messages({
            'string.base':'Mobile number must be a number',
            'any.required':'Mobile number is required',
            'string.min':'Mobile number must be 11 digits',
            'string.max':'Mobile number cannot exceeds 13 digits'
        })
    });

    return userSchema.validate(request, {abortEarly: false});
}

export async function hashPassword(password) {
	const salt = await bcrypt.genSalt(10)
	return await bcrypt.hash(password, salt)
}

export default User;