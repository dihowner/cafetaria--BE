import { BadRequestError, NotFoundError } from "../helpers/errorHandler.js";
import Carts from "../models/cart.js";
import { config } from "../utility/config.js";
import { uniqueReference } from "../utility/util.js";
import FlutterwaveService from "./FlutterwaveService.js";
import MealService from "./MealService.js";
import SettingsService from "./SettingsService.js";
import SubMealService from "./SubMealService.js";
import UserService from "./UserService.js";
import VendorService from "./VendorService.js";
import Orders from "../models/orders.js";
import WalletService from "./WalletService.js";
import { readFile } from "../helpers/fileReader.js";
import { sendEmail } from "../helpers/sendEmail.js";

const PENDING_STATUS = 'Pending';
const ACCEPTED_STATUS = 'Accepted';
const DISPATCHING_STATUS = 'Dispatching';
const DELIVERED_STATUS = 'Delivered';
const CANCELLED_STATUS = 'Cancelled';

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
        const mainCarts = await this.model.find({cartId: cartId, submeal: { $exists: false }}).select('name quantity price meal packaging deliveryInfo');

        if (!mainCarts) throw new NotFoundError(`Cart with the given id (${cartId}) could not be found`)

        const mainCartsWithoutDeliveryInfo = mainCarts.map(cart => {
            const cartObj = cart.toObject();
            delete cartObj.deliveryInfo;
            return cartObj;
        });

        // Fetch sub meal carts
        const subMealCarts = await this.model.find({cartId: cartId, submeal: { $exists: true }});

        // Categorize carts by main meals and their corresponding sub meals
        const categorizedCarts = mainCartsWithoutDeliveryInfo.map(mainMeal => {
            const submeals = subMealCarts.filter(submealCart => submealCart.meal.equals(mainMeal.meal));
            return { meal: mainMeal, submeals };
        });

        // Calculate subtotal, service charge of the cart
        const subTotal = await this.cartPrice(categorizedCarts)

        // Return categorized carts and subtotal
        return {data: categorizedCarts, cart_price: subTotal, deliveryInfo: mainCarts[0].deliveryInfo};
    }

    static async cartPrice(cartData) {
        let subTotal = 0, serviceCharge = 0;
        for (const cart of cartData) {
            const meal = cart.meal;
            const submeals = cart.submeals;

            // Calculate price of main meal
            let mealPrice = parseInt(meal.quantity) * parseFloat(meal.price);
            // Calculate price of main meal packaging
            let totalPackageAmount = this.cartPackagingPrice(meal);

            // Calculate price of sub meals
            let subMealPrice = submeals.reduce((total, submeal) => {
                return total + parseInt(submeal.quantity) * parseFloat(submeal.price);
            }, 0);

            // Calculate overall price including main meal, sub meals, and packaging
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
        
        // Calculate total price including service charge
        const totalFee = subTotal + serviceCharge;

        return {
            subtotal: subTotal,
            service_charge: serviceCharge,
            total: totalFee
        };
    }

    static async cartPriceByCartId(cartId) {
        const mainCarts = await this.model.find({cartId: cartId, submeal: { $exists: false }}).select('name quantity price meal packaging');
        const subMealCarts = await this.model.find({cartId: cartId, submeal: { $exists: true }});

        // Categorize carts by main meals and their corresponding sub meals
        const categorizedCarts = mainCarts.map(mainMeal => {
            const submeals = subMealCarts.filter(submealCart => submealCart.meal.equals(mainMeal.meal));
            return { meal: mainMeal, submeals };
        });

        // Calculate subtotal, service charge of the cart
        const subTotal = await this.cartPrice(categorizedCarts)
        return subTotal;
    }
    
    static async checkOutCart(userId, cartData) {

        const { cartId, payment_method, deliveryInfo} = cartData;

        const mainCarts = await this.model.find({cartId: cartId, submeal: { $exists: false }}).select('name quantity price meal packaging');
        if (!mainCarts) throw new NotFoundError(`Cart with the given id (${cartId}) could not be found`)

        const cartPrice = await this.cartPriceByCartId(cartId);
        let totalPrice = cartPrice.total;

        const isUserAuthorized = await UserService.getOne({_id: userId});

        const checkOutFinalizeUrl = new URL(config.CART_VERIFY_PAYMENT_CALLBACK_URL);
        checkOutFinalizeUrl.searchParams.append('cartId', cartId);
        checkOutFinalizeUrl.searchParams.append('type', 'checkout');

        const paymentOption = payment_method == 'card' ? ['card'] : ['ussd', 'banktransfer'];
        
        // Let update the cart with the delivery information we have...
        const updateCart = await this.model.updateOne(
            {cartId: cartId}, {deliveryInfo}
        )

        const txReference = uniqueReference();
        let reservePaymentData = {
            amount: parseFloat(totalPrice),
            amount: parseFloat(2500),
            currency : config.CURRENCY,
            tx_ref : txReference,
            redirect_url : checkOutFinalizeUrl, 
            payment_options: paymentOption,
            customer : {
                email : isUserAuthorized.email,
                name : isUserAuthorized.name,
                phonenumber : isUserAuthorized.mobile_number
            },
            customization: {
                title: config.APP_NAME,
                description: `${config.APP_NAME} - Checkout Your Order`,
                logo: config.APP_LOGO
            }
        }

        // Generate a payment link for client to pay
        const reservePayment = await FlutterwaveService.generatePaymentLink(reservePaymentData)
        // Payment reserving failed...
        if (reservePayment.error) throw new BadRequestError(reservePayment.error)
        return reservePayment

    }

    static async verifyCartPayment(paymentData) {
        const {
            cartId, type, status = 'failed', tx_ref, transaction_id
        } = paymentData;
        
        if (type == 'checkout' && status.toLowerCase() == 'successful') {
            const referenceId = tx_ref;
            try {
                const verifyPayment = await FlutterwaveService.verifyPayment(transaction_id);
                let verifyPaymentData = verifyPayment.data;
                if (verifyPayment.status === "success" && verifyPayment.data.status === "successful" && verifyPaymentData.tx_ref == referenceId) {
                    const getCart = await this.getCart(cartId)
                    const orderDetail = getCart.data
                    const userEmail = verifyPaymentData.customer.email
                    
                    if (!userEmail) throw new BadRequestError(`Customer email not found in payment data. Kindly inform admin. Payment Reference : ${referenceId}`)
                    
                    const user = await UserService.getOne({email: userEmail})
                    if (!user) throw new BadRequestError(`User not found with provided email. Kindly inform admin. Payment Reference : ${referenceId}`)
                    
                    // Process payment and create order
                    const paymentData = {
                        reference : referenceId, 
                        transactionId : transaction_id,
                        amountPaid: verifyPaymentData.amount
                    }

                    const orderData = await this.createOrder(user, getCart, orderDetail, paymentData);
    
                    return {
                        message: 'Order received successfully. You will be notified shortly of your order delivery',
                        data: orderData
                    }
                }
                throw new BadRequestError('Payment failed, please try again')
            } catch (error) {
                throw new BadRequestError('Payment failed. ' + error.message);
            }
        }
        throw new BadRequestError('Payment failed, please try again')
    }

    static async createOrder(user, getCart, orderDetail, paymentInfo) {
        const userOrderHTML = await readFile("mailer/templates/order-received.html")
        const vendorOrderHTML = await readFile("mailer/templates/vendor-order-received.html")

        const userId = user._id;

        const firstMealData = getCart.data[0].meal;
        const mealId = firstMealData.meal; //Get the first meal from the array of meals to retrieve the vendor...
        const deliveryInfo = getCart.deliveryInfo
        const mealInfo = await MealService.getOne({_id: mealId})
        const vendorId = mealInfo.vendor?._id;
        const cartPrice = getCart.cart_price;
        const referenceId = paymentInfo.reference
        const subTotal = parseFloat(cartPrice.subtotal); // Vendor price
        const totalPrice = parseFloat(cartPrice.total); // amount with service fee & delivery fee
        const serviceCharge = parseFloat(cartPrice.service_charge); // service fee & delivery fee
        const deliveryAddress = deliveryInfo.address;
        const vendorData = await VendorService.getOne({_id: vendorId});

        const userMailData = {
            customer_name: user.name,
            order_id: referenceId,
            order_total: totalPrice.toLocaleString(),
            payment_status: "<strong style='color: green;'>PAID</strong>",
            order_details: this.generateMealTable(getCart.data)
        };

        const userMailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: user.email,
            subject: `Order received successfully`
        }

        const vendorMailData = {
            vendor: vendorData.store_name,
            customer_name: user.name,
            delivery_address: deliveryAddress,
            order_id: referenceId,
            order_total: subTotal.toLocaleString(),
            payment_status: "<strong style='color: green;'>PAID</strong>",
            order_details: this.generateMealTable(getCart.data)
        };

        const vendorMailParams = {
            replyTo: config.system_mail.no_reply,
            receiver: vendorData.user.email,
            subject: `New Meal Order (${referenceId}) Notification`
        }

        // Incase of wallet system is being added later
        const currentUserBlc = parseFloat(await WalletService.getAvailableBalance(userId))
        const amountPaid = parseFloat(paymentInfo.amountPaid);
        const newUserBalance = parseFloat(currentUserBlc) + parseFloat(amountPaid);

        // For future sake, wallet system has been implemented already...
        // Let's save the money that was paid into the user's wallet and deduct it immediately
        const userWalletInData = {
            user_id: userId,
            reference: referenceId,
            external_reference: paymentInfo.transactionId,
            old_balance: currentUserBlc,
            amount: amountPaid,
            new_balance: newUserBalance,
            status: 'successful'
        }

        const outBalance = parseFloat(newUserBalance) - parseFloat(amountPaid);
        const userWalletOutData = {
            user_id: userId,
            reference: referenceId,
            old_balance: newUserBalance,
            amount: amountPaid,
            new_balance: outBalance,
            status: 'successful'
        }

        // Let's create a wallet in data for the vendor but in escrow format, ie money is not paid immediately to the vendor...

        // Incase of wallet system is being added later
        // old_balance and new_balance of the vendor was set to zero 
        // because it's not in their wallet yet, once the meal is approved then we update with valid record

        const vendorWalletInData = {
            vendor: vendorId,
            reference: referenceId,
            external_reference: paymentInfo.transactionId,
            old_balance: 0,
            amount: subTotal,
            new_balance: 0,
            status: 'escrow'
        }

        // create the order...
        let orderData = new Orders({
            orderId: referenceId,
            user: userId,
            vendor: vendorId,
            orderDetail: orderDetail,
            subTotal: subTotal,
            serviceCharge: serviceCharge,
            total: totalPrice,
            deliveryStatus: PENDING_STATUS,
            paymentStatus: 'Paid',
            deliveryInformation: deliveryInfo
        } )              
        
        const createOrder = await orderData.save();
        if (!createOrder) throw new BadRequestError(`Error creating order, kindly notify admin`);
        await Promise.all([
            WalletService.createWallet('inward', userWalletInData),
            WalletService.createWallet('outward', userWalletOutData),
            WalletService.createWallet('inward', vendorWalletInData),
            sendEmail(userMailData, userOrderHTML, userMailParams),
            sendEmail(vendorMailData, vendorOrderHTML, vendorMailParams)
        ]);
        
        return {
            _id: createOrder._id,
            orderId: referenceId,
            total: parseFloat(totalPrice),
            deliveryStatus: PENDING_STATUS,
            paymentStatus: 'Paid'
        };
    }

    static generateMealTable (orderData) {
        let listItems = '';
        orderData.forEach(item => {
            let mealName = item.meal.name;
            let quantity = item.meal.quantity;
            let submealNames = item.submeals.map(submeal => submeal.name).join(', ');
            
            let submeals = item.submeals.map(submeal => {
                return `${submeal.name} (${submeal.quantity})`;
            }).join(', ');

            let listItem = `<li><strong>Meal:</strong> ${mealName} (${quantity})</li>`;
            if (submealNames) {
                listItem += `<li><strong>Submeals: </strong> ${submeals}</li>`;
            }
            listItems += listItem;
        });

        return `<ul style='list-style-type: none'>${listItems}</ul>`;
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