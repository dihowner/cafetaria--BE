import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Meal from "../models/meal.js";
import filesystem from 'fs'


const populateVendorData = [{ path: 'vendor', select: '_id store_name' }];

export default class MealService {
    static model = Meal;
    static async createMeal(vendorId, mealProperties) {
        try {
            const {
                name, meal_type, description, meal_category, is_available, unit_price, image
            } = mealProperties;

            const isMealExist = await this.getOne({vendor: vendorId, name: name});
            if (isMealExist) {
                // Remove the image ASAP....
                filesystem.unlinkSync(imagePath)
                throw new BadRequestError(`Meal name (${name}) already exists for vendor`)
            } 
            let imagePath = image.path;
            let mealData = new Meal({
                name: name,
                vendor: vendorId,
                mealType: meal_type,
                description: description,
                mealCategory: meal_category,
                isAvailable: is_available,
                unitPrice: unit_price,
                image: imagePath
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
                    mealType: meal_type,
                    mealCategory: meal_category,
                    isAvailable: is_available,
                    unitPrice: unit_price,
                    image_path: imagePath
                }
            }
        }
        catch (error) {
            throw new BadRequestError(error.message);
        }
    }

    static async deleteMeal(vendorId, mealId) {
        try {
            const isMealExist = await this.getOne({vendor: vendorId, _id: mealId});
            if (!isMealExist) throw new NotFoundError(`Meal with given id (${mealId}) could not be found`)
            await Meal.deleteOne({_id: mealId})
        }
        catch (error) {
            throw new BadRequestError(error.message);
        }
    }
    
    static async getMeal(mealId) {
        try {
            const meal = await this.getOne({_id: mealId})
            if (!meal) throw new NotFoundError('Meal could not be found')
            return meal
        }
        catch(error) {
            throw new BadRequestError(error.message);
        }
    }

    static async updateMeal(mealId, mealProperties) {
        try {
            const {
                name, meal_type, description, meal_category, is_available, unit_price, image
            } = mealProperties;

            const isMealExist = await this.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`Meal with the given id (${mealId}) does not exist`)

            const updateMealData = {
                name: name ?? isMealExist.name, 
                mealType: meal_type ?? isMealExist.mealType,
                mealCategory: meal_category ?? isMealExist.mealCategory,  
                description: description ?? isMealExist.description,  
                isAvailable: is_available ?? isMealExist.isAvailable,  
                unitPrice: unit_price ?? isMealExist.unitPrice, 
            }
            if (image) {
                let imagePath = image.path;
                updateMealData.image = imagePath
            } else {
                updateMealData.image = isMealExist.image            
            }

            const updateMeal = await this.model.findByIdAndUpdate(mealId, 
                    { $set: updateMealData }, { new: true, select: 'name vendor mealType mealCategory isAvailable image' }).populate(populateVendorData);
            if (!updateMeal) throw new BadRequestError("Error updating meal. Please try again later")
            return {
                message: "Meal update request was successful",
                data: updateMeal
            }
        }
        catch (error) {
            throw new BadRequestError(error.message);
        }
    }

    static async getOne(filterQuery) {
        const user = await this.model.findOne(filterQuery).populate(populateVendorData)
        return user || null;
    }

}