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
        required: true,
        default: 'user'
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
        }),
        roles: Joi.string().messages({
            'string.base':'Please provide user role',
            'string.any':'Please provide user role'
        })
    });

    return userSchema.validate(request, {abortEarly: false});
}

const checkOldNewPass = (value, helpers) => {
    // const getAllPayload = JSON.stringify(helpers.state.ancestors);
    const getAllPayload = helpers.state.ancestors[0];
    if(value === getAllPayload.new_password) return helpers.error('password.different');

    return true
}

const updatePasswordSchema = Joi.object({
    current_password: Joi.string().required().min(5).custom(checkOldNewPass, 'different').pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
        'string.base':'Current password must be a string',
        'string.empty':'Current password cannot be empty',
        'any.required':'Current password is required',
        'any.forbidden': 'Current password must not be the same with new password'
    }),
    new_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).messages({
        'string.base':'New password must be a string',
        'string.empty':'New password cannot be empty',
        'any.required':'New password is required'
    }),
    confirm_password: Joi.string().required().min(5).pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).valid(Joi.ref('new_password')).messages({
        'string.base':'Confirm password must be a string',
        'string.empty':'Confirm password cannot be empty',
        'any.required':'Confirm password is required',
        'any.only':'Passwords do not match'
    })
});

export function validateLoginUser(request) {
    const userSchema = Joi.object({
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
        roles: Joi.string().valid(...userRoles).required()
    });

    return userSchema.validate(request, {abortEarly: false});
}

export function validateUpdateUser(activity, updateData) {
    let updateSchema;
    switch(activity) {
        case 'update_password':
            updateSchema = updatePasswordSchema;
        break;
    }

    return updateSchema.validate(updateData, {abortEarly: false, messages: {
            'password.different': 'New password must be different from the current password',
        }}
    );
}

export async function hashPassword(password) {
	const salt = await bcrypt.genSalt(10)
	return await bcrypt.hash(password, salt)
}

export async function comparePassword(password, savedHashed) {
    const confirmPassword = await bcrypt.compare(password, savedHashed)
    return confirmPassword;
}


export default User;