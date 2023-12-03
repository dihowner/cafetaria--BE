import mongoose from "mongoose";
import User from "../models/user.js";
import WalletIn, { validateFundingRequest, validateWalletUpdate } from "../models/wallet_in.js";
import WalletOut from "../models/wallet_out.js";
import httpStatusCode from "http-status-codes";
import { uniqueReference } from '../utility/util.js'
import FlutterwaveService  from '../services/FlutterwaveService.js'
import {config} from "../utility/config.js"

export const fundWallet = async (request, response) => {
    let userId = request.user._id;
    const user = await User.findById(userId); 
    let payload = request.body;
    const validatePayload = validateFundingRequest(payload);
    if(validatePayload.error) return response.status(httpStatusCode.BAD_REQUEST).json({message : validatePayload.error.details[0].message})
    const txReference = uniqueReference();
    
    let reservePaymentData = {
        amount: payload.amount,
        currency : "NGN",
        tx_ref : txReference,
        redirect_url : config.FLW_CALLBACK_URL,        
        customer : {
            email : user.email,
            name : user.name,
            phonenumber : user.mobile_number
        },
        customization: {
            title: config.APP_NAME,
            description: `Top Up Your ${config.APP_NAME} Wallet`,
            logo: config.APP_LOGO
        }
    }

    const reservePayment = await FlutterwaveService.generatePaymentLink(reservePaymentData)
    // Payment reserving failed...
    if(reservePayment.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: reservePayment.error})
    
    // Let's save the wallet request in our DB...
    let walletData = new WalletIn({
        user_id: userId,
        reference: txReference,
        external_reference: '',
        amount: payload.amount,
        status: 'pending'
    })

    try {
        const createWallet = await walletData.save();
        return response.status(httpStatusCode.OK).json({message: "Wallet request initiated successfully", data: {
            _id: createWallet._id,
            user_id: createWallet.user_id,
            reference: createWallet.reference,
            amount: createWallet.amount,
            status: createWallet.status
        }, payment_link: reservePayment.data.link})
    }
    catch(error) {
        return response.status(httpStatusCode.INTERNAL_SERVER_ERROR).json({message: error.message});
    }
}

export const verifyPayment = async (request, response) => {
    let responseQuery = request.query;
    responseQuery.tx_channel = 'flutterwave';

    const validateQuery = validateWalletUpdate(responseQuery);

    if(validateQuery.error) return response.status(httpStatusCode.BAD_REQUEST).json({message: validateQuery.error.details[0].message})

    const paymentObject = {txId: responseQuery.transaction_id, tx_channel: responseQuery.tx_channel};

    const finalizePayment = await updateWalletIn(responseQuery.tx_ref, responseQuery.status, paymentObject)

    if(finalizePayment.status === true) {
        return response.status(httpStatusCode.OK).json({message: finalizePayment.message, data: finalizePayment.data})
    }
    else {
        let error_code = finalizePayment.error_code == 400 ? httpStatusCode.BAD_REQUEST : httpStatusCode.NOT_FOUND;
        return response.status(error_code).json({message: finalizePayment.message, data: finalizePayment.data})
    }
}

const updateWalletIn = async (transactionId, paymentStatus = 'cancelled', paymentObject = {}) => {
    let paymentResponse;
    switch(paymentStatus.toLowerCase()) {
        case 'cancelled':
            paymentResponse = await cancelPayment(transactionId);
            return paymentResponse;
        break;
        
        case 'successful':
            paymentResponse = await verifyTransaction(transactionId, paymentObject);
            // paymentResponse = await verifyTransaction(transactionId, {});
            return paymentResponse;
        break;
    }
}

const cancelPayment = async (transactionId) => {
    const getPayment = await WalletIn.findOne({reference: transactionId});
    if(!getPayment) return {status: false, error_code: 404, message: `Transaction reference (${transactionId}) does not exists`}

    const updatePayment = await WalletIn.findByIdAndUpdate(getPayment._id, { $set: {status: 'cancelled'} }, {new: true});
    if (!updatePayment)  return {status: false, error_code: 400, message: 'Error updating transaction'}
    return {status: true, message: 'Payment cancelled successfully', data: updatePayment};
}

const verifyTransaction = async (transactionId, paymentObject = {}) => {
    const getPayment = await WalletIn.findOne({reference: transactionId});
    if(!getPayment) return {status: false, error_code: 404, message: `Transaction reference (${transactionId}) does not exists`}
    
    if(paymentObject.tx_channel == 'flutterwave') {
        let externalRef = paymentObject.txId; // Reference from Flutterwave...
        const getFlwStatus = await verifyFlwPayment(transactionId, externalRef)
        if(getFlwStatus) {
            return approvePayment(transactionId, externalRef);
        }
        return {status: false, error_code: 400, message: `Error verifying transaction (${externalRef}) with Flutterwave `}
    }
    return {status: false, error_code: 400, message: 'Unknown transaction gateway'}
}

const approvePayment = async (transactionId, externalReference = "") => {
    const getPayment = await WalletIn.findOne({reference: transactionId, status: 'pending'});
    if(!getPayment) return {status: false, error_code: 404, message: `Transaction reference (${transactionId}) does not exists or already treated`}
    const currentUserBlc = await getAvailableBalance(getPayment.user_id);
    const newBalance = parseFloat(currentUserBlc) + parseFloat(getPayment.amount);

    const updatePayment = await WalletIn.findByIdAndUpdate(getPayment._id, {
        $set: { old_balance: currentUserBlc, new_balance: newBalance, external_reference: externalReference, status: "successful"}
    }, {new: true});
    if(!updatePayment) return {status: false, error_code: 400, message: 'Error approving payment'};
    return {status: true, message: 'Payment approved successfully', data: updatePayment};
}

const getAvailableBalance = async (userId = '') => {
    try {
        const outCondition = userId ? { $match: { user_id: new mongoose.Types.ObjectId(userId), status: 'successful' } } : { $match: { status: 'successful' } };
        const inCondition = userId  ? { user_id: new mongoose.Types.ObjectId(userId) } : {}; // Match only if userId is provided
        
        const walletInTotal = await WalletIn.aggregate([
            {
                $match: {
                ...inCondition,
                status: { $in: ['successful', 'refunded'] }
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
    catch (error) {
        throw error;
    }
}

// For getting How much was spent or credit by a specific user.
const userWalletOut = async(userId = "") => {
    try {
        const matchStage = userId ? { $match: { user_id: new mongoose.Types.ObjectId(userId), status: 'successful' } } : { $match: { status: 'successful' } };

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
    } catch (error) {
        throw error;
    }
}  

const userWalletIn = async(userId = "") => {
    try {
        const matchStage = userId  ? { user_id: new mongoose.Types.ObjectId(userId) } : {}; // Match only if userId is provided

        const result = await WalletIn.aggregate([
            {
                $match: {
                  ...matchStage,
                  status: { $in: ['successful', 'refunded'] }
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
    } catch (error) {
        throw error;
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

export { getAvailableBalance };