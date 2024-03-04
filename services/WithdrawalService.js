import { BadRequestError, UnAuthorizedError } from "../helpers/errorHandler.js";
import Withdrawals from "../models/withdrawal.js";
import UserService from "./UserService.js";
import { niceDateFormat, uniqueReference, explodeString } from '../utility/util.js'
import WalletService from "./WalletService.js";
import WalletOut from "../models/wallet_out.js";
import { config } from "../utility/config.js";
import { readFile } from "../helpers/fileReader.js";
import { sendEmail } from "../helpers/sendEmail.js";

const populateData = [{ path: 'user', select: '_id name email' }, { path: 'wallet', select: '_id old_balance amount new_balance' }];

export default class WithdrawalService {
    static model = Withdrawals;
    
    static async initiateWithdrawal(userId, amount, transact_pin) {
        try {
            const fileContent = await readFile("mailer/templates/withdrawal.html")

            let amountWithdraw = parseFloat(amount)
            const user = await UserService.getOne({_id: userId, 'roles': 'vendor'})
            if (!user) throw new UnAuthorizedError();
            if (Object.keys(user.bank).length == 0 || user.bank == undefined) throw new BadRequestError('Bankin information is missing, kindly update your bank information')
            if (user.transact_pin != transact_pin) throw new BadRequestError(`Incorrect transaction pin (${transact_pin}) supplied`)

            const availableBalance = await WalletService.getAvailableBalance(userId)
            if (availableBalance < amountWithdraw) throw new BadRequestError(`Insufficient wallet balance (${config.CURRENCY} ${availableBalance.toFixed(2)})`)
            
            let newBalance = availableBalance - amountWithdraw
            const txReference = uniqueReference();
            const userBank = user.bank

            let walletOutData = new WalletOut({
                user_id: userId,
                reference: txReference,
                old_balance: availableBalance,
                amount: amountWithdraw,
                new_balance: newBalance,
                status: 'successful'
            })
            const deductWallet = await walletOutData.save();

            if (!deductWallet) throw new BadRequestError('Error creating withdrawal');

            let withdrawalData = new Withdrawals({
                user: userId,
                wallet: deductWallet._id,
                bank: userBank,
                reference: txReference,
                amount: amountWithdraw,
                status: 'pending'
            })
            const finalizeWithdraw = await withdrawalData.save()

            if (!finalizeWithdraw) throw new BadRequestError('Error creating withdrawal');
            const amountComma = amountWithdraw.toLocaleString(2);

            const mailParams = {
                replyTo: config.system_mail.no_reply,
                receiver: user.email,
                subject: `${explodeString(user.name)[0]}, ${config.CURRENCY} ${amountComma} has left your account`
            }

            const mailData = {
                customer_name: user.name,
                transactionReference: txReference,
                withdrawalDate: niceDateFormat(new Date()),
                amountWithdraw: amountComma,
                newBalance: newBalance.toLocaleString(2),
                bankName: userBank.bankName,
                accountName: userBank.accountName,
                accountNumber: userBank.accountNumber,
                supportemail: config.system_mail.support
            };
            await sendEmail(mailData, fileContent, mailParams)

            return {
                message: `Success. Your withdrawal of ${config.CURRENCY} ${amountComma} was successful.`,
                data: {
                    id: finalizeWithdraw._id,
                    reference: txReference,
                    amount: amountComma,
                    user: {
                        id: user._id,
                        name: user.name
                    }
                }
            }

        } catch (error) {
            throw error;
        }
    }

    static async getWithdrawalHistory(userId) {
        try {
            const user = await UserService.getOne({_id: userId, 'roles': 'vendor'})
            if (!user) throw new UnAuthorizedError();

            const histories = await this.model.find({user: userId}).select("_id reference amount status created_at updated_at").sort({_id: -1})
            return histories;
        }
        catch (error) {
            throw error;
        }
    }
    
    static async viewWithdrawalHistory(id) {
        try {
            const histories = await this.getOne({_id: id})
            return histories;
        }
        catch (error) {
            throw error;
        }
    }

    static async getOne(filterQuery) {
        const withdrawal = await this.model.findOne(filterQuery).populate(populateData)
        return withdrawal || false;
    }
}