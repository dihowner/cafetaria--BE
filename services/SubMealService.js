import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Meal from "../models/meal.js";
import SubMeals from "../models/submeal.js";
import MealService from "./MealService.js";

const populateMealData = [{ path: 'meal', select: '_id name vendor' }];

export default class SubMealService {
    static model = SubMeals;
    static async createMeal(mealId, mealProperties) {
        try {
            const {
                name, category, is_available, unit_price
            } = mealProperties;

            const isMealExist = await MealService.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`The given meal id (${mealId}) does not exists`)

            const isSubMealExist = await this.getOne({meal: mealId, name: name});
            if (isSubMealExist) throw new BadRequestError(`Sub meal name (${name}) already exists for this meal`)
        
            let mealData = new SubMeals({
                name: name,
                meal: mealId,
                category: category,
                isAvailable: is_available,
                unitPrice: unit_price
            })
            
            const saveMeal = await mealData.save();
            if (!saveMeal) throw new BadRequestError('Meal creation failed. Please try again later')
            
            return {
                message: `Sub Meal (${name}) created successfully`,
                data: {
                    meal_id: saveMeal._id,
                    name: name,
                    category: category,
                    isAvailable: is_available
                }
            }
        }
        catch (error) {
            if (error instanceof NotFoundError) throw new NotFoundError(error.message);
            if (error instanceof BadRequestError) throw new BadRequestError(error.message);
        }
    }

    static async updateMeal(subMealId, mealData) {
        try {
            const {
                name, category, is_available, unit_price
            } = mealData;

            const isMealExist = await this.getOne({_id: subMealId});
            if (!isMealExist) throw new NotFoundError(`The given meal id (${subMealId}) does not exists`)

            const updateMealData = {
                name: name ?? isMealExist.name, 
                category: category ?? isMealExist.category,  
                isAvailable: is_available ?? isMealExist.isAvailable, 
                unitPrice: unit_price ?? isMealExist.unitPrice, 
            }
            const updateMeal = await this.model.findByIdAndUpdate(subMealId, 
                { $set: updateMealData }, { new: true, select: 'name category isAvailable unitPrice' }).populate(populateMealData);
            if (!updateMeal) throw new BadRequestError("Error updating meal. Please try again later")
            return {
                message: "Meal update request was successful",
                data: updateMeal
            }
        }
        catch (error) {
            if (error instanceof NotFoundError) throw new NotFoundError(error.message);
            if (error instanceof BadRequestError) throw new BadRequestError(error.message);
        }
    }

    static async getSubMeal(subMealId) {
        try {
            const subMeal = await this.getOne({_id: subMealId}, true)
            if (!subMeal) throw new NotFoundError(`Sub Meal (${subMealId}) could not be found`)
            return subMeal
        }
        catch(error) {
            if (error instanceof NotFoundError) throw new NotFoundError(error.message);
        }
    }

    static async deleteSubMeal(subMealId) {
        try {
            const isMealExist = await this.getOne({_id: subMealId})
            if (!isMealExist) throw new NotFoundError(`Sub Meal (${subMealId}) could not be found`)
            await this.model.deleteOne({_id: subMealId})
        }
        catch(error) {
            if (error instanceof NotFoundError) throw new NotFoundError(error.message);
        }
    }

    static async getSubMealByMealId(mealId, category = null) {
        try {
            const isMealExist = await MealService.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`The given meal id (${mealId}) does not exists`)
            const modelQuery = {meal: mealId};
            if (category) {
                modelQuery.category = category.trim()
            }

            const subMeals = await this.model.find(modelQuery).sort({name: 1})
            return subMeals
        }
        catch(error) {
            if (error instanceof NotFoundError) throw new NotFoundError(error.message);
        }
    }

    static async getOne(filterQuery, retrieveVendor = false) {
        const subMeal = await this.model.findOne(filterQuery).populate(populateMealData)
        if(retrieveVendor) {
            await Meal.populate(subMeal.meal, { path: 'vendor', select: '_id store_name isPhysicalStore store_address'}) 
        }
        return subMeal || false;
    }

}