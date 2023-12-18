import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import WalletController from "../controllers/WalletController.js";

const router = express.Router();

router.post("/fund-wallet", AuthMiddleware.requireLoggedInUser, ValidatorMiddleware.validateRequest(WalletController.validateFundingRequest),  WalletController.fundWallet);
router.get("/verify-payment", ValidatorMiddleware.validateRequest(WalletController.validateWalletUpdate), WalletController.verifyPayment);

export default router;
