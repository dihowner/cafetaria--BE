import mongoose from 'mongoose';

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

export default ResetPassword;