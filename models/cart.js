import mongoose from 'mongoose';

const cartType = ['meal', 'grocery'];

export const cartSchema = new mongoose.Schema({
    cartId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    meal: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Meal'
    },
    submeal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubMeals',
        validate: {
            validator: function(submeal) {
                return !this.isNew || !!submeal;
            },
            message: 'Submeal is required'
        }
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Vendors'
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true,
    },
    packaging: {
        type: Object,
        required: false
    },
    type: {
        type: String,
        enum: cartType,
        default: 'meal',
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

cartSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

const Carts = mongoose.model('Carts', cartSchema);
export default Carts;