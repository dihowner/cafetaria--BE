import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";
import GroceryCategories from "../models/grocerycategory.js";
import { paginate } from "../utility/paginate.js";

const populateAdminData = [ { path: 'created_by', select: '_id name email' }]

export default class GroceryCategoryService {
    static model = GroceryCategories;
    
    static async createCategory(adminId, categoryName) {
        try {
            
            const isCategoryExist = await this.getOne({name: categoryName})
            if (isCategoryExist) throw new BadRequestError(`Grocery Category (${categoryName}) already exists`)
            
            let categoryData = new GroceryCategories({name: categoryName, created_by: adminId})
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
            const isCategoryExist = await this.getOne({_id: {$ne: categoryId}, name: categoryName});
            if (isCategoryExist) throw new NotFoundError(`Grocery Category (${categoryName}) already exists`)

            const updateCategory = await this.model.findByIdAndUpdate(categoryId, 
                { $set: {name: categoryName} }, { new: true });
            if (!updateCategory) throw new BadRequestError("Error updating category. Please try again later")
            return {
                message: "Grocery category update request was successful",
                data: updateCategory
            }
        }
        catch (error) {
            throw error;
        }   
    }
    
    static async deleteCategory(categoryId) {
        try {
            const category = await this.getOne({_id: categoryId})
            if (!category) throw new NotFoundError(`Category (${categoryId}) could not be found`)

            await this.model.deleteOne({_id: categoryId})
            await Grocery.deleteMany({martcategory: categoryId})
        }
        catch (error) {
            throw error;
        }   
    }

    static async getCategory(categoryId) {
        try {
            const category = await this.getOne({_id: categoryId})
            if (!category) throw new NotFoundError(`Grocery category with the given id (${categoryId}) could not be found`)
            return category
        }
        catch (error) {
            throw error;
        }   
    }

    static async getCategories(filterOption) {
        try {
            const isSelectOption = filterOption.selectOption;
            const pageOption = {page: filterOption.page};
            const category = isSelectOption === true ? await this.model.find({}).populate(populateAdminData).sort({_id: -1}) : await paginate(await this.model.find({}).populate(populateAdminData).sort({_id: -1}), pageOption);
            return category
        }
        catch (error) {
            throw error;
        }   
    }

    static async getOne(filterQuery) {
        const category = await this.model.findOne(filterQuery).populate(populateAdminData)
        return category || false;
    }

}