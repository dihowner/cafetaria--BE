import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Carts from "../models/cart.js";
import MealService from "./MealService.js";
import SettingsService from "./SettingsService.js";
import SubMealService from "./SubMealService.js";

let cartResponse = {}
export default class CartService {
    static model = Carts;
    
    static async createCart(cartId, mealId, subMealId, packaging = {}, quantity = 1) {
        quantity = (quantity < 1) ? 1 : parseInt(quantity);
        if (subMealId !== undefined) {
            cartResponse = await this.addSubMealCart(cartId, subMealId, quantity)
        } else {
            cartResponse = await this.addMainMealCart(cartId, mealId, packaging, quantity)
        }
        return cartResponse;
    }

    static async addMainMealCart(cartId, mealId, packaging, quantity = 1) {
        const isMeal = await MealService.getOne({_id: mealId})
        
        if (!isMeal) throw new BadRequestError(`Meal with the given id (${mealId}) could not be found`)
        let mealName = isMeal.name;
        if (!isMeal.isAvailable) throw new BadRequestError(`Meal (${mealName}) is current unavailable`)

        const packagingLength = Object.keys(packaging).length;
        packaging = packagingLength > 0 ? this.hasPackagingQuantity(packaging) : {};

        // You can't order more packaging quantity than meal quantity itself...
        if (packagingLength > 0 && packaging.quantity > quantity) 
            throw new BadRequestError(`You can't order more packaging quantity (${packaging.quantity}) than meal quantity (${quantity}) itself`)

        // Meal packaging quantity can't be less than meal quantity itself...
        if (packagingLength > 0 && packaging.quantity < quantity) 
            throw new BadRequestError(`You need to place same packaging quantity with meal quantity (${quantity})`)
        
        // Check if meal packaging was required in the meal data created by vendor...
        const mealPackagingRequired = Object.values(isMeal.packaging).some(item => item.is_required);
        if (mealPackagingRequired && packagingLength < 1) throw new BadRequestError(`Please select a meal packaging`);

        // Is cart belonging to another vendor already ???
        const cartVendorExists = await this.getOne({cartId: cartId, vendor: {$ne: isMeal.vendor._id}})
        if (cartVendorExists) throw new BadRequestError(`You need to complete your current cart. You can only order from a vendor at once`)
        
        const cartExists = await this.getOne({cartId: cartId, meal: mealId})
        if (cartExists) {
            let updateData = {quantity: quantity, packaging: packaging}

            await this.model.findByIdAndUpdate(cartExists._id, {$set: updateData})
            return {
                message: `Cart (${mealName}) updated successfully`,
                data: {
                    identifier: cartId,
                    meal: mealName,
                    quantity: quantity
                }
            }
        } else {
            let cartData = new Carts({
                cartId: cartId,
                name: mealName,
                meal: mealId,
                quantity: quantity,
                price: isMeal.unitPrice,
                vendor: isMeal.vendor._id,
                packaging: packaging,
                type: 'meal'
            })
    
            await cartData.save();
            return {
                message: `Cart (${mealName}) added successfully`,
                data: {
                    identifier: cartId,
                    meal: mealName,
                    quantity: quantity
                }
            }
        }
    }

