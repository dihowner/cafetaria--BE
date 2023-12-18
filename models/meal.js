import mongoose from 'mongoose';

const mealCategories = ['Meal Pack', 'Others'];
const mealType = ['Meals', 'Groceries'];

export const mealSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vendors'
    },
    mealType: {
        type: String,
        enum: mealType,
        required: true
    },
    mealCategory: {
        type: String,
        enum: mealCategories,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    isAvailable: {
        type: Boolean,
        required: true,
        default: true
    },
    unitPrice: {
        type: Number,
        required: true,
        default: 0
    },
	image: {
		type: String,
        required: true,
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

mealSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;