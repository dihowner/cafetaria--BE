import mongoose from 'mongoose';
import Joi from 'joi';

const resetPassStatus = ['new', 'used', 'expired'];

export const resetPasswordSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: resetPassStatus,
        required: true,
        default: 'new'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'reset_password' })

resetPasswordSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const ResetPassword = mongoose.model('ResetPassword', resetPasswordSchema);

export function validatePasswordReset(request) {
    const PasswordResetSchema = Joi.object({
        email: Joi.string().required().messages({
            'string.base':'Email address must be a string',
            'string.empty':'Email address cannot be empty',
            'any.required':'Email address is required'
        })
    });

    return PasswordResetSchema.validate(request, {abortEarly: false});
}

export function validateVerifyReset(request) {
    const VerifyResetSchema = Joi.object({
        token: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
            'string.base':'Verification token must be a string',
            'any.required':'Verification token is required',
            'string.length':'Verification token must be 6 digits',
            'string.pattern.base':'Only numeric digit is allowed'
        })
    });

    return VerifyResetSchema.validate(request, {abortEarly: false});
}

export default ResetPassword;