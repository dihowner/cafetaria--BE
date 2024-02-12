import Roles from "../models/roles.js";
import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import { cleanSpaceLowercase } from "../utility/util.js";
import Admins from "../models/admin.js";

export default class RolesService {
    static model = Roles;

    static async createRole(rolename) {
        try {
            const isRoleExist = await this.getOne({name: rolename})
            if (isRoleExist) throw new BadRequestError(`Role (${rolename}) already exists`)
            let roleData = new Roles({ name: rolename, slug: cleanSpaceLowercase(rolename) })
            const addRole = await roleData.save();
            if (!addRole) throw new BadRequestError('Error adding role')
            return {
                message: `Role (${rolename}) created successfully`,
                data: addRole
            } 
        }
        catch(error) {
            throw error
        }
    }

    static async updateRole(roleId, rolename) {
        try {
            const isRoleExist = await this.getOne({_id: {$ne: roleId}, name: rolename})
            if (isRoleExist) throw new BadRequestError(`Role (${rolename}) already exists`)
            let updateData = { name: rolename, slug: cleanSpaceLowercase(rolename) }
            const updateRole = await this.model.findByIdAndUpdate(roleId, { $set: updateData }, { new: true });
            if (!updateRole) throw new BadRequestError('Error updating role')
            return {
                message: `Role (${rolename}) updated successfully`,
                data: updateRole
            } 
        }
        catch(error) {
            throw error
        }
    }

    static async getRole(roleId) {
        try {
            const role = await this.getOne({_id: roleId})
            if (!role) throw new NotFoundError(`Role with the given id (${id}) does not exists`)
            return role
        }
        catch(error) {
            throw error
        }
    }

    static async getRoles() {
        try {
            const role = await this.model.find({}).sort({_id: -1})
            return role
        }
        catch(error) {
            throw error
        }
    }

    static async deleteRole(roleId) {
        try {
            const role = await this.getOne({_id: roleId});
            if (!role) throw new NotFoundError(`Role with given id (${roleId}) could not be found`)
            const totalAssignedAdminWithRole = await Admins.countDocuments({roles: roleId})

            if (totalAssignedAdminWithRole > 0) throw new BadRequestError(`Role (${role.name}) already assigned to an Admin`)
            await this.model.deleteOne({_id: roleId})
        }
        catch(error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const admin = await this.model.findOne(filterQuery)
        return admin || false;
    }
}