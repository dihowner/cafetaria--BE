import Vendors from "../models/vendor.js";
import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Meal from "../models/meal.js";
import filesystem from 'fs'

const populateUserData = [{ path: 'user', select: '_id name mobile_number email role' }];

export default class MealService {
    static model = Vendors;

    static async getOne(filterQuery) {
        const vendor = await this.model.findOne(filterQuery).populate(populateUserData)
        return vendor || null;
    }

}