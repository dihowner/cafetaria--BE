import mongoose from 'mongoose';

export const martCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    mart: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Marts'
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

martCategorySchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const MartCategories = mongoose.model('MartCategories', martCategorySchema);

export default MartCategories;