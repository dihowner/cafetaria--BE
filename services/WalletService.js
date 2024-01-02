import mongoose from "mongoose";
import WalletIn from "../models/wallet_in.js";
import WalletOut from "../models/wallet_out.js";
import { uniqueReference } from '../utility/util.js'
import FlutterwaveService  from '../services/FlutterwaveService.js'
import {config} from "../utility/config.js"
import UserService from "./UserService.js";
import { BadRequestError, NotFoundError, UnAuthorizedError } from "../helpers/errorHandler.js";

const PENDING_STATUS = 'pending';
const ESCROW_STATUS = 'escrow';
const APPROVED_STATUS = 'successful';
const REFUND_STATUS = 'refunded';
const CANCELLED_STATUS = 'cancelled';
const REJECTED_STATUS = 'failed';


export default class WalletService {
    static model = WalletIn;
    
    static async getWalletIn(filterQuery) {
        const wallet = await this.model.findOne(filterQuery)
        return wallet || false;
    }

    static async fundWallet(user, amount) {
        const userId = user._id;
        const isUserAuthorized = await UserService.getOne({_id: userId, roles: 'user'})
        if (!isUserAuthorized) throw new UnAuthorizedError

        const txReference = uniqueReference();
        
        let reservePaymentData = {
            amount: amount,
            currency : "NGN",
            tx_ref : txReference,
            redirect_url : config.FLW_CALLBACK_URL,        
            customer : {
                email : isUserAuthorized.email,
                name : isUserAuthorized.name,
                phonenumber : isUserAuthorized.mobile_number
            },
            customization: {
                title: config.APP_NAME,
                description: `Top Up Your ${config.APP_NAME} Wallet`,
                logo: config.APP_LOGO
            }
        }

        const reservePayment = await FlutterwaveService.generatePaymentLink(reservePaymentData)
        // Payment reserving failed...
        if (reservePayment.error) throw new BadRequestError(reservePayment.error)

        // Let's save the wallet request in our DB...
        let walletData = new WalletIn({
            user_id: userId,
            reference: txReference,
            external_reference: '',
            amount: amount,
            status: PENDING_STATUS
        })
        const createWallet = await walletData.save();
        if (!createWallet) throw new BadRequestError('Error initiating funding request')
        return {
                message: "Wallet request initiated successfully", data: {
                _id: createWallet._id,
                user_id: userId,
                reference: txReference,
                amount: amount,
                status: PENDING_STATUS
            }, 
            payment_link: reservePayment.data.link
        }
    }

    static async updateWalletIn(transactionId, paymentStatus = 'cancelled', paymentObject = {}) {
        let paymentResponse;
        switch(paymentStatus.toLowerCase()) {
            case 'cancelled':
                paymentResponse = await this.cancelPayment(transactionId);
                return paymentResponse;
            break;
            
            case 'successful':
                paymentResponse = await this.verifyTransaction(transactionId, paymentObject);
                return paymentResponse;
            break;
        }
        return { transactionId, paymentStatus, paymentObject }
    }

    static async verifyTransaction(transactionId, paymentObject = {}) {
        const getPayment = await this.getWalletIn({reference: transactionId});
        if(!getPayment) throw new NotFoundError(`Transaction reference (${transactionId}) does not exists`)
        if(paymentObject.tx_channel == 'flutterwave') {
            let externalRef = paymentObject.txId; // Reference from Flutterwave...
            const getFlwStatus = await verifyFlwPayment(transactionId, externalRef)
            if(getFlwStatus) {
                return this.approvePayment(transactionId, externalRef);
            }
            return {status: false, error_code: 400, message: `Error verifying transaction (${externalRef}) with Flutterwave `}
        }
        return {status: false, error_code: 400, message: 'Unknown transaction gateway'}
    }

    static async approvePayment (transactionId, externalReference = "") {
        const getPayment = await WalletIn.findOne({reference: transactionId, status: 'pending'});
        if(!getPayment) throw new NotFoundError(`Transaction reference (${transactionId}) does not exists or already treated`)
        const currentUserBlc = await this.getAvailableBalance(getPayment.user_id);
        const newBalance = parseFloat(currentUserBlc) + parseFloat(getPayment.amount);

        const updatePayment = await WalletIn.findByIdAndUpdate(getPayment._id, {
            $set: { old_balance: currentUserBlc, new_balance: newBalance, external_reference: externalReference, status: APPROVED_STATUS}
        }, {new: true});
        if(!updatePayment) throw new BadRequestError('Error approving payment');
        return { status: true, message: 'Payment approved successfully', data: updatePayment};
    }

