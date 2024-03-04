import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Vendors from "../models/vendor.js";
import UserService from "./UserService.js";
import WalletService from "./WalletService.js";
import Meal from "../models/meal.js";
import Marts from "../models/marts.js";
import { paginate } from "../utility/paginate.js";
import OrderService from "./OrderService.js";

const populateUserData = [{ path: 'user', select: '_id name mobile_number email role is_verified' }];

export default class VendorService {
    static model = Vendors;

    static async vendorStats(vendorId) {
        const vendor = await this.getOne({_id: vendorId})
        if (!vendor) throw new NotFoundError(`Vendor ID (${vendorId}) could not be found`)
        const vendorOrders = await OrderService.vendorOrderStatistics(vendorId);
        return {
            wallet_balance: await WalletService.getVendorAvailableBalance(vendorId),
            pending_wallet_balance: await WalletService.getEscrowBalance(vendorId),
            total_cart: vendorOrders.all_orders,
            total_order_pending: vendorOrders.pending_orders,
            total_order_dispatched: vendorOrders.dispatched_orders,
            total_order_delivered: vendorOrders.delivered_orders
        }
    }

    static async getVendorMeals(vendorId, filterOption) {
        let statusType = filterOption.status;
        const vendor = await this.getOne({_id: vendorId})
        const pageOption = {page: filterOption.page};
        if (!vendor) throw new NotFoundError(`Vendor ID (${vendorId}) could not be found`)
        let vendorMeals;
        switch (statusType) {
            case "all":
                vendorMeals = await paginate(await Meal.find({vendor: vendorId}).sort({_id: -1}), pageOption);
            break;
            
            case "active":
                vendorMeals = await paginate(await Meal.find({vendor: vendorId, isAvailable: true}).sort({_id: -1}), pageOption);
            break;
            
            case "inactive":
                vendorMeals = await paginate(await Meal.find({vendor: vendorId, isAvailable: false}).sort({_id: -1}), pageOption);
            break;
            default:
                vendorMeals = await paginate(await Meal.find({vendor: vendorId}).sort({_id: -1}), pageOption);
        }
        return vendorMeals;
    }

    static async getVendor(user) {
        let userId = user._id
        let vendorId = user.vendor

        const userDetail = await UserService.getOne({_id: userId})

        const retrieveVendor = await this.getOne({_id: vendorId})
        if (!retrieveVendor) throw new NotFoundError(`Vendor (${vendorId}) not found`)
        const vendorData = retrieveVendor.toObject();
        vendorData.bank = userDetail.bank

        const mart = await Marts.findOne({user: userId}).select('_id name address image description');
        const martInfo = mart == null ? false : mart;
        vendorData.mart = martInfo
        return vendorData;
    }

    static async updateBusinessHour(vendorId, businessHoursDays) {
        try {
            if (!businessHoursDays || Object.keys(businessHoursDays).length === 0) throw new BadRequestError('Please provide a valid opening and closing hour for your business')

            const businessHours = {};

            // Iterate through the received object and set opening and closing times for each day
            Object.entries(businessHoursDays).forEach(([day, { openingTime, closingTime }]) => {
                businessHours[day.toLowerCase()] = { openingTime, closingTime };
            });

            const getVendor = await this.getOne({_id: vendorId})
            if (!getVendor) throw new NotFoundError(`Vendor (${vendorId}) could not be found`)

            const updateBusinessData = {
                businessHour: businessHoursDays
            }

            const updateBusiness = await this.model.findByIdAndUpdate(vendorId, 
                { $set: updateBusinessData }, { new: true, select: 'name store_name store_address isPhysicalStore store_image' }).populate(populateUserData);

            return {
                message: 'Business operating hours updated successfully',
                data: updateBusiness
            }

        }
        catch(error) {
            throw error
        }
    }

    static async getAllVendor(filterOption) {
        try {
            let statusType = filterOption.status;
            const pageOption = {page: filterOption.page};
            
            let allVendors , vendors;
            switch (statusType) {
                case "all":
                    allVendors = await paginate( await this.model.find({}).populate(populateUserData).sort({_id: -1}), pageOption);
                break;
                
                case "verified":
                    vendors = await this.model.find({}).populate(populateUserData).sort({_id: -1})
                    allVendors = await paginate(vendors.filter(vendor => vendor.user.is_verified !== "pending"), pageOption);
                break;
                
                case "unverified":
                    vendors = await this.model.find({}).populate(populateUserData).sort({_id: -1})
                    allVendors = await paginate(vendors.filter(vendor => vendor.user.is_verified === "pending"), pageOption);
                break;

                default:
                    allVendors = await paginate( await this.model.find({}).populate(populateUserData).sort({_id: -1}), pageOption);
            }
            return allVendors
        }
        catch(error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const vendor = await this.model.findOne(filterQuery).populate(populateUserData)
        return vendor || false;
    }

    static async updateVendor(vendorId, updateData, filterQuery = 'store_name isPhysicalStore') {
        const updateUser = await this.model.findByIdAndUpdate(vendorId, { $set: updateData }, { new: true, select: filterQuery });
        if(!updateUser) return false;
        return updateUser;
    }

}