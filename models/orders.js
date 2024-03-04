import mongoose from 'mongoose';

const deliveryStatus = ['Pending', 'Accepted', 'Dispatching', 'Delivered', 'Cancelled'];
const paymentStatus = ['Paid', 'Unpaid']; //though payment is made first before adding it as a new order but for future sake, I consider it down...

const orderDetailSchema = new mongoose.Schema({
    meal: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Meals', required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        packaging: {
            type: { type: String, enum: ['empty', 'styrofoam', 'plastic_plate'], default: 'empty' },
            quantity: { type: Number }
        }
    },
    submeals: [{
        _id: { type: mongoose.Schema.Types.ObjectId },
        cartId: { type: String },
        name: { type: String },
        meal: { type: mongoose.Schema.Types.ObjectId, ref: 'Meals' },
        submeal: { type: mongoose.Schema.Types.ObjectId, ref: 'Submeals' },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendors' },
        quantity: { type: Number },
        price: { type: Number },
        type: { type: String },
        created_at: { type: Date },
        updated_at: { type: Date }
    }]  
})

export const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendors',
        required: true
    },
    orderDetail: [ orderDetailSchema ],
    subTotal: {
        type: Number,
        default: 0
    },
    serviceCharge: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    deliveryStatus: {
        type: String,
        enum: deliveryStatus,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: paymentStatus,
        default: 'Unpaid',
        required: true
    },
    deliveryInformation: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
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

orderSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updated_at: new Date() });
    next();
});

const Orders = mongoose.model('Orders', orderSchema);
export default Orders;