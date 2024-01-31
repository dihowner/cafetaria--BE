import mongoose from 'mongoose';

export const grocerySchema = new mongoose.Schema({
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
    grocerycategory: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'GroceryCategories'
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

grocerySchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Grocery = mongoose.model('Grocery', grocerySchema);

export default Grocery;