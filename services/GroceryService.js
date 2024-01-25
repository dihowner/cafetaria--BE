import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";;
import Grocery from "../models/grocery.js"
import filesystem from 'fs'
import MartService from "./MartService.js";
import MartCategoryService from "./MartCategoryService.js";
import { uploadToCloudinary } from "../utility/util.js";

const populateMartData = [{ path: 'mart', select: '_id name' }, {path: 'martcategory', select: '_id name'}];
const groceryImageFolder = 'uploads/grocery/';

export default class GroceryService {
    static model = Grocery;
    static async createGrocery(userId, groceryProperties) {
        try {

            const {
                name, martcategory, is_available, unit_price, image
            } = groceryProperties;
            
            const isMartCreated = await MartService.getOne({user: userId});
            if (!isMartCreated) throw new BadRequestError(`You are yet to create a mart store, kindly create one`)

            let martId = isMartCreated._id;

            const isMartCategoryExist = await MartCategoryService.getOne({_id: martcategory, mart: martId})
            if (!isMartCategoryExist) throw new NotFoundError(`Mart category id (${martcategory}) could not be found for your mart (${isMartCreated.name})`)

            const isGroceryExist = await this.getOne({martcategory: martcategory, name: name});
            let imagePath = image.path;
            let categoryName = isMartCategoryExist.name;
            if (isGroceryExist) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError(`Grocery name (${name}) already exists for mart category (${categoryName})`)
            } 
            
            const uploadLocalCloud = await uploadToCloudinary(imagePath, groceryImageFolder);

            let groceryData = new Grocery({
                name: name,
                mart: martId,
                martcategory: martcategory,
                isAvailable: is_available,
                unitPrice: unit_price,
                image: uploadLocalCloud
            })
            
            const saveGrocery = await groceryData.save();
            if (!saveGrocery) throw new BadRequestError('Grocery creation failed. Please try again later')
            
            return {
                message: `Grocery (${name}) created successfully`,
                data: {
                    grocery_id: saveGrocery._id,
                    name: name,
                    category: categoryName,
                    isAvailable: is_available,
                    unitPrice: unit_price,
                    image_path: uploadLocalCloud
                }
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async updateGrocery(groceryId, groceryProperties) {
        try {

            const {
                name, martcategory, is_available, unit_price, image
            } = groceryProperties;

            const isGroceryExist = await this.getOne({_id: groceryId});
            if (!isGroceryExist) throw new NotFoundError(`Grocery with the given id (${groceryId}) does not exist`)
            
            let martId = isGroceryExist.mart._id;
            let martName = isGroceryExist.mart.name;

            // return {_id: martcategory, mart: martId};

            const isMartCategoryExist = await MartCategoryService.getOne({_id: martcategory, mart: martId})
            if (!isMartCategoryExist) throw new NotFoundError(`Mart category id (${martcategory}) could not be found for your mart (${martName})`)

            let categoryName = isMartCategoryExist.name

            const isGroceryNameExist = await this.getOne({_id: {$ne: groceryId}, martcategory: martcategory, name: name});
            if (isGroceryNameExist) throw new BadRequestError(`Grocery (${name}) already exists for category (${categoryName})`)
            
            const updateGroceryData = {
                name: name ?? isGroceryExist.name, 
                martcategory: martcategory ?? isGroceryExist.martcategory,  
                isAvailable: is_available ?? isGroceryExist.isAvailable, 
                unitPrice: unit_price ?? isGroceryExist.unitPrice, 
            }
            if (image) {
                let imagePath = image.path;
                const uploadLocalCloud = await uploadToCloudinary(imagePath, martImageFolder);
                updateGroceryData.image = uploadLocalCloud
            } else {
                updateGroceryData.image = isGroceryExist.image            
            }

            const updateGrocery = await this.model.findByIdAndUpdate(groceryId, 
                    { $set: updateGroceryData }, { new: true, select: 'name mart isAvailable image' }).populate(populateMartData);
            if (!updateGrocery) throw new BadRequestError("Error updating grocery. Please try again later")
            return {
                message: "Grocery update request was successful",
                data: updateGrocery
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async updateAvailability(groceryId, isAvailable = false) {
        try {

            const isGroceryExist = await this.getOne({_id: groceryId});
            if (!isGroceryExist) throw new NotFoundError(`Grocery with the given id (${groceryId}) does not exist`)

            const updateGroceryData = {
                isAvailable: isAvailable
            }

            const updateGrocery = await this.model.findByIdAndUpdate(groceryId, 
                    { $set: updateGroceryData }, { new: true, select: 'name mart isAvailable image' }).populate(populateMartData);
            if (!updateGrocery) throw new BadRequestError("Error updating grocery. Please try again later")
            return {
                message: "Grocery update request was successful",
                data: updateGrocery
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async getGrocery(groceryId) {
        try {
            const grocery = await this.getOne({_id: groceryId});
            
            if (!grocery) throw new NotFoundError(`Grocery (${groceryId}) could not be found`)
            return grocery
        }
        catch (error) {
            throw error;
        }
    }

    static async getAllGrocery() {
        try {
            const grocery = await this.model.find({});
            return grocery
        }
        catch (error) {
            throw error;
        }
    }

    static async deleteGrocery(userId, groceryId) {
        try {
            
            const isMartCreated = await MartService.getOne({user: userId});
            if (!isMartCreated) throw new BadRequestError(`You do not have a mart store, kindly create one`)

            let martId = isMartCreated._id;

            const isGroceryExist = await this.getOne({_id: groceryId, mart: martId});
            if (!isGroceryExist) throw new NotFoundError(`Grocery with given id (${groceryId}) could not be found`)
            await this.model.deleteOne({_id: groceryId})
        }
        catch (error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const grocery = await this.model.findOne(filterQuery).populate(populateMartData)
        return grocery || false;
    }

}