import mongoose from 'mongoose';

const withdrawalStatusEnum = ['pending', 'successful', 'refunded', 'cancelled', 'failed'];

export const withdrawalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        minlength: 3
    },
    wallet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletOut',
        required: true
    },
    bank: {
        type: Object,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    external_reference: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0,
        required: true
    },
    status: {
        type: String,
        enum: withdrawalStatusEnum,
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
}, { collection: 'withdrawals' })

withdrawalSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Withdrawals = mongoose.model('Withdrawals', withdrawalSchema);

export default Withdrawals;