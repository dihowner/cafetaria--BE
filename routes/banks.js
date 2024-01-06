import express from "express";
import BankController from "../controllers/BankController.js";
import ValidatorMiddleware from "../middleware/validator.js";

const router = express.Router();

router.get('/all-banks', BankController.fetchAllBanks)
router.post('/verify-account', ValidatorMiddleware.validateRequest(BankController.validateBankAccount), BankController.verifyBankAccount)
router.get('/fetch-banks', BankController.fetchPayoutBanks)

export default router;