import mongoose from 'mongoose';

export const adminSchema = new mongoose.Schema({
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
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Roles'
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

adminSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Admins = mongoose.model('Admins', adminSchema);

export default Admins;