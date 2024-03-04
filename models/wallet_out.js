import mongoose from 'mongoose';
import Joi from 'joi';

const walletStatusEnum = ['pending', 'successful', 'cancelled', 'failed'];

export const walletOutSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    old_balance: {
        type: Number,
        default: 0,
        required: true
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    new_balance: {
        type: Number,
        default: 0,
        required: true
    },
    status: {
        type: String,
        enum: walletStatusEnum,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'wallet_out' })

walletOutSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const WalletOut = mongoose.model('WalletOut', walletOutSchema);

export function validateFundingRequest(request) {
    const walletOutSchema = Joi.object({
        amount: Joi.number().required().min(1).messages({
            'any.required':'Amount is required',
            'any.min':'Funding amount must be greater than zero'
        })
    });

    return walletOutSchema.validate(request, {abortEarly: false});
}

export function validateWalletUpdate(updateData) {
    const updateWalletSchema = Joi.object({
        status: Joi.string().required().messages({
            'string.base':'Transaction status must be a string',
            'string.empty':'Transaction status cannot be empty',
            'any.required':'Transaction status is required'
        }),
        tx_channel: Joi.string().messages({
            'string.base':'Transaction channel must be a string',
            'string.empty':'Transaction channel cannot be empty',
            'any.required':'Transaction channel is required'
        }),
        tx_ref: Joi.string().messages({
            'string.base':'Transaction reference must be a string',
            'string.empty':'Transaction reference cannot be empty'
        }),
        transaction_id: Joi.string().messages({
            'string.base':'Transaction reference must be a string',
            'string.empty':'Transaction reference cannot be empty'
        })
    });

    return updateWalletSchema.validate(updateData, {abortEarly: false});
}

export default WalletOut;