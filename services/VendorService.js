import Vendors from "../models/vendor.js";
import UserService from "./UserService.js";
import WalletService from "./WalletService.js";

const populateUserData = [{ path: 'user', select: '_id name mobile_number email role' }];

export default class VendorService {
    static model = Vendors;

    static async vendorStats(vendorId) {
        const user = await UserService.getOne({_id: vendorId, roles: 'vendor'})
        if (!user) throw new UnAuthorizedError()
        return {
            wallet_balance: await WalletService.getAvailableBalance(vendorId),
            pending_wallet_balance: await WalletService.getEscrowBalance(vendorId),
        //     total_cart: Math.round(102 * Math.random()),
        //     total_order_progress: Math.round(109 * Math.random()),
        //     total_order_received: Math.round(105 * Math.random()),
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