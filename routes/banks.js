import express from "express";
import BankController from "../controllers/BankController.js";

const router = express.Router();

router.get('/all-banks', BankController.fetchAllBanks)
router.get('/fetch-banks', BankController.fetchPayoutBanks)

export default router;
