import jwt from "jsonwebtoken";
import { config } from "../utility/config.js"
import Admins from "../models/admin.js";
import Roles from "../models/roles.js";
import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";

const populateRoleData = [{ path: 'roles', select: '_id name slug' }]

export default class AdminService {
    static model = Admins;
    static async generateAuthToken(admin) {
        return jwt.sign({
                _id: admin._id,
                role: 'admin',
            },
            config.JWT_SECRET, { expiresIn: "24h" }
        );
    }

    static async getOne(filterQuery) {
        const admin = await this.model.findOne(filterQuery).populate(populateRoleData)
        return admin || false;
    }

    static async updateAdmin(userId, updateData, filterQuery = 'name email') {
        const updateAdmin = await this.model.findByIdAndUpdate(userId, { $set: updateData }, { new: true, select: filterQuery });
        if(!updateAdmin) return false;
        return updateAdmin;
    }

}