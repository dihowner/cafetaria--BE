import mongoose from 'mongoose';

export const MealCategorySchema = new mongoose.Schema({
    meal: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Meal'
    },
    name: {
        type: String,
        required: true,
        minlength: 3
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

MealCategorySchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const MealCategories = mongoose.model('MealCategories', MealCategorySchema);

export default MealCategories;