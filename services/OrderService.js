import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Orders from "../models/orders.js";
import { paginate } from "../utility/paginate.js";

const populateUserVendorData = [{ path: 'vendor', select: '_id store_name' }, { path: 'user', select: '_id name email mobile_number' }];
const populateVendorData = [{ path: 'vendor', select: '_id store_name' }];

const PENDING_STATUS = 'Pending';
const DISPATCHING_STATUS = 'Dispatching';
const DELIVERED_STATUS = 'Delivered';

export default class OrderService {
    static model = Orders;

    static async userOrderStatistics(userId) {
        const allOrders = await this.model.countDocuments({ user: userId });
        const deliveredOrders = await this.model.countDocuments({ user: userId, deliveryStatus: DELIVERED_STATUS });

        return {
            all_orders: allOrders,
            pending_orders: parseInt(allOrders) - parseInt(deliveredOrders),
            delivered_orders: deliveredOrders
        }
    }

    static async vendorOrderStatistics(vendorId) {
        const allOrders = await this.model.countDocuments({ vendor: vendorId });
        const pendingOrders = await this.model.countDocuments({ vendor: vendorId, deliveryStatus: PENDING_STATUS });
        const dispatchedOrders = await this.model.countDocuments({ vendor: vendorId, deliveryStatus: DISPATCHING_STATUS });
        const deliveredOrders = await this.model.countDocuments({ vendor: vendorId, deliveryStatus: DELIVERED_STATUS });

        return {
            all_orders: allOrders,
            pending_orders: pendingOrders,
            dispatched_orders: dispatchedOrders,
            delivered_orders: deliveredOrders
        }
    }

    static async orderHistories(userId, filterOption) {
        try {
            const pageOption = {page: filterOption.page};
            let userOrders;
            switch (statusType) {
                case "all":
                    userOrders = await paginate(await this.model.find({user: userId}).select('orderId total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateVendorData).sort({_id: -1}), pageOption)
                break;
                case "pending":
                    userOrders = await paginate(await this.model.find({user: userId, deliveryStatus: PENDING_STATUS})
                                    .select('orderId total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateVendorData).sort({_id: -1}), pageOption)
                break;
                case "dispatched":
                    userOrders = await paginate(await this.model.find({user: userId, deliveryStatus: DISPATCHING_STATUS})
                                    .select('orderId total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateVendorData).sort({_id: -1}), pageOption)
                break;
                case "delivered":
                    userOrders = await paginate(await this.model.find({user: userId, deliveryStatus: DELIVERED_STATUS})
                                    .select('orderId total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateVendorData).sort({_id: -1}), pageOption)
                break;
                case "all":
                    userOrders = await paginate(await this.model.find({user: userId, }).select('orderId total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateVendorData).sort({_id: -1}), pageOption)
                break;
            }
        }
        catch(error) {
            throw error
        }
    }

    static async usersOrderHistories(filterOption) {
        try {
            const statusType = filterOption.type
            const pageOption = {page: filterOption.page};
            let userOrders;
            switch (statusType) {
                case "all":
                    userOrders = await paginate(await this.model.find({}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "pending":
                    userOrders = await paginate(await this.model.find({deliveryStatus: PENDING_STATUS}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "dispatched":
                    userOrders = await paginate(await this.model.find({deliveryStatus: DISPATCHING_STATUS}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "delivered":
                    userOrders = await paginate(await this.model.find({deliveryStatus: DELIVERED_STATUS}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                default:
                    userOrders = await paginate(await this.model.find({}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
            }
            return userOrders
        }
        catch(error) {
            throw error
        }
    }

    static async vendorOrderHistories(vendorId, filterOption) {
        try {
            const statusType = filterOption.type
            const pageOption = {page: filterOption.page};
            let userOrders;
            
            switch (statusType) {
                case "all":
                    userOrders = await paginate(await this.model.find({vendor: vendorId}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "pending":
                    userOrders = await paginate(await this.model.find({vendor: vendorId, deliveryStatus: PENDING_STATUS})
                                    .select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "dispatched":
                    userOrders = await paginate(await this.model.find({vendor: vendorId, deliveryStatus: DISPATCHING_STATUS})
                                    .select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                case "delivered":
                    userOrders = await paginate(await this.model.find({vendor: vendorId, deliveryStatus: DELIVERED_STATUS})
                                    .select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
                break;
                default:
                    userOrders = await paginate(await this.model.find({vendor: vendorId}).select('orderId user total deliveryStatus paymentStatus created_at updated_at')
                                    .populate(populateUserVendorData).sort({_id: -1}), pageOption)
            }
            return userOrders
        }
        catch(error) {
            throw error
        }
    }

    static async viewOrder(id) {
        try {
            const order = await this.getOne({_id: id}, true)
            if (!order) throw new NotFoundError(`Order id (${id}) could not be found`)
            return order
        }
        catch(error) {
            throw error
        }
    }
        
    static async getOne(filterQuery, populateUserVendor = false) {
        const cart = populateUserVendor === false ? await this.model.findOne(filterQuery) :  await this.model.findOne(filterQuery).populate(populateUserVendorData)
        return cart || false;
    }
}