    static async cancelPayment (transactionId) {
        const getPayment = await this.getWalletIn({reference: transactionId, status: 'pending'});
        if(!getPayment) throw new NotFoundError(`Transaction reference (${transactionId}) does not exists or already treated`)
    
        const updatePayment = await WalletIn.findByIdAndUpdate(getPayment._id, { $set: {status: CANCELLED_STATUS} }, {new: true});
        if (!updatePayment) throw new BadRequestError('Error declining payment');
        return {
            status: true, 
            message: 'Payment cancelled successfully', 
            data: {
                _id: updatePayment._id,
                user_id: updatePayment.user_id,
                reference: updatePayment.reference,
                amount: updatePayment.amount,
                status: updatePayment.status,
            }
        };
    }
    
    static async getEscrowBalance(userId) {
        const inCondition = userId  ? { user_id: new mongoose.Types.ObjectId(userId) } : {}; // Match only if userId is provided
        
        const walletInTotal = await WalletIn.aggregate([
            {
                $match: {
                ...inCondition,
                status: { $in: [ESCROW_STATUS] }
                },
            },
            {
                $group: {
                    _id: null,
                    totalWalletIn: { $sum: '$amount' },
                },
            },
        ]);
        const availableBalance = (walletInTotal[0]?.totalWalletIn || 0);
        return availableBalance;
    }

    static async getAvailableBalance(userId) {
        const outCondition = userId ? { $match: { user_id: new mongoose.Types.ObjectId(userId), status: APPROVED_STATUS } } : { $match: { status: APPROVED_STATUS } };
        const inCondition = userId  ? { user_id: new mongoose.Types.ObjectId(userId) } : {}; // Match only if userId is provided
        
        const walletInTotal = await WalletIn.aggregate([
            {
                $match: {
                ...inCondition,
                status: { $in: [APPROVED_STATUS, REFUND_STATUS] }
                },
            },
            {
                $group: {
                    _id: null,
                    totalWalletIn: { $sum: '$amount' },
                },
            },
        ]);
  
        const walletOutTotal = await WalletOut.aggregate([
            outCondition,
            {
                $group: {
                    _id: null,
                    totalWalletOut: { $sum: '$amount' },
                },
            },
        ]);
        const availableBalance = (walletInTotal[0]?.totalWalletIn || 0) - (walletOutTotal[0]?.totalWalletOut || 0);
        return availableBalance;
    }

    // For getting How much was spent or credit by a specific user.
    static async userWalletOut(userId = "") {
        const matchStage = userId ? { $match: { user_id: new mongoose.Types.ObjectId(userId), status: APPROVED_STATUS } } : { $match: { status: APPROVED_STATUS } };

        const result = await WalletOut.aggregate([
            matchStage,
            {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
            },
            },
        ]);
        return result.length > 0 ? result[0].totalAmount.toFixed(2) : 0;
    }

    static async userWalletIn(userId = "") {
        const matchStage = userId  ? { user_id: new mongoose.Types.ObjectId(userId) } : {}; // Match only if userId is provided
        const result = await WalletIn.aggregate([
            {
                $match: {
                    ...matchStage,
                    status: { $in: [APPROVED_STATUS, REFUND_STATUS] }
                },
            },
            {
                $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                },
            },
        ]);
        return result.length > 0 ? result[0].totalAmount.toFixed(2) : 0;
    }
}

// Verify if Flutterwave received the right txId for the payment and if successful....
const verifyFlwPayment = async (referenceId, flwRefId) => {
    const verifyPayment = await FlutterwaveService.verifyPayment(flwRefId);

    if(verifyPayment.status === "success") {
        if(verifyPayment.data.status === "successful" && verifyPayment.data.tx_ref == referenceId) {
            return true;
        }
        return false;
    }
    return false;
}