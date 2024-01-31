import mongoose from 'mongoose';

export const groceryCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Admins'
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

groceryCategorySchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const GroceryCategories = mongoose.model('GroceryCategories', groceryCategorySchema);

export default GroceryCategories;