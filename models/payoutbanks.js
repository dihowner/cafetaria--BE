import mongoose from 'mongoose';

const bankStatus = ['0', '1'];
export const payoutbankSchema = new mongoose.Schema({
    bank_name: {
        type: String,
        required: true
    },
    bank_code: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: bankStatus
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
})

payoutbankSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const PayoutBank = mongoose.model('PayoutBank', payoutbankSchema);
export default PayoutBank;