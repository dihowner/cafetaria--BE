import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Meal from "../models/meal.js";
import SubMeals from "../models/submeal.js";
import filesystem from 'fs'
import { uploadToCloudinary } from "../utility/util.js";
import { paginate } from "../utility/paginate.js";

const populateVendorData = [{ path: 'vendor', select: '_id store_name' }];

export default class MealService {
    static model = Meal;
    static async createMeal(vendorId, mealProperties) {
        try {
            const {
                name, description, is_available, unit_price, packaging, image
            } = mealProperties;

            const isMealExist = await this.getOne({vendor: vendorId, name: name});
            let imagePath = image.path;
            if (isMealExist) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError(`Meal name (${name}) already exists for vendor`)
            } 

            const uploadLocalCloud = await uploadToCloudinary(imagePath);

            let parsedPackaging = JSON.parse(packaging);
            if (Object.keys(parsedPackaging).length === 0) throw new BadRequestError('The packaging field cannot be an empty object');

            let mealData = new Meal({
                name: name,
                vendor: vendorId,
                description: description,
                isAvailable: is_available,
                unitPrice: unit_price,
                packaging: parsedPackaging,
                image: uploadLocalCloud
            })
            
            const saveMeal = await mealData.save();
            if (!saveMeal) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError('Meal creation failed. Please try again later')
            }
            return {
                message: `Meal (${name}) created successfully`,
                data: {
                    meal_id: saveMeal._id,
                    name: name,
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

    static async deleteMeal(vendorId, mealId) {
        try {
            const isMealExist = await this.getOne({vendor: vendorId, _id: mealId});
            if (!isMealExist) throw new NotFoundError(`Meal with given id (${mealId}) could not be found`)
            await this.model.deleteOne({_id: mealId})
            await SubMeals.deleteMany({meal: mealId})
        }
        catch (error) {
            throw error
        }
    }
    
    static async getMeal(mealId) {
        try {
            const meal = await this.getOne({_id: mealId})
            if (!meal) throw new NotFoundError(`Meal (${mealId}) could not be found`)
            return meal
        }
        catch(error) {
            throw error
        }
    }

    static async updateMeal(mealId, mealProperties) {
        try {
            const {
                name, description, is_available, unit_price, packaging, image
            } = mealProperties;

            const isMealExist = await this.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`Meal with the given id (${mealId}) does not exist`)

            let parsedPackaging = JSON.parse(packaging);
            if (Object.keys(parsedPackaging).length === 0) throw new BadRequestError('The packaging field cannot be an empty object');

            const updateMealData = {
                name: name ?? isMealExist.name, 
                description: description ?? isMealExist.description,  
                isAvailable: is_available ?? isMealExist.isAvailable, 
                packaging: parsedPackaging ?? isMealExist.packaging,  
                unitPrice: unit_price ?? isMealExist.unitPrice, 
            }
            if (image) {
                let imagePath = image.path;
                const uploadLocalCloud = await uploadToCloudinary(imagePath);
                updateMealData.image = uploadLocalCloud
            } else {
                updateMealData.image = isMealExist.image            
            }

            const updateMeal = await this.model.findByIdAndUpdate(mealId, 
                    { $set: updateMealData }, { new: true, select: 'name vendor isAvailable image' }).populate(populateVendorData);
            if (!updateMeal) throw new BadRequestError("Error updating meal. Please try again later")
            return {
                message: "Meal update request was successful",
                data: updateMeal
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async updateAvailability(mealId, isAvailable = false) {
        try {

            const isMealExist = await this.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`Meal with the given id (${mealId}) does not exist`)

            const updateMealData = {
                isAvailable: isAvailable
            }

            const updateMeal = await this.model.findByIdAndUpdate(mealId, 
                    { $set: updateMealData }, { new: true, select: 'name vendor isAvailable image' }).populate(populateVendorData);
            if (!updateMeal) throw new BadRequestError("Error updating meal. Please try again later")
            return {
                message: "Meal update request was successful",
                data: updateMeal
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async getAllMeal(filterOption) {
        try {
            let statusType = filterOption.status;
            const pageOption = {page: filterOption.page};
            
            let allMeals;
            switch (statusType) {
                case "all":
                    allMeals = await paginate( await this.model.find({}).populate(populateVendorData).sort({_id: -1}), pageOption);
                break;
                
                case "available":
                    allMeals = await paginate( await this.model.find({isAvailable: true}).populate(populateVendorData).sort({_id: -1}), pageOption);
                break;
                
                case "unavailable":
                    allMeals = await paginate( await this.model.find({isAvailable: false}).populate(populateVendorData).sort({_id: -1}), pageOption);
                break;

                default:
                    allMeals = await paginate( await this.model.find({}).populate(populateVendorData).sort({_id: -1}), pageOption);
            }
            return allMeals;
        }
        catch(error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const meal = await this.model.findOne(filterQuery).populate(populateVendorData)
        return meal || false;
    }

}