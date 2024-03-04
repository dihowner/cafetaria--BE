import mongoose from 'mongoose';
import Joi from 'joi';

const walletStatusEnum = ['pending', 'escrow', 'successful', 'refunded', 'cancelled', 'failed'];

export const walletInSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function() {
            return !this.vendor; // Require user_id if vendor is not provided
        }
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        required: function() {
            return !this.user_id; // Require user_id if vendor is not provided
        }
    },
    reference: {
        type: String,
        required: true
    },
    external_reference: {
        type: String,
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
}, { collection: 'wallet_in' })

walletInSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const WalletIn = mongoose.model('WalletIn', walletInSchema);

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

export default WalletIn;