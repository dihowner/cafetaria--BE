import FlutterwaveService from "./FlutterwaveService.js";
import PayoutBank from "../models/payoutbanks.js";

export default class BankService {
    static model = PayoutBank;
    
    static async fetchAllBanks() {
        return await PayoutBank.find({}).sort({bank_name: 1})
    }

    static async fetchPayoutBanks() {
        try {
            const retrieveBanks = await FlutterwaveService.fetchAllBanks();
            if (retrieveBanks.status && retrieveBanks.status.toLowerCase() == 'success') {
                const bankData = retrieveBanks.data;
                if(bankData.length > 0) {
                    // Clear all existing banks and add new
                    await PayoutBank.deleteMany({})
                    for (var i = 0; i < bankData.length; i++) {
                        let bankInfo = bankData[i];
                        let payoutData = new PayoutBank({
                            bank_name: bankInfo.name,
                            bank_code: bankInfo.code,
                            status: 1,
                        });
                        await payoutData.save();
                    }
                    return {
                        status: true,
                        message: 'Banks fetched successfully',
                        totalBank: `${bankData.length} Banks added`,
                    }
                }
                return {
                    status: false,
                    message: 'Error retrieving bank',
                }
            }
            return {
                status: false,
                message: 'Error retrieving bank',
            }
        }
        catch(error) {
            throw error
        }
    }

    static async verifyBankAccount(bankCode, accountNumber) {
        try {
            const retrieveBanks = await FlutterwaveService.verifyAccount(bankCode, accountNumber);
            return retrieveBanks;
        }
        catch(error) {
            throw error
        }
    }

    static async getOne(filterQuery) {
        const user = await this.model.findOne(filterQuery)
        return user || false;
    }
}