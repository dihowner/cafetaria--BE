import User from "../models/user.js";
import Vendors from "../models/vendor.js";
import ResetPassword from "../models/reset_password.js";
import VerifyRegistration from "../models/verify-reg.js";
import WalletIn from "../models/wallet_in.js";
import WalletOut from "../models/wallet_out.js";
import Meal from "../models/meal.js";

export default class TrashController {
    static async trashModel (request, response) {
        try {
            return response.status(httpStatusCode.OK).json(await TrashController.processTrashModel(request.params.modelName))
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        } 
    }

    static async processTrashModel(modelName) {
        try {
            let deleteData = false;
            switch(modelName) {
                case 'users':
                    deleteData = await User.deleteMany({})
                    if (deleteData) {
                        await Vendors.deleteMany({})
                        await ResetPassword.deleteMany({})
                        await VerifyRegistration.deleteMany({})
                        await WalletIn.deleteMany({})
                        await WalletOut.deleteMany({})
                    } 
                break;
                case 'meals':
                    deleteData = await Meal.deleteMany({})
                break;
            }
            return deleteData
        } catch (error) {
            return response.status(error.status).json({message: error.message});
        } 
    }

}