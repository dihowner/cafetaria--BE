import express from "express";
import AuthMiddleware from "../middleware/auth.js";
import ValidatorMiddleware from "../middleware/validator.js";
import WithdrawalController from "../controllers/WithdrawalController.js";

const router = express.Router();

router.post('/initiate', AuthMiddleware.authenticateUserType('vendor'), ValidatorMiddleware.validateRequest(WithdrawalController.validateWithdrawal), 
                          WithdrawalController.initiateWithdrawal)
                          
router.get('/history', AuthMiddleware.authenticateUserType('vendor'), WithdrawalController.getWithdrawalHistory)
router.get('/view-history/:id', ValidatorMiddleware.validateObjectIds('id'), WithdrawalController.viewWithdrawalById)

export default router;
