import mongoose from 'mongoose';

export const subMealSchema = new mongoose.Schema({
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
    unitPrice: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'MealCategories'
    },
    isAvailable: {
        type: Boolean,
        required: true,
        default: true
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

subMealSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const SubMeals = mongoose.model('SubMeals', subMealSchema);

export default SubMeals;