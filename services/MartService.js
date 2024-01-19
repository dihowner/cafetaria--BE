import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import Marts from '../models/marts.js'
import UserService from "./UserService.js";
import filesystem from 'fs'
import { reformUploadPath } from "../utility/util.js";

const populateUserData = [{ path: 'user', select: '_id name email' }];

export default class MartService {
    static model = Marts;
    
    static async createMart(userId, martProperties) {
        try {
            const {
                name, description, address, image
            } = martProperties;

            const user = await UserService.getOne({_id: userId, 'roles': 'vendor'})
            if (!user) throw new UnAuthorizedError()

            const isMartExist = await this.getOne({user: userId})
            let imagePath = image.path;
            if (isMartExist) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError('You already have an existing mart already')
            } 

            let martData = new Marts({
                user: userId,
                name: name,
                description: description,
                address: address,
                image: reformUploadPath(imagePath)
            })
            const createMart = await martData.save();
            if (!createMart) throw new BadRequestError('Error creating mart')
            return {
                message: `Mart (${name}) created successfully`,
                data: {
                    id: createMart._id,
                    name: name
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    
    static async updateMart(martId, martProperties) {
        try {
            const {
                name, description, address, image
            } = martProperties;

            const isMartExist = await this.getOne({_id: martId});
            if (!isMartExist) throw new NotFoundError(`Mart with the given id (${martId}) does not exist`)

            const isMartNameExist = await this.getOne({user: {$ne: isMartExist.user}, name: name});
            if (isMartNameExist) throw new BadRequestError(`Mart (${name}) already exists`)

            const updateMartData = {
                name: name ?? isMartExist.name, 
                description: description ?? isMartExist.description,  
                address: address ?? isMartExist.address
            }

            if (image) {
                let imagePath = reformUploadPath(image.path);
                updateMartData.image = imagePath
            } else {
                updateMartData.image = isMartExist.image            
            }

            const updateMart = await this.model.findByIdAndUpdate(martId, 
                    { $set: updateMartData }, { new: true, select: 'name address' }).populate(populateUserData);
            if (!updateMart) throw new BadRequestError("Error updating mart. Please try again later")
            return {
                message: "Mart update request was successful",
                data: updateMart
            }
        }
        catch (error) {
            throw error;
        }
    }
    
    static async getMart(martId) {
        try {
            const getMart = await this.getOne({_id: martId})
            if (!getMart) throw new NotFoundError(`Mart with the given id (${martId}) does not exist`)
            return getMart
        }
        catch (error) {
            throw error;
        }
    }

    static async getOne(filterQuery) {
        const meal = await this.model.findOne(filterQuery).populate(populateUserData)
        return meal || false;
    }

}