    static async addSubMealCart(cartId, subMealId, quantity = 1) {

        const isSubMeal = await SubMealService.getOne({_id: subMealId});
        if (!isSubMeal) throw new BadRequestError(`Meal with the given id (${subMealId}) could not be found`)

        let mealId = isSubMeal.meal._id;
        let subMealName = isSubMeal.name;

        const mealCartExists = await this.getOne({cartId: cartId, meal: mealId})

        if (!mealCartExists) throw new BadRequestError(`You need to order for the main meal`)
                
        const cartExists = await this.getOne({cartId: cartId, submeal: subMealId})
        let submealCategory = isSubMeal.category.name;

        if (cartExists) {
            await this.model.findByIdAndUpdate(cartExists._id, {$set: {quantity: quantity}})
            return {
                message: `Cart (${submealCategory} - ${subMealName}) updated successfully`,
                data: {
                    identifier: cartId,
                    meal: subMealName,
                    quantity: quantity
                }
            }
        } else {
            let cartData = new Carts({
                cartId: cartId,
                name: subMealName,
                meal: mealId,
                submeal: subMealId,
                quantity: quantity,
                price: isSubMeal.unitPrice,
                vendor: isSubMeal.meal.vendor,
                type: 'meal'
            })

            await cartData.save();

            return {
                message: `Cart (${submealCategory} - ${subMealName}) added successfully`,
                data: {
                    identifier: cartId,
                    meal: subMealName,
                    quantity: quantity
                }
            }

        }
    }

    static async deleteCart(cartId, mealSubMealId) {
        const isCart = await this.getOne({cartId: cartId, 
            $or:[{
                meal: mealSubMealId
            },
            {
                submeal: mealSubMealId
            }]
        })

        if (!isCart) throw new NotFoundError('Cart not found. Invalid cart reference provided')

        const cartType = !(isCart.submeal) ? 'meal' : 'submeal';

        if (cartType == 'meal') {
            await this.model.deleteMany({meal: mealSubMealId})
        } else {
            await this.model.deleteOne({submeal: mealSubMealId});
        }
        return {
            message: 'Cart deleted successfully'
        }
    }

    static async getCart(cartId) {
        const mealCarts = await this.model.find({cartId: cartId, submeal: { $exists: false }}).select('name quantity price meal packaging');
        const subMealCarts = await this.model.find({cartId: cartId, submeal: { $exists: true }});

        const categorizedCarts = mealCarts.map(meal => {
            const submeals = subMealCarts.filter(submealCart => submealCart.meal.equals(meal.meal));
            return { meal, submeals };
        });

        const subTotal = await this.cartPrice(categorizedCarts)

        return {data: categorizedCarts, cart_price: subTotal};
    }

    static async cartPrice(cartData) {
        let subTotal = 0, serviceCharge = 0;
        for (const cart of cartData) {
            const meal = cart.meal;
            const submeals = cart.submeals;

            let mealPrice = parseInt(meal.quantity) * parseFloat(meal.price)
            let subMealPrice = 0;
            let totalPackageAmount = 0;

            totalPackageAmount += this.cartPackagingPrice(meal) ;

            for (const submeal of submeals) {
                subMealPrice += parseInt(submeal.quantity) * parseFloat(submeal.price)
            }

            const overAll = mealPrice + subMealPrice + totalPackageAmount;
            subTotal += overAll;
        }
        
        const settings = await SettingsService.getOne({name: 'cart'});
        if (settings) {
            const settingsData = JSON.parse(settings.value.replace(/\\/g, ''));
            if (settingsData.chargesType == 'percent') {
                let percentFee = parseFloat(settingsData.percent);
                serviceCharge = parseFloat((subTotal * percentFee) / 100);
            } else {
                serviceCharge = parseFloat(settingsData.charges);
            }
        }
        
        const totalFee = subTotal + serviceCharge;

        return {
            subtotal: subTotal,
            service_charge: serviceCharge,
            total: totalFee
        };
    }

    static cartPackagingPrice(meal) {
        let totalPackageAmount = 0;
        if (meal.packaging) {
            let packageAmount = meal.packaging.styrofoam === undefined ? meal.packaging.plastic_plate : meal.packaging.styrofoam
            let packageQty = meal.packaging.quantity
            totalPackageAmount = parseFloat(packageAmount) * parseInt(packageQty)
        }
        return totalPackageAmount;
    }

    static hasPackagingQuantity(data) {
        if (data.quantity) {
            return data;
        }
        data.quantity = 1;
        return data;
    }
    
    static async getOne(filterQuery) {
        const cart = await this.model.findOne(filterQuery)
        return cart || false;
    }
}