import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import Grocery from "../models/grocery.js"
import { paginate } from "../utility/paginate.js";
import { uploadToCloudinary } from "../utility/util.js";
import GroceryCategoryService from "./GroceryCategoryService.js";
import MartService from "./MartService.js";
import filesystem from 'fs'

const populateGrocery_MartData = [{ path: 'mart', select: '_id name' }, {path: 'grocerycategory', select: '_id name'}];
const groceryImageFolder = 'uploads/grocery/';

export default class GroceryService {
    static model = Grocery;
    
    static async createGrocery(userId, groceryProperties) {
        try {
            const {
                name, grocery_category, is_available, unit_price, image
            } = groceryProperties;

            const isMartCreated = await MartService.getOne({user: userId});
            if (!isMartCreated) throw new BadRequestError(`You are yet to create a mart store, kindly create one`)

            let martId = isMartCreated._id;
            
            const isCategoryExist = await GroceryCategoryService.getOne({_id: grocery_category})
            if (!isCategoryExist) throw new NotFoundError(`Grocery category id (${grocery_category}) could not be found`)

            const isGroceryExist = await this.getOne({grocerycategory: grocery_category, name: name});
            
            let imagePath = image.path;
            let categoryName = isCategoryExist.name;
            if (isGroceryExist) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError(`Grocery name (${name}) already exists for category (${categoryName})`)
            } 

            const uploadLocalCloud = await uploadToCloudinary(imagePath, groceryImageFolder);
            let groceryData = new Grocery({
                name: name,
                mart: martId,
                grocerycategory: grocery_category,
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
                name, grocery_category, is_available, unit_price, image
            } = groceryProperties;

            const isGroceryExist = await this.getOne({_id: groceryId});
            if (!isGroceryExist) throw new NotFoundError(`Grocery with the given id (${groceryId}) does not exist`)
            let martId = isGroceryExist.mart._id;
            let martName = isGroceryExist.mart.name;

            const isGroceryCategoryExist = await GroceryCategoryService.getOne({_id: grocery_category})
            if (!isGroceryCategoryExist) throw new NotFoundError(`Grocery category id (${grocery_category}) could not be found`)

            let categoryName = isGroceryCategoryExist.name

            const isGroceryNameExist = await this.getOne({_id: {$ne: groceryId}, grocerycategory: grocery_category, name: name});
            if (isGroceryNameExist) throw new BadRequestError(`Grocery (${name}) already exists for category (${categoryName})`)

            const updateGroceryData = {
                name: name ?? isGroceryExist.name, 
                grocerycategory: grocery_category ?? isGroceryExist.grocerycategory,  
                isAvailable: is_available ?? isGroceryExist.isAvailable, 
                unitPrice: unit_price ?? isGroceryExist.unitPrice, 
            }

            if (image) {
                let imagePath = image.path;
                const uploadLocalCloud = await uploadToCloudinary(imagePath, groceryImageFolder);
                updateGroceryData.image = uploadLocalCloud
            } else {
                updateGroceryData.image = isGroceryExist.image            
            }
            const updateGrocery = await this.model.findByIdAndUpdate(groceryId, 
                { $set: updateGroceryData }, { new: true, select: 'name mart isAvailable image' }).populate(populateGrocery_MartData);
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

            const updateGrocery = await this.model.findByIdAndUpdate(groceryId, 
                { 
                    $set: {
                        isAvailable: isAvailable
                    }
                }, { new: true, select: 'name mart isAvailable image' }).populate(populateGrocery_MartData);
            if (!updateGrocery) throw new BadRequestError("Error updating grocery. Please try again later")
            return {
                message: "Grocery availability update request was successful",
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

    static async getAllGrocery(filterOption) {
        try {
            let statusType = filterOption.status;
            const pageOption = {page: filterOption.page};

            let allGrocery;
            switch (statusType) {
                case "all":
                    allGrocery = await paginate( await this.model.find({}).populate(populateGrocery_MartData).sort({_id: -1}), pageOption);
                break;
                
                case "available":
                    allGrocery = await paginate( await this.model.find({ isAvailable: true }).populate(populateGrocery_MartData).sort({_id: -1}), pageOption);
                break;
                
                case "unavailable":
                    allGrocery = await paginate( await this.model.find({isAvailable: false}).populate(populateGrocery_MartData).sort({_id: -1}), pageOption);
                break;

                default:
                    allGrocery = await paginate( await this.model.find({}).populate(populateGrocery_MartData).sort({_id: -1}), pageOption);
            }
            return allGrocery
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
        const grocery = await this.model.findOne(filterQuery).populate(populateGrocery_MartData)
        return grocery || false;
    }
}