import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import MealCategory from "../models/mealcategory.js";
import SubMeals from "../models/submeal.js";
import MealService from "./MealService.js";

const populateMealData = [{ path: 'meal', select: '_id name' }];

export default class MealCategoryService {
    static model = MealCategory;
    static async createCategory(mealId, categoryName) {
        try {           

            const isMealExist = await MealService.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`The given meal id (${mealId}) does not exists`)

            const isExist = await this.getOne({name: categoryName});
            if (isExist) throw new BadRequestError(`Category (${categoryName}) already exists for this Meal (${isMealExist.name})`)

            let categoryData = new MealCategory({
                meal: mealId,
                name: categoryName
            })

            const createCategory = await categoryData.save();
            return {
                message: 'Category created successfully',
                data: createCategory
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async updateCategory(categoryId, categoryName) {
        try {
            const isCategoryExist = await this.getOne({_id: categoryId});
            if (!isCategoryExist) throw new NotFoundError(`The given category id (${categoryId}) does not exists`)

            const mealId = isCategoryExist.meal._id;
            const mealName = isCategoryExist.meal.name;
            const isExist = await this.getOne({meal: mealId, name: categoryName});
            if (isExist) throw new BadRequestError(`Category (${categoryName}) already exists for this meal (${mealName})`)

            const updateMealData = {
                name: categoryName
            }

            const updateCategory = await this.model.findByIdAndUpdate(categoryId, { $set: updateMealData }, { new: true });
            if (!updateCategory) throw new BadRequestError("Error updating category. Please try again later")
            return {
                message: "Category update request was successful",
                data: updateCategory
            }
        }
        catch (error) {
            throw error;
        }
    }

    static async deleteCategory(categoryId) {
        try {
            const isExist = await this.getOne({_id: categoryId})
            if (!isExist) throw new NotFoundError(`Category (${categoryId}) could not be found`)
            await this.model.deleteOne({_id: categoryId})
        }
        catch(error) {
            throw error;
        }
    }

    static async getMealCategories(mealId, isVendor = true) {
        try {
            const isMealExist = await MealService.getOne({_id: mealId});
            if (!isMealExist) throw new NotFoundError(`The given meal id (${mealId}) does not exists`)
            const categories = await this.model.find({meal: mealId}).sort({name: 1})
            const getSubMealCategories = await SubMeals.find({meal: mealId, isAvailable: true})

            if (isVendor) {
                return categories.map((category) => ({    
                    _id: category._id,
                    name: category.name,
                    submeals:  getSubMealCategories.filter((subMeal) => subMeal.category.equals(category._id))         
                }));
            } else {
                // Filter out categories without submeals
                const categoriesWithSubmeals = categories.filter(category =>
                    getSubMealCategories.some(subMeal => subMeal.category.equals(category._id))
                );

                return categoriesWithSubmeals.map((category) => ({
                    _id: category._id,
                    name: category.name,
                    submeals: getSubMealCategories.filter((subMeal) => subMeal.category.equals(category._id)),
                }));
            }

        }
        catch(error) {
            throw error
        }
    }

    static async getCategory(categoryId) {
        try {
            const isExist = await this.getOne({_id: categoryId})
            if (!isExist) throw new NotFoundError(`The given category id (${categoryId}) does not exists`)
            return isExist
        }
        catch(error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const category = await this.model.findOne(filterQuery).populate(populateMealData)
        return category || false;
    }

}