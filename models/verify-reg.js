import mongoose from 'mongoose';

const regStatus = ['new', 'used'];

export const verifyRegSchema = new mongoose.Schema({
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
        enum: regStatus,
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
}, { collection: 'verify_reg' })

verifyRegSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const VerifyRegistration = mongoose.model('VerifyRegistration', verifyRegSchema);

export default VerifyRegistration;