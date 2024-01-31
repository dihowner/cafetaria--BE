import mongoose from 'mongoose';

export const rolesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    slug: {
        type: String
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

rolesSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Roles = mongoose.model('Roles', rolesSchema);

export default Roles;