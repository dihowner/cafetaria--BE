import Vendors from "../models/vendor.js";

const populateUserData = [{ path: 'user', select: '_id name mobile_number email role' }];

export default class VendorService {
    static model = Vendors;

    static async getOne(filterQuery) {
        const vendor = await this.model.findOne(filterQuery).populate(populateUserData)
        return vendor || null;
    }

    static async updateVendor(vendorId, updateData, filterQuery = 'store_name isPhysicalStore') {
        const updateUser = await this.model.findByIdAndUpdate(vendorId, { $set: updateData }, { new: true, select: filterQuery });
        if(!updateUser) return false;
        return updateUser;
    }

}