import express from "express";
import * as WalletService from "../services/WalletService.js";
import { requireLoggedInUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/fund-wallet", requireLoggedInUser,  WalletService.fundWallet);
router.get("/verify-payment",  WalletService.verifyPayment);

export default router;
