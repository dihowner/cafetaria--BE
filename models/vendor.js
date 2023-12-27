import mongoose from 'mongoose';

export const vendorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    isPhysicalStore: {
        type: Boolean,
        default: true,
        required: true
    },
    store_name: {
        type: String,
        required: function () {
            return this.isPhysicalStore === true;
        }
    },
    store_address: {
        type: String,
        required: true
    },
    store_image: {
        type: String,
        default: null
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

vendorSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
})

const Vendors = mongoose.model('Vendors', vendorSchema);

export default Vendors;