import mongoose from 'mongoose';

const userRoles = ['user', 'vendor', 'admin'];
const regStatus = ['pending', 'activated', 'suspended'];

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
    },
    transact_pin: {
        type: String,
        default: '000000',
        required: function () {
            return this.roles === 'vendor';
        }
    },
    bank: {
        type: Object,
        required: false
    },
    is_verified: {
        type: String,
        enum: regStatus,
        required: true,
        default: 'pending'
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

userSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const User = mongoose.model('User', userSchema);

export default User;