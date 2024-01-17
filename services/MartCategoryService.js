import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import Grocery from "../models/grocery.js";
import MartCategories from "../models/mart_category.js";
import MartService from "./MartService.js";

const populateMartData = [{ path: 'mart', select: '_id name user' }];

export default class MartCategoryService {
    static model = MartCategories;
    
    static async createCategory(userId, martId, categoryName) {
        try {
            const isMartExist = await MartService.getOne({_id: martId})
            if (!isMartExist) throw new NotFoundError(`Mart (${martId}) does not exists`)
            if (isMartExist.user._id != userId) throw new UnAuthorizedError(`You are not authorized to create a category for this mart (${isMartExist.name})`)
            
            const isCategoryExist = await this.getOne({mart: martId, name: categoryName})
            if (isCategoryExist) throw new BadRequestError(`Category (${categoryName}) already exists`)
            
            let categoryData = new MartCategories({name: categoryName, mart: martId})
            const createCategory = await categoryData.save();

            if (!createCategory) throw new BadRequestError('Error creating category')

            return {
                message: 'Category added successfully',
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
            if (!isCategoryExist) throw new NotFoundError(`Mart category id (${categoryId}) could not be found`)
            
            const martId = isCategoryExist.mart._id;
            const isCategoryNameExist = await this.getOne({mart: martId, name: categoryName})
            if (isCategoryNameExist) throw new BadRequestError(`Category name (${categoryName}) already exists for your mart (${isCategoryExist.mart.name})`)

            const updateCategory = await this.model.findByIdAndUpdate(categoryId, 
                { $set: {name: categoryName} }, { new: true }).populate(populateMartData);
            if (!updateCategory) throw new BadRequestError("Error updating category. Please try again later")
            return {
                message: "Mart category update request was successful",
                data: updateCategory
            }
        }
        catch (error) {
            throw error;
        }   
    }

    static async getMartCategories(martId) {
        try {
            const mart = await MartService.getOne({_id: martId})
            if (!mart) throw new NotFoundError(`Mart (${martId}) could not be found`)
            
            const categories = await MartCategories.find({mart: martId}).sort({name: 1})
            return categories
        }
        catch (error) {
            throw error;
        }   
    }

    static async deleteCategory(userId, categoryId) {
        try {
            const category = await this.getOne({_id: categoryId})
            if (!category) throw new NotFoundError(`Category (${categoryId}) could not be found`)
            
            if (category.mart.user._id != userId) throw new UnAuthorizedError(`You are not authorized to delete resource`)

            await this.model.deleteOne({_id: categoryId})
            await Grocery.deleteMany({martcategory: categoryId})
        }
        catch (error) {
            throw error;
        }   
    }

    static async getOne(filterQuery) {
        const MartCategory = await this.model.findOne(filterQuery).populate({
            path: 'mart',
            select: '_id name',
            populate: {
                path: 'user',
                model: 'User',
                select: '_id name email'
            }
        })
        return MartCategory || false;
    }

}